from typing import Dict, Any, List

# Baseline Market Compensation Model (Annual in USD & INR)
DOMAIN_SALARY_BASELINES = {
    "MARKETING_SOCIAL_MEDIA": {
        "base_usd": 55000,
        "exp_multiplier_usd": 8500,
        "base_inr_lpa": 5.5,
        "exp_multiplier_inr": 1.8
    },
    "SOFTWARE_ENGINEERING": {
        "base_usd": 85000,
        "exp_multiplier_usd": 14000,
        "base_inr_lpa": 9.0,
        "exp_multiplier_inr": 3.0
    },
    "DATA_AI": {
        "base_usd": 90000,
        "exp_multiplier_usd": 15000,
        "base_inr_lpa": 10.0,
        "exp_multiplier_inr": 3.2
    },
    "DESIGN_CREATIVE": {
        "base_usd": 60000,
        "exp_multiplier_usd": 9000,
        "base_inr_lpa": 6.0,
        "exp_multiplier_inr": 2.0
    },
    "SALES_BUSINESS": {
        "base_usd": 62000,
        "exp_multiplier_usd": 10000,
        "base_inr_lpa": 6.5,
        "exp_multiplier_inr": 2.2
    },
    "HR_PEOPLE_OPS": {
        "base_usd": 58000,
        "exp_multiplier_usd": 8000,
        "base_inr_lpa": 5.8,
        "exp_multiplier_inr": 1.7
    },
    "FINANCE_ACCOUNTING": {
        "base_usd": 68000,
        "exp_multiplier_usd": 11000,
        "base_inr_lpa": 7.5,
        "exp_multiplier_inr": 2.4
    },
    "GENERAL": {
        "base_usd": 55000,
        "exp_multiplier_usd": 8000,
        "base_inr_lpa": 5.0,
        "exp_multiplier_inr": 1.6
    }
}

HIGH_VALUE_SKILL_PREMIUMS = {
    "ai": {"usd": "$18,000", "inr": "+₹3.5 LPA", "pct": 0.18},
    "llm": {"usd": "$18,000", "inr": "+₹3.5 LPA", "pct": 0.18},
    "generative ai": {"usd": "$20,000", "inr": "+₹4.0 LPA", "pct": 0.20},
    "machine learning": {"usd": "$16,000", "inr": "+₹3.0 LPA", "pct": 0.15},
    "meta ads": {"usd": "$10,000", "inr": "+₹2.0 LPA", "pct": 0.10},
    "seo": {"usd": "$8,000", "inr": "+₹1.5 LPA", "pct": 0.08},
    "google analytics": {"usd": "$8,000", "inr": "+₹1.5 LPA", "pct": 0.08},
    "aws": {"usd": "$14,000", "inr": "+₹2.8 LPA", "pct": 0.12},
    "kubernetes": {"usd": "$14,000", "inr": "+₹2.8 LPA", "pct": 0.12},
    "figma": {"usd": "$8,000", "inr": "+₹1.5 LPA", "pct": 0.08},
    "system design": {"usd": "$14,000", "inr": "+₹2.8 LPA", "pct": 0.12},
    "lead generation": {"usd": "$10,000", "inr": "+₹2.0 LPA", "pct": 0.10},
    "canva": {"usd": "$5,000", "inr": "+₹1.0 LPA", "pct": 0.05}
}

def estimate_candidate_compensation(candidate_eval: Dict[str, Any], candidate_info: Dict[str, Any], jd_info: Dict[str, Any]) -> Dict[str, Any]:
    """
    Estimates market salary percentiles (25th, 50th, 75th, 90th) based on candidate skills,
    seniority, match score, and industry benchmarks.
    """
    job_title = jd_info.get("job_title", "Target Position")
    exp_years = float(candidate_eval.get("experience_years", candidate_info.get("experience_years", 2.0)))
    matched_skills = candidate_eval.get("matched_skills", [])
    score = float(candidate_eval.get("score", 70.0))
    
    from app.llm.question_generator import detect_role_domain
    domain = detect_role_domain(job_title)
    baseline = DOMAIN_SALARY_BASELINES.get(domain, DOMAIN_SALARY_BASELINES["GENERAL"])

    # Calculate base median USD
    raw_usd_median = baseline["base_usd"] + (min(exp_years, 12.0) * baseline["exp_multiplier_usd"])
    
    # Skill Premium Multipliers
    max_premium_pct = 0.0
    skill_premiums_list = []
    
    for s in matched_skills:
        s_low = s.lower()
        for hvs, meta in HIGH_VALUE_SKILL_PREMIUMS.items():
            if hvs in s_low and not any(p["skill"].lower() == s.lower() for p in skill_premiums_list):
                skill_premiums_list.append({
                    "skill": s,
                    "premium_usd": meta["usd"],
                    "inr_boost": meta["inr"]
                })
                max_premium_pct = max(max_premium_pct, meta["pct"])
                
    if not skill_premiums_list:
        skill_premiums_list = [
            {"skill": "Core Role Mastery", "premium_usd": "$5,000", "inr_boost": "+₹1.0 LPA"},
            {"skill": "Domain Track Record", "premium_usd": "$4,000", "inr_boost": "+₹0.8 LPA"}
        ]

    # Match Score Multiplier (Higher match = top percentile potential)
    score_mult = 1.0 + ((score - 50.0) / 200.0)  # 0.75x to 1.25x
    
    final_usd_median = int(raw_usd_median * (1.0 + max_premium_pct) * score_mult)
    
    p25_usd = int(final_usd_median * 0.85)
    p50_usd = final_usd_median
    p75_usd = int(final_usd_median * 1.18)
    p90_usd = int(final_usd_median * 1.35)

    # Calculate INR LPA equivalent
    raw_inr_median = baseline["base_inr_lpa"] + (min(exp_years, 12.0) * baseline["exp_multiplier_inr"])
    final_inr_median = round(raw_inr_median * (1.0 + max_premium_pct) * score_mult, 1)
    
    p25_inr = round(final_inr_median * 0.85, 1)
    p50_inr = final_inr_median
    p75_inr = round(final_inr_median * 1.18, 1)
    p90_inr = round(final_inr_median * 1.35, 1)

    # Seniority Level
    if exp_years < 2:
        seniority = "Junior / Entry-Level"
    elif exp_years < 5:
        seniority = "Mid-Level Specialist"
    elif exp_years < 9:
        seniority = "Senior Executive / Lead"
    else:
        seniority = "Staff / Director Level"

    summary = f"Based on {exp_years:.0f} years of relevant experience, {len(matched_skills)} verified core skills, and a {score:.0f}/100 match rating, market median compensation is estimated at ${p50_usd:,} USD (₹{p50_inr} LPA)."

    return {
        "candidate_id": candidate_eval.get("candidate_id", "cand_001"),
        "candidate_name": candidate_eval.get("candidate_name", "Candidate"),
        "job_title": job_title,
        "seniority_tier": seniority,
        "experience_years": exp_years,
        "domain": domain,
        "percentiles": {
            "p25_usd": p25_usd,
            "median_usd": p50_usd,
            "p75_usd": p75_usd,
            "p90_usd": p90_usd,
            "p25_inr_lpa": p25_inr,
            "median_inr_lpa": p50_inr,
            "p75_inr_lpa": p75_inr,
            "p90_inr_lpa": p90_inr
        },
        "compensation_usd": {
            "p25": f"${p25_usd:,}",
            "p50_median": f"${p50_usd:,}",
            "p75": f"${p75_usd:,}",
            "p90": f"${p90_usd:,}",
            "raw_median": p50_usd
        },
        "compensation_inr": {
            "p25": f"₹{p25_inr} LPA",
            "p50_median": f"₹{p50_inr} LPA",
            "p75": f"₹{p75_inr} LPA",
            "p90": f"₹{p90_inr} LPA",
            "raw_median": p50_inr
        },
        "skill_premiums": skill_premiums_list,
        "compensation_summary": summary,
        "market_competitiveness": "High Demand" if max_premium_pct > 0.08 else "Standard Market Rate",
        "key_value_drivers": [s for s in matched_skills[:3]] if matched_skills else ["Core domain competency"]
    }
