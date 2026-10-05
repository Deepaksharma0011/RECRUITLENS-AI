import logging
from typing import Dict, Any, List
from app.llm.gpt_client import call_llm

logger = logging.getLogger(__name__)

def generate_score_explanation(
    candidate_eval: Dict[str, Any],
    candidate_info: Dict[str, Any],
    jd_info: Dict[str, Any]
) -> Dict[str, Any]:
    candidate_name = candidate_eval.get("candidate_name", "Candidate")
    candidate_id = candidate_eval.get("candidate_id", "cand_001")
    score = float(candidate_eval.get("score", candidate_eval.get("overall_score", 0.0)))
    matched_skills = candidate_eval.get("matched_skills", [])
    missing_skills = candidate_eval.get("missing_skills", [])
    job_title = jd_info.get("job_title", "Target Role")
    exp_years = candidate_eval.get("experience_years", candidate_info.get("experience_years", 0))

    system_prompt = "You are an expert HR recruiter assistant providing objective candidate evaluation summaries."
    user_prompt = (
        f"Candidate: {candidate_name}\nTarget: {job_title}\nScore: {score}/100\n"
        f"Experience: {exp_years} yrs\nMatched: {', '.join(matched_skills)}\nMissing: {', '.join(missing_skills)}\n"
        f"Provide a 2-3 sentence evaluation summary."
    )

    gpt_response = call_llm(user_prompt, system_prompt)
    if not gpt_response:
        if score >= 75:
            gpt_response = f"{candidate_name} exhibits strong alignment for {job_title}, demonstrating expertise in {', '.join(matched_skills[:4])} with {exp_years} years of relevant experience."
        elif score >= 50:
            gpt_response = f"{candidate_name} presents a solid foundation for {job_title} with proficiency in {', '.join(matched_skills[:3]) if matched_skills else 'core areas'}, though depth in {', '.join(missing_skills[:2]) if missing_skills else 'certain tools'} would be beneficial."
        else:
            gpt_response = f"{candidate_name} shows foundational aptitude, but has notable variances against requirements for {job_title}, particularly {', '.join(missing_skills[:3]) if missing_skills else 'specialized skills'}."

    key_strengths = []
    if matched_skills:
        key_strengths.append(f"Strong practical experience in core requirements: {', '.join(matched_skills[:4])}.")
    if exp_years > 0:
        key_strengths.append(f"Demonstrated background of {exp_years} years relevant to {job_title}.")
    if not key_strengths:
        key_strengths.append(f"Foundational background and transferable skills applicable to {job_title}.")

    potential_gaps = []
    if missing_skills:
        potential_gaps.append(f"Opportunity for upskilling in missing job requirements: {', '.join(missing_skills[:3])}.")
    else:
        potential_gaps.append("No critical skill gaps identified against the primary job description.")

    return {
        "candidate_id": candidate_id,
        "candidate_name": candidate_name,
        "score": score,
        "explanation": gpt_response,
        "key_strengths": key_strengths,
        "potential_gaps": potential_gaps
    }
