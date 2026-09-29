import re
from typing import Dict, Any, List
from app.parsing.resume_parser import extract_skills

def parse_job_description(jd_text: str, job_title: str = "Target Position") -> Dict[str, Any]:
    """Parse JD text, extract title, required skills and preferred skills."""
    all_skills = extract_skills(jd_text)
    
    if not job_title or job_title == "Target Position":
        first_lines = [l.strip() for l in jd_text.split('\n') if l.strip()]
        if first_lines:
            cand_title = first_lines[0]
            if len(cand_title) < 60 and not cand_title.lower().startswith(('overview', 'summary', 'about', 'we are', 'job')):
                job_title = cand_title.title()
            elif 'title:' in cand_title.lower():
                job_title = cand_title.split(':', 1)[1].strip().title()

    required_skills = all_skills
    preferred_skills = []
    
    pref_match = re.search(r'(?:preferred|nice to have|plus|bonus|desirable)[\s:]*\n([\s\S]{1,500})(?:\n\n|\n[A-Z]|$)', jd_text, re.IGNORECASE)
    if pref_match:
        pref_text = pref_match.group(1)
        preferred_skills = extract_skills(pref_text)
        required_skills = [s for s in all_skills if s not in preferred_skills]
        if not required_skills:
            required_skills = all_skills

    return {
        "job_title": job_title or "Target Position",
        "required_skills": required_skills,
        "preferred_skills": preferred_skills,
        "raw_text": jd_text,
        "total_skills_count": len(all_skills)
    }
