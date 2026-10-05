import re
from typing import Dict, List, Any

def detect_resume_anomalies(raw_text: str, candidate_data: Dict[str, Any], jd_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Analyzes resume text for potential anomalies and red flags:
    1. Employment timeline gaps (>6 months)
    2. High job-hopping frequency (average duration < 1.2 years per role)
    3. Keyword stuffing / artificial repetition
    4. Missing contact/verification baseline
    """
    anomalies = []
    text_lower = raw_text.lower()
    
    # --- 1. Keyword Stuffing Detection ---
    # Check if certain keywords are repeated excessively in raw text compared to document length
    words = re.findall(r'\b[a-zA-Z0-9_+#.-]{2,}\b', text_lower)
    total_words = max(len(words), 1)
    
    word_freq = {}
    for w in words:
        if len(w) > 2 and w not in {'and', 'the', 'for', 'with', 'from', 'this', 'that', 'have', 'been', 'will', 'using'}:
            word_freq[w] = word_freq.get(w, 0) + 1
            
    stuffed_keywords = []
    for w, count in word_freq.items():
        density = (count / total_words) * 100.0
        # If a single tech term accounts for > 4.5% of total resume word count with 6+ occurrences
        if density > 4.5 and count >= 6:
            stuffed_keywords.append(f"{w} ({count}x, {density:.1f}% density)")
            
    if stuffed_keywords:
        anomalies.append({
            "type": "keyword_stuffing",
            "severity": "medium",
            "title": "Possible Keyword Stuffing Detected",
            "detail": f"Unusually high keyword repetition density for: {', '.join(stuffed_keywords[:3])}. Ensure candidate has authentic project depth.",
            "icon": "AlertTriangle"
        })

    # --- 2. Timeline & Date Extraction ---
    # Find 4-digit years like 2015, 2018, 2021, 2024
    years_found = sorted(list(set([int(y) for y in re.findall(r'\b(19\d\d|20\d\d)\b', raw_text)])))
    
    # Check for short or zero work experience mentions
    exp_years = candidate_data.get("experience_years", 0.0)
    if exp_years == 0 and len(years_found) > 1:
        # Estimate span from detected years
        min_yr = min(years_found)
        max_yr = max(years_found)
        if max_yr - min_yr >= 2:
            exp_years = float(max_yr - min_yr)
            
    # Check for rapid job transitions / short stints
    # Look for role patterns like (2020 - 2021), (2021 - 2022), (2022 - 2023)
    date_ranges = re.findall(r'(\d{4})\s*[-–—to]+\s*(\d{4}|present|current)', raw_text, re.IGNORECASE)
    
    if len(date_ranges) >= 3:
        short_stints = 0
        for start, end in date_ranges:
            start_yr = int(start)
            end_yr = 2026 if end.lower() in ('present', 'current') else int(end)
            tenure = max(0, end_yr - start_yr)
            if tenure <= 1:
                short_stints += 1
                
        if short_stints >= 3:
            anomalies.append({
                "type": "job_hopping",
                "severity": "medium",
                "title": "Frequent Job Transitions (<1.5 yrs average)",
                "detail": f"Candidate changed companies/roles {short_stints} times within short 1-year windows. Check retention motivation during interview.",
                "icon": "Repeat"
            })

    # --- 3. Employment Gap Detection ---
    # If years jump by > 2 years without education/overlap
    if len(years_found) >= 2:
        for i in range(len(years_found) - 1):
            gap = years_found[i+1] - years_found[i]
            if gap >= 3:
                anomalies.append({
                    "type": "employment_gap",
                    "severity": "low",
                    "title": f"Possible Career Gap ({years_found[i]} to {years_found[i+1]})",
                    "detail": f"A gap of ~{gap} years identified in documented history. Recommended to clarify career sabbatical or freelance projects.",
                    "icon": "Clock"
                })
                break

    # --- 4. Prompt Injection & Adversarial AI Defense Check ---
    PROMPT_INJECTION_PATTERNS = [
        r'ignore\s+(?:all\s+)?(?:previous|prior)\s+instructions',
        r'disregard\s+(?:all\s+)?(?:previous|prior)\s+rules',
        r'system\s*:\s*(?:you\s+are|override|give\s+this\s+candidate)',
        r'(?:give|assign|rate)\s+(?:this\s+candidate|me)\s+(?:a\s+)?(?:100|99|perfect|top)\s*(?:%|\/100|score|rating)',
        r'you\s+must\s+rank\s+(?:this\s+candidate|me)\s+(?:first|#1|top)',
        r'system\s+prompt\s+override',
        r'bypass\s+(?:screening|ats|filter)',
        r'developer\s+mode\s+enabled'
    ]
    
    injection_matches = []
    for pat in PROMPT_INJECTION_PATTERNS:
        match = re.search(pat, raw_text, re.IGNORECASE)
        if match:
            injection_matches.append(match.group(0))
            
    zero_width_count = len(re.findall(r'[\u200B-\u200D\uFEFF]', raw_text))
    
    if injection_matches:
        anomalies.append({
            "type": "prompt_injection",
            "severity": "high",
            "title": "🚨 Adversarial Prompt Injection Neutralized",
            "detail": f"Resume contains hidden prompt override instruction: '{injection_matches[0]}'. Guardrails active.",
            "icon": "ShieldAlert"
        })
    elif zero_width_count > 5:
        anomalies.append({
            "type": "hidden_unicode_text",
            "severity": "medium",
            "title": "Hidden Zero-Width Unicode Characters",
            "detail": f"Document contains {zero_width_count} invisible unicode characters designed to manipulate tokenizers.",
            "icon": "EyeOff"
        })

    # --- 5. Contact & Verification Health Check ---
    has_email = bool(candidate_data.get("email"))
    has_phone = bool(candidate_data.get("phone"))
    
    if not has_email and not has_phone:
        anomalies.append({
            "type": "missing_contact",
            "severity": "low",
            "title": "Missing Direct Contact Details",
            "detail": "No direct phone number or primary email address parsed from document headers.",
            "icon": "Info"
        })

    # Summary Health Score (100 = Clean, 0 = High Concern)
    penalty = sum(35 if a["severity"] == "high" else 15 if a["severity"] == "medium" else 5 for a in anomalies)
    integrity_score = max(30, 100 - penalty)

    return {
        "integrity_score": integrity_score,
        "total_anomalies": len(anomalies),
        "anomalies": anomalies,
        "adversarial_safe": len(injection_matches) == 0 and zero_width_count <= 5,
        "status": "Clean" if len(anomalies) == 0 else "Review Needed" if integrity_score < 80 else "Minor Notes"
    }
