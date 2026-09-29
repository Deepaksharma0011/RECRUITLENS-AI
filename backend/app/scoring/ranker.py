from typing import List, Dict, Any
from app.scoring.bias_mitigator import sanitize_demographic_bias
from app.scoring.embeddings import compute_semantic_similarity
from app.scoring.anomaly_detector import detect_resume_anomalies

def calculate_candidate_score(candidate_data: Dict[str, Any], jd_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Computes candidate evaluation score:
    - Sanitizes demographic bias from raw resume text
    - Computes sentence transformer semantic similarity against JD
    - Computes skill overlap (matched vs missing skills)
    - Detects timeline anomalies, employment gaps, and keyword stuffing
    - Returns full CandidateScoreResult dict
    """
    raw_resume_text = candidate_data.get("raw_text", "")
    candidate_name = candidate_data.get("name", "Candidate")
    
    # 1. Bias Mitigation Layer
    sanitized_text, audit_stats = sanitize_demographic_bias(raw_resume_text, candidate_name)
    
    # 2. Semantic Similarity Score (0.0 - 1.0)
    jd_raw_text = jd_data.get("raw_text", "")
    semantic_sim = compute_semantic_similarity(sanitized_text, jd_raw_text)
    
    # 3. Skill Matching Logic
    candidate_skills = [s.lower() for s in candidate_data.get("skills", [])]
    jd_skills = [s.lower() for s in jd_data.get("required_skills", [])]
    
    matched_skills = []
    missing_skills = []
    
    if jd_skills:
        for skill in jd_data.get("required_skills", []):
            s_lower = skill.lower()
            if any(s_lower in cs or cs in s_lower for cs in candidate_skills):
                matched_skills.append(skill)
            else:
                missing_skills.append(skill)
        skill_match_pct = (len(matched_skills) / len(jd_skills)) * 100.0
    else:
        skill_match_pct = semantic_sim * 100.0

    # 4. Composite Match Score (60% semantic similarity + 40% skill match percentage)
    semantic_pct = semantic_sim * 100.0
    composite_score = (semantic_pct * 0.60) + (skill_match_pct * 0.40)
    
    # Bound between 10.0 and 99.0 for realistic feedback display
    composite_score = round(max(10.0, min(99.0, composite_score)), 1)
    
    # 5. Anomaly & Integrity Detection
    anomaly_res = detect_resume_anomalies(raw_resume_text, candidate_data, jd_data)
    
    # Sanitized preview snippet (first 350 chars)
    sanitized_preview = sanitized_text[:350] + ("..." if len(sanitized_text) > 350 else "")

    return {
        "candidate_id": candidate_data["candidate_id"],
        "filename": candidate_data["filename"],
        "candidate_name": candidate_name,
        "score": composite_score,
        "semantic_similarity": round(semantic_sim, 3),
        "skill_match_percentage": round(skill_match_pct, 1),
        "matched_skills": matched_skills,
        "missing_skills": missing_skills,
        "extracted_skills": candidate_data.get("skills", []),
        "sanitized_preview": sanitized_preview,
        "raw_text": raw_resume_text,
        "experience_years": candidate_data.get("experience_years", 0.0),
        "education": candidate_data.get("education", []),
        "certifications": candidate_data.get("certifications", []),
        "stage": candidate_data.get("stage", "Screened"),
        "rating": candidate_data.get("rating", 0),
        "recruiter_notes": candidate_data.get("recruiter_notes", ""),
        "tags": candidate_data.get("tags", []),
        "integrity_score": anomaly_res.get("integrity_score", 100),
        "anomalies": anomaly_res.get("anomalies", []),
        "audit_stats": audit_stats
    }

def rank_candidates(candidates_list: List[Dict[str, Any]], jd_data: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Ranks all uploaded candidates by match score in descending order."""
    evaluated = []
    for cand in candidates_list:
        score_res = calculate_candidate_score(cand, jd_data)
        evaluated.append(score_res)
    
    # Sort descending by score
    evaluated.sort(key=lambda x: x["score"], reverse=True)
    return evaluated
