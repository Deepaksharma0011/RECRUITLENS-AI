import json
import re
from datetime import datetime, timedelta
from typing import Dict, Any
from app.llm.gpt_client import call_llm

def generate_formal_offer_letter(candidate_eval: Dict[str, Any], candidate_info: Dict[str, Any], jd_info: Dict[str, Any], custom_params: Dict[str, Any] = None) -> Dict[str, Any]:
    """
    Generates an executive, personalized formal job offer letter with compensation,
    benefits, joining date, and core responsibilities.
    """
    params = custom_params or {}
    name = candidate_eval.get("candidate_name", "Candidate")
    job_title = jd_info.get("job_title", "Target Position")
    matched_skills = candidate_eval.get("matched_skills", [])
    
    # Calculate recommended salary
    from app.scoring.compensation_estimator import estimate_candidate_compensation
    comp_est = estimate_candidate_compensation(candidate_eval, candidate_info, jd_info)
    default_salary = comp_est["compensation_usd"]["p50_median"]
    
    salary = params.get("salary") or default_salary
    start_date = params.get("start_date") or (datetime.now() + timedelta(days=14)).strftime("%B %d, %Y")
    company_name = params.get("company_name") or "Acme Technologies Inc."
    location = params.get("location") or "Hybrid / Remote"
    bonus_pct = params.get("bonus_pct") or "10%"
    stock_options = params.get("stock_options") or "5,000 ISO Units (4-Year Vesting with 1-Year Cliff)"

    system_prompt = "You are an executive Chief People Officer drafting formal, polished, inspiring job offer letters."
    user_prompt = f"""
Draft a formal, comprehensive Job Offer Letter for:
- Candidate Name: {name}
- Position: {job_title}
- Company: {company_name}
- Base Compensation: {salary}
- Target Performance Bonus: {bonus_pct}
- Equity: {stock_options}
- Start Date: {start_date}
- Location: {location}
- Key Candidate Core Strengths: {', '.join(matched_skills[:4]) if matched_skills else 'demonstrated domain excellence'}

Return a JSON object:
{{
  "offer_letter_text": "Complete full offer letter with date, address placeholders, position details, compensation breakdown, benefits summary, and signature lines."
}}

Return ONLY valid raw JSON.
"""

    offer_text = ""
    llm_resp = call_llm(user_prompt, system_prompt)
    if llm_resp:
        try:
            cleaned = llm_resp.strip()
            if cleaned.startswith("```"):
                cleaned = re.sub(r'^```(?:json)?\s*', '', cleaned)
                cleaned = re.sub(r'\s*```$', '', cleaned)
            data = json.loads(cleaned)
            if "offer_letter_text" in data:
                offer_text = data["offer_letter_text"]
        except Exception:
            pass

    # Fallback formal template
    if not offer_text:
        today_str = datetime.now().strftime("%B %d, %Y")
        offer_text = f"""{company_name}
Talent Acquisition & Executive Operations
Date: {today_str}

Dear {name},

On behalf of {company_name}, I am thrilled to extend a formal offer of employment for the position of {job_title}.

After a thorough evaluation of your professional achievements and demonstrated capabilities in {', '.join(matched_skills[:3]) if matched_skills else 'your domain'}, our leadership team is confident that your talent will be instrumental in driving our strategic initiatives.

OFFER & COMPENSATION DETAILS:
--------------------------------------------------
• Position Title: {job_title}
• Reporting To: Hiring Director / VP of Operations
• Employment Type: Full-Time
• Work Arrangement: {location}
• Expected Start Date: {start_date}

COMPENSATION PACKAGE:
--------------------------------------------------
• Annual Base Salary: {salary} (paid semi-monthly)
• Annual Performance Bonus: Target of {bonus_pct} based on individual and company milestones
• Equity Grant: {stock_options}
• Comprehensive Health, Dental & Vision Insurance (100% company-paid premiums)
• Flexible Paid Time Off (PTO) + 12 Annual Company Holidays
• Annual Professional Development & Upskilling Stipend

TERMS OF EMPLOYMENT:
This offer is contingent upon the standard completion of background verification and right-to-work documentation. Employment with {company_name} is at-will.

Please indicate your acceptance by signing and returning this letter by {(datetime.now() + timedelta(days=5)).strftime("%B %d, %Y")}.

We are genuinely excited about the prospect of you joining our team and shaping the future of {company_name}.

Sincerely,

Chief People Officer
{company_name}

--------------------------------------------------
CANDIDATE ACCEPTANCE:

I, {name}, accept the offer of employment as outlined above.

Signature: ___________________________    Date: ______________
"""

    return {
        "candidate_id": candidate_eval.get("candidate_id", "cand_001"),
        "candidate_name": name,
        "job_title": job_title,
        "company_name": company_name,
        "salary": salary,
        "start_date": start_date,
        "location": location,
        "offer_letter_text": offer_text
    }
