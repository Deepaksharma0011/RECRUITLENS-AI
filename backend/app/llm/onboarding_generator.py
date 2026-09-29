import json
from typing import List, Dict, Any
from app.llm.gpt_client import call_llm

def generate_onboarding_plan(candidate_eval: Dict[str, Any], candidate_info: Dict[str, Any], jd_info: Dict[str, Any]) -> Dict[str, Any]:
    """
    Generates a tailored 30-60-90 day onboarding and skill ramp-up roadmap:
    - Days 1-30: Architecture absorption, tooling setup, core ramp-up on primary gaps.
    - Days 31-60: Autonomous feature shipping, mid-tier contributions, integration of missing skills.
    - Days 61-90: Full system ownership, architectural reviews, cross-team impact.
    """
    name = candidate_eval.get("candidate_name", "Candidate")
    matched = candidate_eval.get("matched_skills", [])
    missing = candidate_eval.get("missing_skills", [])
    job_title = jd_info.get("job_title", "Software Engineer")
    exp_years = candidate_info.get("experience_years", 0)

    # 1. Attempt OpenAI GPT Generation
    system_prompt = "You are an engineering director building high-performance 30-60-90 day onboarding and upskilling roadmaps for incoming engineers."
    user_prompt = f"""
Create a comprehensive, structured 30-60-90 day onboarding & upskilling roadmap for candidate {name} joining as '{job_title}':
- Candidate Experience: {exp_years} years
- Strong Core Skills: {', '.join(matched) if matched else 'Solid engineering foundation'}
- Key Skill Gaps to Ramp-Up: {', '.join(missing) if missing else 'Advanced system architecture'}

Return a JSON object with:
- "summary": 2-3 sentence strategic onboarding philosophy
- "skill_gap_focus": array of strings (top skills to ramp up)
- "phases": array of 3 phase objects:
    1. days: "Days 1–30", title: "Foundation & System Absorption", focus: "...", milestones: [array of 3-4 concrete goals], skill_gap_action: "...", key_deliverable: "..."
    2. days: "Days 31–60", title: "Autonomous Execution & Gap Mastery", focus: "...", milestones: [array of 3-4 goals], skill_gap_action: "...", key_deliverable: "..."
    3. days: "Days 61–90", title: "Domain Ownership & Scale", focus: "...", milestones: [array of 3-4 goals], skill_gap_action: "...", key_deliverable: "..."
- "recommended_resources": array of objects: {{"skill": "...", "type": "...", "title": "...", "recommendation": "..."}}

Return ONLY valid JSON.
"""

    gpt_response = call_llm(user_prompt, system_prompt)
    if gpt_response:
        try:
            cleaned = gpt_response.strip().strip("```json").strip("```")
            data = json.loads(cleaned)
            if "phases" in data and len(data["phases"]) == 3:
                return {
                    "candidate_id": candidate_eval["candidate_id"],
                    "candidate_name": name,
                    "job_title": job_title,
                    "summary": data.get("summary", f"Structured ramp-up strategy for {name} to achieve full autonomy in {job_title}."),
                    "skill_gap_focus": data.get("skill_gap_focus", missing[:3]),
                    "phases": data["phases"],
                    "recommended_resources": data.get("recommended_resources", [])
                }
        except Exception:
            pass

    # 2. Intelligent Local Fallback Roadmap
    primary_gap = missing[0] if missing else "Cloud Infrastructure & CI/CD"
    secondary_gap = missing[1] if len(missing) > 1 else "Performance Optimization"
    core_strength = matched[0] if matched else "Core Software Engineering"

    phases = [
        {
            "days": "Days 1–30",
            "title": "Foundation, Tooling & Architecture Absorption",
            "focus": f"Familiarize with the team codebase, establish local development workflows, and begin structured self-study on {primary_gap}.",
            "milestones": [
                "Complete developer environment setup and ship a minor bug fix or documentation enhancement within Week 1.",
                f"Pair-program with a senior engineer on the {core_strength} service layer to understand architectural patterns.",
                f"Complete foundational onboarding modules and initial sandbox prototypes for {primary_gap}.",
                "Shadow team on-call rotation and participate in daily standups and sprint planning rituals."
            ],
            "skill_gap_action": f"Dedicate 5 hours/week to deep-dive {primary_gap} official documentation and sandbox repository tutorials.",
            "key_deliverable": f"Ship first end-to-end bug fix / feature PR with 90%+ unit test coverage in {core_strength}."
        },
        {
            "days": "Days 31–60",
            "title": "Autonomous Execution & Gap Skill Integration",
            "focus": f"Transition into taking full sprint story ownership, deploying code independently, and actively contributing with {primary_gap}.",
            "milestones": [
                f"Own and deliver a medium-sized feature module incorporating both {core_strength} and {primary_gap}.",
                "Conduct code reviews for peer pull requests, enforcing quality and security best practices.",
                f"Begin addressing {secondary_gap} through internal lunch-and-learns or hands-on tasks.",
                "Identify and resolve one technical debt or latency bottleneck in the production service."
            ],
            "skill_gap_action": f"Lead a peer code review on a component that uses {primary_gap} with guidance from tech lead.",
            "key_deliverable": f"Production release of an independent sprint epic utilizing {primary_gap} without blocking dependencies."
        },
        {
            "days": "Days 61–90",
            "title": "Domain Ownership, Architecture & Team Impact",
            "focus": f"Operate as a fully autonomous contributor, influence architectural roadmap decisions, and mentor newer teammates.",
            "milestones": [
                f"Author a Request for Comments (RFC) or Technical Design Document (TDD) for an upcoming {job_title} initiative.",
                f"Demonstrate complete proficiency across both core strengths ({core_strength}) and former skill gaps ({primary_gap}).",
                "Participate in technical interviewing and onboard new incoming engineering team members.",
                "Define operational alerts, Grafana dashboards, and SLO/SLA monitoring for owned modules."
            ],
            "skill_gap_action": f"Champion best practices and internal guidelines for {primary_gap} across the engineering organization.",
            "key_deliverable": f"Full ownership of critical {job_title} service pipelines with documented runbooks and SLO monitoring."
        }
    ]

    resources = []
    for s in (missing[:3] if missing else ["System Design & Cloud Architecture"]):
        resources.append({
            "skill": s,
            "type": "Official Documentation & Reference",
            "title": f"Mastering {s} in Production",
            "recommendation": f"Review official guides, architecture patterns, and industry production blueprints for {s}."
        })

    return {
        "candidate_id": candidate_eval["candidate_id"],
        "candidate_name": name,
        "job_title": job_title,
        "summary": f"Tailored 90-day acceleration plan designed to capitalize on {name}'s strengths in {core_strength} while systematically bridging skill gaps in {primary_gap}.",
        "skill_gap_focus": missing[:3] if missing else ["Advanced System Design"],
        "phases": phases,
        "recommended_resources": resources
    }
