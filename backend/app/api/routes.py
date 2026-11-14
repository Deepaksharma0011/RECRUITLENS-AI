import uuid
import logging
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, UploadFile, File, HTTPException, Body, Depends, Response
from app.models.schemas import (
    JDParseRequest, JDParseResponse, JDSearchRequest, JDSearchResponse,
    CandidateParsedInfo, CandidateScoreResult,
    EvaluationResultsResponse, CandidateExplanationResponse,
    CandidateQuestionsResponse, CandidateEmailsResponse,
    OnboardingPlanResponse, JDOptimizeRequest, JDOptimizeResponse,
    WhatIfRequest, WhatIfResponse, CandidateMetadataUpdate
)
from app.parsing.pdf_parser import extract_text_from_pdf
from app.parsing.docx_parser import extract_text_from_docx
from app.parsing.resume_parser import parse_resume_content
from app.parsing.jd_parser import parse_job_description
from app.scoring.ranker import rank_candidates
from app.llm.explainer import generate_score_explanation
from app.llm.question_generator import generate_personalized_interview_questions
from app.llm.email_generator import generate_candidate_emails
from app.llm.onboarding_generator import generate_onboarding_plan
from app.llm.jd_generator import generate_jd_from_search, get_online_job_title_suggestions
from app.storage.session_store import SessionStore, create_session, require_session
from app.scoring.bias_mitigator import sanitize_demographic_bias


logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/session", status_code=201)
async def start_session(response: Response):
    response.headers["Cache-Control"] = "private, no-store"
    return {"token": await create_session()}


@router.post("/upload-resumes", response_model=List[CandidateParsedInfo])
async def upload_resumes(
    files: List[UploadFile] = File(...),
    session_store: SessionStore = Depends(require_session),
):
    """Validate the full batch before replacing the current resumes."""
    candidates = []
    parsed_candidates = []
    errors = []
    for file in files:
        filename = file.filename or "Unnamed file"
        extension = filename.lower().rpartition(".")[2] if "." in filename else ""
        if extension not in {"pdf", "docx", "txt"}:
            errors.append(f"{filename}: use PDF, DOCX, or TXT. Convert old .doc files to .docx.")
            continue
        try:
            content = await file.read()
            if extension == "pdf":
                raw_text = extract_text_from_pdf(content)
            elif extension == "docx":
                raw_text = extract_text_from_docx(content)
            else:
                raw_text = content.decode("utf-8-sig")
                if "\x00" in raw_text:
                    raise ValueError("Invalid plain text file")

            if not raw_text.strip():
                errors.append(f"{filename}: no readable text. Use a text-based document or run OCR first.")
                continue

            parsed = parse_resume_content(raw_text, filename, f"cand_{uuid.uuid4().hex}")
            sanitized_text, _ = sanitize_demographic_bias(raw_text, parsed["name"])
            result = CandidateParsedInfo(**parsed, sanitized_text=sanitized_text)
            candidates.append(parsed)
            parsed_candidates.append(result)
        except Exception:
            logger.warning("Resume parsing failed for a %s file.", extension)
            errors.append(f"{filename}: could not read this file. Check the format and try again.")

    if errors:
        raise HTTPException(status_code=400, detail=" ".join(errors))
    if not candidates:
        raise HTTPException(status_code=400, detail="No files uploaded.")

    session_store.replace_resumes(candidates)
    return parsed_candidates


@router.post("/parse-jd", response_model=JDParseResponse)
async def parse_jd(payload: JDParseRequest, session_store: SessionStore = Depends(require_session)):
    """Accept job description text, extract title, required skills and preferred skills."""
    if not payload.jd_text or not payload.jd_text.strip():
        raise HTTPException(status_code=400, detail="Job description text cannot be empty.")
        
    parsed_jd = parse_job_description(payload.jd_text, payload.job_title)
    session_store.set_jd(parsed_jd)
    
    return JDParseResponse(
        job_title=parsed_jd["job_title"],
        required_skills=parsed_jd["required_skills"],
        preferred_skills=parsed_jd["preferred_skills"],
        raw_text=parsed_jd["raw_text"],
        total_skills_count=parsed_jd["total_skills_count"]
    )

@router.post("/search-jd", response_model=JDSearchResponse)
async def search_job_description(payload: JDSearchRequest):
    """Search/generate a professional Job Description on-the-fly for any searched job title."""
    if not payload.query or not payload.query.strip():
        raise HTTPException(status_code=400, detail="Search query cannot be empty.")
    result = generate_jd_from_search(payload.query)
    return JDSearchResponse(**result)

@router.get("/suggest-job-titles")
async def suggest_job_titles(q: str):
    """Fetch online related job title suggestions dynamically for any keyword."""
    if not q or not q.strip():
        return []
    suggestions = get_online_job_title_suggestions(q)
    return {"query": q, "suggestions": suggestions}

@router.get("/score", response_model=List[CandidateScoreResult])
async def score_candidates(session_store: SessionStore = Depends(require_session)):
    """Generate sentence transformer embeddings, compute match scores, and rank all candidates."""
    if not session_store.jd_info:
        raise HTTPException(status_code=400, detail="Job description has not been provided or parsed yet.")
    if not session_store.resumes:
        raise HTTPException(status_code=400, detail="No candidate resumes have been uploaded yet.")
        
    resumes_list = list(session_store.resumes.values())
    ranked_results = rank_candidates(resumes_list, session_store.jd_info)
    session_store.set_scores(ranked_results)
    
    return [CandidateScoreResult(**res) for res in ranked_results]

@router.get("/explain/{candidate_id}", response_model=CandidateExplanationResponse)
async def explain_candidate_score(candidate_id: str, session_store: SessionStore = Depends(require_session)):
    """Generate a GPT explanation of why the candidate scored their specific match score."""
    candidate_eval = session_store.get_candidate_score(candidate_id)
    if not candidate_eval:
        if session_store.resumes and session_store.jd_info:
            resumes_list = list(session_store.resumes.values())
            ranked = rank_candidates(resumes_list, session_store.jd_info)
            session_store.set_scores(ranked)
            candidate_eval = session_store.get_candidate_score(candidate_id)
            
    if not candidate_eval:
        raise HTTPException(status_code=444, detail=f"Candidate {candidate_id} not found or not scored yet.")
        
    candidate_info = session_store.get_resume(candidate_id) or {}
    jd_info = session_store.jd_info or {}
    
    if candidate_id in session_store.explanations:
        exp_data = session_store.explanations[candidate_id]
    else:
        exp_data = generate_score_explanation(candidate_eval, candidate_info, jd_info)
        session_store.explanations[candidate_id] = exp_data
        
    return CandidateExplanationResponse(**exp_data)

@router.get("/generate-questions/{candidate_id}", response_model=CandidateQuestionsResponse)
async def generate_candidate_questions(candidate_id: str, session_store: SessionStore = Depends(require_session)):
    """Generate 5-8 personalized interview questions based on candidate background and skill gaps."""
    candidate_eval = session_store.get_candidate_score(candidate_id)
    if not candidate_eval:
        if session_store.resumes and session_store.jd_info:
            resumes_list = list(session_store.resumes.values())
            ranked = rank_candidates(resumes_list, session_store.jd_info)
            session_store.set_scores(ranked)
            candidate_eval = session_store.get_candidate_score(candidate_id)

    if not candidate_eval:
        raise HTTPException(status_code=404, detail=f"Candidate {candidate_id} not found or not scored yet.")
        
    candidate_info = session_store.get_resume(candidate_id) or {}
    jd_info = session_store.jd_info or {}
    
    if candidate_id in session_store.interview_questions:
        q_data = session_store.interview_questions[candidate_id]
    else:
        q_data = generate_personalized_interview_questions(candidate_eval, candidate_info, jd_info)
        session_store.interview_questions[candidate_id] = q_data

    return CandidateQuestionsResponse(**q_data)

@router.get("/generate-emails/{candidate_id}", response_model=CandidateEmailsResponse)
async def generate_candidate_email_templates(candidate_id: str, session_store: SessionStore = Depends(require_session)):
    """Generate 3 personalized recruiter email drafts (Invite, Assessment, Rejection)."""
    candidate_eval = session_store.get_candidate_score(candidate_id)
    if not candidate_eval:
        if session_store.resumes and session_store.jd_info:
            resumes_list = list(session_store.resumes.values())
            ranked = rank_candidates(resumes_list, session_store.jd_info)
            session_store.set_scores(ranked)
            candidate_eval = session_store.get_candidate_score(candidate_id)

    if not candidate_eval:
        raise HTTPException(status_code=404, detail=f"Candidate {candidate_id} not found or not scored yet.")
        
    candidate_info = session_store.get_resume(candidate_id) or {}
    jd_info = session_store.jd_info or {}
    
    if candidate_id in session_store.emails:
        email_data = session_store.emails[candidate_id]
    else:
        email_data = generate_candidate_emails(candidate_eval, candidate_info, jd_info)
        session_store.emails[candidate_id] = email_data

    return CandidateEmailsResponse(**email_data)

@router.get("/generate-onboarding/{candidate_id}", response_model=OnboardingPlanResponse)
async def generate_candidate_onboarding_plan(candidate_id: str, session_store: SessionStore = Depends(require_session)):
    """Generate a tailored 30-60-90 day onboarding and upskilling roadmap for the candidate."""
    candidate_eval = session_store.get_candidate_score(candidate_id)
    if not candidate_eval:
        if session_store.resumes and session_store.jd_info:
            resumes_list = list(session_store.resumes.values())
            ranked = rank_candidates(resumes_list, session_store.jd_info)
            session_store.set_scores(ranked)
            candidate_eval = session_store.get_candidate_score(candidate_id)

    if not candidate_eval:
        raise HTTPException(status_code=404, detail=f"Candidate {candidate_id} not found or not scored yet.")
        
    candidate_info = session_store.get_resume(candidate_id) or {}
    jd_info = session_store.jd_info or {}
    
    if candidate_id in session_store.onboarding_plans:
        plan_data = session_store.onboarding_plans[candidate_id]
    else:
        plan_data = generate_onboarding_plan(candidate_eval, candidate_info, jd_info)
        session_store.onboarding_plans[candidate_id] = plan_data

    return OnboardingPlanResponse(**plan_data)

@router.post("/update-candidate/{candidate_id}")

async def update_candidate_status_endpoint(
    candidate_id: str,
    payload: CandidateMetadataUpdate,
    session_store: SessionStore = Depends(require_session),
):
    """Update candidate pipeline stage, rating, notes, or tags."""
    updated = session_store.update_candidate_status(
        candidate_id, payload.stage, payload.rating, payload.recruiter_notes, payload.tags
    )
    if not updated:
        raise HTTPException(status_code=404, detail="Candidate not found.")
    return {"status": "success", "candidate": updated}

@router.get("/results", response_model=EvaluationResultsResponse)
async def get_results(session_store: SessionStore = Depends(require_session)):

    """Return complete evaluation dashboard results payload."""
    jd_info = session_store.jd_info
    if not jd_info:
        return EvaluationResultsResponse(
            job_title="No JD Loaded",
            total_candidates=len(session_store.resumes),
            jd_skills=[],
            candidates=[]
        )
        
    if not session_store.scored_results and session_store.resumes:
        resumes_list = list(session_store.resumes.values())
        ranked = rank_candidates(resumes_list, jd_info)
        session_store.set_scores(ranked)

    candidate_results = [CandidateScoreResult(**res) for res in session_store.scored_results]
    
    return EvaluationResultsResponse(
        job_title=jd_info.get("job_title", "Target Position"),
        total_candidates=len(candidate_results),
        jd_skills=jd_info.get("required_skills", []),
        candidates=candidate_results
    )

@router.post("/optimize-jd", response_model=JDOptimizeResponse)
async def optimize_job_description(payload: JDOptimizeRequest):
    """Scan JD for exclusionary bias, calculate inclusivity score, and return an optimized rewrite."""
    from app.llm.jd_optimizer import scan_and_optimize_jd
    result = scan_and_optimize_jd(payload.jd_text, payload.job_title or "Target Position")
    return JDOptimizeResponse(**result)

@router.get("/compensation-benchmark/{candidate_id}")
async def get_candidate_compensation_benchmark(candidate_id: str, session_store: SessionStore = Depends(require_session)):
    """Calculate market salary percentiles and budget fit for candidate."""
    candidate_eval = session_store.get_candidate_score(candidate_id)
    if not candidate_eval:
        if session_store.resumes and session_store.jd_info:
            resumes_list = list(session_store.resumes.values())
            ranked = rank_candidates(resumes_list, session_store.jd_info)
            session_store.set_scores(ranked)
            candidate_eval = session_store.get_candidate_score(candidate_id)

    if not candidate_eval:
        raise HTTPException(status_code=404, detail="Candidate not found.")

    candidate_info = session_store.get_resume(candidate_id) or {}
    jd_info = session_store.jd_info or {}
    
    from app.scoring.compensation_estimator import estimate_candidate_compensation
    return estimate_candidate_compensation(candidate_eval, candidate_info, jd_info)

@router.post("/generate-offer/{candidate_id}")
async def generate_offer_letter(candidate_id: str, payload: Dict[str, Any] = Body(default={}), session_store: SessionStore = Depends(require_session)):
    """Generate formal customized job offer letter."""
    candidate_eval = session_store.get_candidate_score(candidate_id)
    if not candidate_eval:
        if session_store.resumes and session_store.jd_info:
            resumes_list = list(session_store.resumes.values())
            ranked = rank_candidates(resumes_list, session_store.jd_info)
            session_store.set_scores(ranked)
            candidate_eval = session_store.get_candidate_score(candidate_id)

    if not candidate_eval:
        raise HTTPException(status_code=404, detail="Candidate not found.")

    candidate_info = session_store.get_resume(candidate_id) or {}
    jd_info = session_store.jd_info or {}
    
    from app.llm.offer_letter_generator import generate_formal_offer_letter
    return generate_formal_offer_letter(candidate_eval, candidate_info, jd_info, payload)

@router.get("/radar-metrics/{candidate_id}")
async def get_candidate_radar_metrics(candidate_id: str, session_store: SessionStore = Depends(require_session)):
    """Compute 6-axis competency radar and team complementarity."""
    candidate_eval = session_store.get_candidate_score(candidate_id)
    if not candidate_eval:
        if session_store.resumes and session_store.jd_info:
            resumes_list = list(session_store.resumes.values())
            ranked = rank_candidates(resumes_list, session_store.jd_info)
            session_store.set_scores(ranked)
            candidate_eval = session_store.get_candidate_score(candidate_id)

    if not candidate_eval:
        raise HTTPException(status_code=404, detail="Candidate not found.")

    candidate_info = session_store.get_resume(candidate_id) or {}
    jd_info = session_store.jd_info or {}
    
    from app.scoring.radar_metrics import compute_candidate_radar_metrics
    return compute_candidate_radar_metrics(candidate_eval, candidate_info, jd_info)

@router.post("/what-if-simulate/{candidate_id}", response_model=WhatIfResponse)
async def simulate_candidate_upskilling(candidate_id: str, payload: WhatIfRequest, session_store: SessionStore = Depends(require_session)):
    """Simulate candidate match score jump if specific missing skills are acquired."""
    candidate_eval = session_store.get_candidate_score(candidate_id)
    if not candidate_eval:
        if session_store.resumes and session_store.jd_info:
            resumes_list = list(session_store.resumes.values())
            ranked = rank_candidates(resumes_list, session_store.jd_info)
            session_store.set_scores(ranked)
            candidate_eval = session_store.get_candidate_score(candidate_id)

    if not candidate_eval:
        raise HTTPException(status_code=404, detail="Candidate not found.")

    orig_score = float(candidate_eval.get("score", 60.0))
    orig_matched = list(candidate_eval.get("matched_skills", []))
    orig_missing = list(candidate_eval.get("missing_skills", []))
    
    # Calculate simulated matched skills
    sim_matched = list(orig_matched)
    sim_missing = []
    
    for m in orig_missing:
        if any(add.lower() in m.lower() or m.lower() in add.lower() for add in payload.added_skills):
            if m not in sim_matched:
                sim_matched.append(m)
        else:
            sim_missing.append(m)
            
    # Calculate simulated score jump
    skill_pct = (len(sim_matched) / max(1, len(sim_matched) + len(sim_missing))) * 100.0
    sem_pct = float(candidate_eval.get("semantic_similarity", 0.6)) * 100.0
    # Add modest semantic boost when skills are acquired
    sem_pct_boosted = min(98.0, sem_pct + (len(payload.added_skills) * 3.5))
    
    sim_score = round((sem_pct_boosted * 0.6) + (skill_pct * 0.4), 1)
    sim_score = max(orig_score, min(99.0, sim_score))
    delta = round(sim_score - orig_score, 1)
    
    ramp_up_weeks = max(2, len(payload.added_skills) * 3)
    verdict = "🚀 High ROI Upskill Candidate — Fast 85%+ Match" if sim_score >= 80 and delta >= 10 else "Solid Potential with Targeted Training"

    return WhatIfResponse(
        candidate_id=candidate_id,
        original_score=orig_score,
        simulated_score=sim_score,
        score_delta=delta,
        simulated_matched_skills=sim_matched,
        remaining_missing_skills=sim_missing,
        roi_verdict=verdict,
        estimated_ramp_up_weeks=ramp_up_weeks
    )

@router.post("/reset")
async def reset_session(session_store: SessionStore = Depends(require_session)):
    """Reset session state, clearing all loaded resumes and job descriptions."""
    session_store.clear()
    return {"status": "success", "message": "Session reset successfully."}
