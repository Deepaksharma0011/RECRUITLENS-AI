import re
from typing import Tuple

UNIVERSITIES_AND_COLLEGES = [
    r'harvard\s+university', r'stanford\s+university', r'massachusetts\s+institute\s+of\s+technology', r'mit\b',
    r'oxford\s+university', r'cambridge\s+university', r'yale\s+university', r'princeton\s+university',
    r'columbia\s+university', r'berkeley', r'cornell\s+university', r'carnegie\s+mellon', r'cmu\b',
    r'university\s+of\s+[A-Za-z]+', r'[A-Za-z]+\s+state\s+university', r'[A-Za-z]+\s+college', r'[A-Za-z]+\s+institute'
]

GENDER_PRONOUNS_MAP = {
    r'\bhe\b': 'they',
    r'\bshe\b': 'they',
    r'\bhis\b': 'their',
    r'\bher\b': 'their',
    r'\bhers\b': 'theirs',
    r'\bhim\b': 'them',
    r'\bhimself\b': 'themself',
    r'\bherself\b': 'themself',
    r'\bmr\.\s*': '',
    r'\bmrs\.\s*': '',
    r'\bms\.\s*': '',
    r'\bmiss\.\s*': ''
}

DEMOGRAPHIC_KEYWORDS = [
    r'\bmarital\s+status\s*:\s*[^\n,]+',
    r'\bnationality\s*:\s*[^\n,]+',
    r'\breligion\s*:\s*[^\n,]+',
    r'\bdate\s+of\s+birth\s*:\s*[^\n,]+',
    r'\bdob\s*:\s*[^\n,]+',
    r'\bage\s*:\s*\d{1,2}\b',
    r'\b\d{1,2}\s+years?\s+old\b',
    r'\bphoto\s+(?:attached|included|available)\b',
    r'\bheadshot\b'
]

def sanitize_demographic_bias(text: str, candidate_name: str = None) -> Tuple[str, dict]:
    """
    Sanitizes raw resume text to eliminate demographic bias.
    Strips candidate names, emails, phones, gender pronouns, address/location,
    university names, and age/demographic markers.
    Returns (sanitized_text, audit_log)
    """
    sanitized = text
    audit_stats = {
        "name_masked": False,
        "email_masked": False,
        "phone_masked": False,
        "gender_pronouns_masked": 0,
        "institutions_masked": 0,
        "demographics_removed": 0
    }
    
    # 1. Mask Candidate Name if provided
    if candidate_name and candidate_name.strip() and candidate_name.lower() != "candidate":
        name_parts = candidate_name.strip().split()
        for part in name_parts:
            if len(part) > 2:
                pattern = r'\b' + re.escape(part) + r'\b'
                if re.search(pattern, sanitized, re.IGNORECASE):
                    sanitized = re.sub(pattern, '[CANDIDATE]', sanitized, flags=re.IGNORECASE)
                    audit_stats["name_masked"] = True

    # 2. Mask Email
    if re.search(r'[\w\.-]+@[\w\.-]+\.\w+', sanitized):
        sanitized = re.sub(r'[\w\.-]+@[\w\.-]+\.\w+', '[REDACTED_EMAIL]', sanitized)
        audit_stats["email_masked"] = True

    # 3. Mask Phone numbers
    if re.search(r'(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}', sanitized):
        sanitized = re.sub(r'(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}', '[REDACTED_PHONE]', sanitized)
        audit_stats["phone_masked"] = True

    # 4. Mask LinkedIn & Web URLs
    sanitized = re.sub(r'https?://[^\s]+', '[REDACTED_URL]', sanitized)
    sanitized = re.sub(r'linkedin\.com/in/[^\s]+', '[REDACTED_LINKEDIN]', sanitized, flags=re.IGNORECASE)

    # 5. Mask Gender pronouns
    for pronoun, replacement in GENDER_PRONOUNS_MAP.items():
        matches = len(re.findall(pronoun, sanitized, flags=re.IGNORECASE))
        if matches > 0:
            sanitized = re.sub(pronoun, replacement, sanitized, flags=re.IGNORECASE)
            audit_stats["gender_pronouns_masked"] += matches

    # 6. Mask University & College Names
    for uni_pat in UNIVERSITIES_AND_COLLEGES:
        matches = len(re.findall(uni_pat, sanitized, flags=re.IGNORECASE))
        if matches > 0:
            sanitized = re.sub(uni_pat, '[ACADEMIC_INSTITUTION]', sanitized, flags=re.IGNORECASE)
            audit_stats["institutions_masked"] += matches

    # 7. Mask Demographic Markers (Age, Marital status, DOB, photo references)
    for demo_pat in DEMOGRAPHIC_KEYWORDS:
        matches = len(re.findall(demo_pat, sanitized, flags=re.IGNORECASE))
        if matches > 0:
            sanitized = re.sub(demo_pat, '[REDACTED_DEMOGRAPHIC]', sanitized, flags=re.IGNORECASE)
            audit_stats["demographics_removed"] += matches

    return sanitized, audit_stats
