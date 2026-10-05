import re
import json
import logging
from typing import Dict, Any, List
from app.llm.gpt_client import call_llm

logger = logging.getLogger(__name__)

# Gender-coded and exclusionary keywords database
MASCULINE_CODED_WORDS = {
    "rockstar": "exceptional specialist",
    "ninja": "skilled professional",
    "guru": "subject matter expert",
    "aggressive": "driven / ambitious",
    "dominant": "leading / prominent",
    "assertive": "clear & communicative",
    "headstrong": "resolute",
    "work hard play hard": "collaborative and balanced environment",
    "outperform": "excel",
    "killer": "high-impact",
    "alpha": "lead",
    "champion": "advocate",
    "ruthless": "decisive",
    "hyper-growth": "fast-paced growth",
    "hustle": "dedication"
}

FEMININE_CODED_WORDS = {
    "supportive": "supportive / empowering",
    "collaborative": "collaborative",
    "nurturing": "mentoring",
    "compassionate": "empathetic",
    "pleasant": "courteous",
    "gentle": "approachable",
    "warm": "welcoming",
    "sensitive": "responsive"
}

def scan_and_optimize_jd(jd_text: str, job_title: str = "Target Position") -> Dict[str, Any]:
    """
    Scans a Job Description for exclusionary/gendered language, calculates an Inclusivity Score,
    and returns a structured rewrite and bulleted suggestions.
    """
    if not jd_text.strip():
        return {
            "inclusivity_score": 100,
            "bias_level": "Low",
            "flagged_words": [],
            "suggestions": [],
            "optimized_jd": jd_text,
            "estimated_applicant_boost_pct": 0
        }

    text_lower = jd_text.lower()
    flagged_words = []
    
    # 1. Detect flagged exclusionary words
    for word, replacement in MASCULINE_CODED_WORDS.items():
        pattern = r'\b' + re.escape(word) + r'\b'
        matches = re.findall(pattern, text_lower)
        if matches:
            flagged_words.append({
                "word": word,
                "type": "Masculine / Aggressive Tone",
                "count": len(matches),
                "suggested_replacement": replacement,
                "reason": f"'{word}' can discourage diverse candidates and signals an overly aggressive culture."
            })

    # Check for excessive requirement density (e.g. 15+ bullet points)
    bullet_count = len(re.findall(r'^[•\-\*]\s+', jd_text, re.MULTILINE))
    if bullet_count > 12:
        flagged_words.append({
            "word": f"{bullet_count} requirement bullets",
            "type": "Credential Inflation",
            "count": 1,
            "suggested_replacement": "Condense to top 5-7 core competencies",
            "reason": "Lists with >10 mandatory requirements statistically reduce applications from qualified underrepresented groups."
        })

    # Calculate Inclusivity Score
    penalty = sum(12 * item.get("count", 1) for item in flagged_words)
    inclusivity_score = max(35, min(100, 100 - penalty))
    
    bias_level = "High" if inclusivity_score < 70 else "Moderate" if inclusivity_score < 85 else "Low (Inclusive)"
    boost_pct = min(40, max(5, int((100 - inclusivity_score) * 0.6)))

    # 2. Try LLM for full rewrite
    system_prompt = "You are an expert EEOC diversity & inclusion talent consultant specializing in writing high-converting, unbiased job descriptions."
    user_prompt = f"""
Optimize this Job Description for '{job_title}' to be 100% inclusive, welcoming, and EEOC compliant:
- Current Inclusivity Score: {inclusivity_score}/100
- Flagged Words/Issues: {', '.join([f['word'] for f in flagged_words]) if flagged_words else 'General phrasing refinement'}

Original JD:
{jd_text}

Provide an enhanced, professional rewrite that retains all core technical/job competencies while eliminating aggressive buzzwords (like rockstar, ninja, aggressive) and replacing them with clear, welcoming competency language.

Return a JSON object:
{{
  "optimized_jd": "Full improved job description text with clean formatting",
  "key_improvements": ["Bullet point 1 of what was improved", "Bullet point 2"]
}}

Return ONLY valid raw JSON.
"""

    optimized_text = jd_text
    key_improvements = []
    
    llm_resp = call_llm(user_prompt, system_prompt)
    if llm_resp:
        try:
            cleaned = llm_resp.strip()
            if cleaned.startswith("```"):
                cleaned = re.sub(r'^```(?:json)?\s*', '', cleaned)
                cleaned = re.sub(r'\s*```$', '', cleaned)
            data = json.loads(cleaned)
            if "optimized_jd" in data and len(data["optimized_jd"]) > 50:
                optimized_text = data["optimized_jd"]
                key_improvements = data.get("key_improvements", [])
        except Exception:
            pass

    # Fallback local regex replacement if LLM was unavailable
    if optimized_text == jd_text and flagged_words:
        temp_opt = jd_text
        for item in flagged_words:
            if "suggested_replacement" in item and not item["word"].endswith("bullets"):
                pattern = re.compile(r'\b' + re.escape(item["word"]) + r'\b', re.IGNORECASE)
                temp_opt = pattern.sub(item["suggested_replacement"], temp_opt)
        optimized_text = temp_opt
        key_improvements = [f"Replaced '{f['word']}' with '{f['suggested_replacement']}'" for f in flagged_words if 'suggested_replacement' in f]

    return {
        "job_title": job_title,
        "inclusivity_score": inclusivity_score,
        "bias_level": bias_level,
        "flagged_words": flagged_words,
        "estimated_applicant_boost_pct": boost_pct,
        "key_improvements": key_improvements,
        "optimized_jd": optimized_text
    }
