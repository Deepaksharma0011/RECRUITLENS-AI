from typing import Dict, Any, List

def compute_candidate_radar_metrics(candidate_eval: Dict[str, Any], candidate_info: Dict[str, Any], jd_info: Dict[str, Any]) -> Dict[str, Any]:
    """
    Computes 6-axis competency radar metrics (0-100 scale) for the candidate:
    1. Domain Mastery (depth of matched core skills)
    2. Tooling Breadth (diversity of tools/frameworks)
    3. Communication & Storytelling (clarity and presentation)
    4. Execution Velocity (turnaround & past tenure trajectory)
    5. Seniority & Experience Depth (years vs required)
    6. Adaptability & Upskill Velocity (missing skill proximity & learning curve)
    """
    score = float(candidate_eval.get("score", 70.0))
    sem_sim = float(candidate_eval.get("semantic_similarity", 0.65)) * 100.0
    matched_skills = candidate_eval.get("matched_skills", [])
    missing_skills = candidate_eval.get("missing_skills", [])
    all_skills = candidate_info.get("skills", [])
    exp_years = float(candidate_eval.get("experience_years", candidate_info.get("experience_years", 2.0)))
    
    # 1. Domain Mastery (Based on semantic score & core matched skills count)
    domain_mastery = int(min(98, max(20, (sem_sim * 0.7) + (len(matched_skills) * 7.5))))
    
    # 2. Tooling Breadth (Total unique skills listed)
    tooling_breadth = int(min(96, max(25, len(all_skills) * 9.0)))
    
    # 3. Communication & Presentation (Resume structure, completeness, clean formatting)
    integrity = float(candidate_eval.get("integrity_score", 100.0))
    communication = int(min(95, max(30, (integrity * 0.6) + (sem_sim * 0.35))))
    
    # 4. Execution Velocity
    execution_velocity = int(min(95, max(35, (score * 0.5) + (domain_mastery * 0.45))))
    
    # 5. Seniority & Experience Depth
    seniority_depth = int(min(98, max(20, (min(exp_years, 10.0) / 10.0 * 80) + 18)))
    
    # 6. Adaptability & Learning Curve
    adaptability = int(min(96, max(40, 100 - (len(missing_skills) * 6.5) + (len(all_skills) * 2.0))))

    radar_axes = [
        {"axis": "Domain Mastery", "score": domain_mastery, "benchmark": 75, "description": "Depth of core competencies and targeted domain knowledge."},
        {"axis": "Tooling Breadth", "score": tooling_breadth, "benchmark": 70, "description": "Hands-on versatility across software, platforms, and modern tooling."},
        {"axis": "Communication", "score": communication, "benchmark": 72, "description": "Documentation clarity, structural presentation, and communication polish."},
        {"axis": "Execution Velocity", "score": execution_velocity, "benchmark": 68, "description": "Demonstrated turnaround cadence and project milestone delivery."},
        {"axis": "Seniority Depth", "score": seniority_depth, "benchmark": 65, "description": "Practical tenure depth, strategic scope, and leadership capability."},
        {"axis": "Adaptability", "score": adaptability, "benchmark": 75, "description": "Ability to assimilate new technologies and close skill gaps rapidly."}
    ]

    # Team Complementarity: Detect unique skill superpower
    unique_superpowers = []
    for s in matched_skills:
        if s.lower() in ["meta ads", "canva", "seo", "google analytics", "figma", "video editing", "python", "aws", "lead generation", "copywriting", "react", "fastapi"]:
            unique_superpowers.append(s)
            
    superpower_str = f"Specialist in {', '.join(unique_superpowers[:2])}" if unique_superpowers else f"Core Competency in {matched_skills[0]}" if matched_skills else "Generalist Domain Aptitude"
    team_fit_score = int(min(98, max(75, (score * 0.4) + (domain_mastery * 0.6))))

    return {
        "candidate_id": candidate_eval.get("candidate_id", "cand_001"),
        "radar_axes": radar_axes,
        "team_complementarity": {
            "role_superpower": superpower_str,
            "team_fit_score": team_fit_score,
            "complementary_analysis": f"Candidate provides strong execution leverage with demonstrated mastery in {superpower_str}. Adds strategic velocity to existing team bandwidth.",
            "cohort_percentile": f"Top {max(5, 100 - int(score))}% of applicant pool",
            "best_fit_role_focus": "Strategic Lead Execution" if domain_mastery > 80 else "Growth & Rapid Upskilling"
        }
    }
