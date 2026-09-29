import json
from typing import List, Dict, Any
from app.llm.gpt_client import call_llm

def generate_personalized_interview_questions(candidate_eval: Dict[str, Any], candidate_info: Dict[str, Any], jd_info: Dict[str, Any]) -> Dict[str, Any]:
    """Generates 5-8 personalized, role-relevant interview questions specific to candidate background and skill gaps."""
    name = candidate_eval.get("candidate_name", "Candidate")
    matched = candidate_eval.get("matched_skills", [])
    missing = candidate_eval.get("missing_skills", [])
    all_skills = candidate_info.get("skills", [])
    job_title = jd_info.get("job_title", "Target Role")
    exp_years = candidate_info.get("experience_years", 0)

    # 1. Try OpenAI GPT Call
    system_prompt = "You are a senior technical interviewer creating targeted, high-signal interview questions tailored to a candidate's resume and job requirements."
    user_prompt = f"""
Create 6-8 tailored interview questions for candidate {name} applying for '{job_title}':
- Candidate Skills: {', '.join(all_skills)}
- Candidate Experience: {exp_years} years
- Skills Matched with Job: {', '.join(matched)}
- Skill Gaps / Missing from Resume: {', '.join(missing)}

Return a JSON array of objects with the following keys for each question:
- "category": ("Technical", "Behavioral", "Architecture / System Design", or "Skill Gap Probe")
- "question": The exact interview question string
- "rationale": Short explanation of why this specific question is important based on candidate background or missing skills.

Return ONLY valid JSON.
"""

    gpt_response = call_llm(user_prompt, system_prompt)
    if gpt_response:
        try:
            cleaned = gpt_response.strip().strip("```json").strip("```")
            questions_list = json.loads(cleaned)
            if isinstance(questions_list, list) and len(questions_list) > 0:
                return {
                    "candidate_id": candidate_eval["candidate_id"],
                    "candidate_name": name,
                    "questions": questions_list
                }
        except Exception:
            pass

    # 2. Local Fallback Generator
    questions = []
    
    # Q1: Matched technical skill probe
    if matched:
        top_skill = matched[0]
        questions.append({
            "category": "Technical Expertise",
            "question": f"Can you walk us through a recent project where you utilized {top_skill} to solve a challenging performance or architecture problem?",
            "rationale": f"Validates depth of experience in primary matched skill ({top_skill})."
        })
    else:
        questions.append({
            "category": "Technical Expertise",
            "question": f"Walk us through the design and implementation of your most complex software engineering project to date.",
            "rationale": "Evaluates core engineering complexity and implementation standards."
        })

    # Q2: Missing skill gap probe
    if missing:
        gap_skill = missing[0]
        questions.append({
            "category": "Skill Gap Probe",
            "question": f"We noticed {gap_skill} is a core requirement for this role but wasn't detailed extensively on your resume. How familiar are you with {gap_skill}, or how would you approach quickly onboarding with it?",
            "rationale": f"Probes potential gap in required competency ({gap_skill})."
        })
    else:
        questions.append({
            "category": "Skill Gap Probe",
            "question": "What technical area or framework are you currently learning to expand your skill set, and how are you applying it?",
            "rationale": "Assesses continuous learning initiative and adaptability."
        })

    # Q3: Secondary matched skill depth
    if len(matched) > 1:
        second_skill = matched[1]
        questions.append({
            "category": "Role-Specific",
            "question": f"How do you handle data consistency, error handling, and testing when building services with {second_skill}?",
            "rationale": f"Evaluates production readiness with {second_skill}."
        })
    else:
        questions.append({
            "category": "Role-Specific",
            "question": f"How do you approach writing clean, maintainable, and well-tested code in production environments?",
            "rationale": "Checks code quality and testing practices."
        })

    # Q4: System Design / Architecture
    questions.append({
        "category": "Architecture & System Design",
        "question": f"Given the requirements for the {job_title} position, how would you architect a scalable solution to handle high traffic spikes and asynchronous background tasks?",
        "rationale": "Measures system design and scalability thinking for the target role."
    })

    # Q5: Behavioral / Collaboration
    questions.append({
        "category": "Behavioral",
        "question": "Describe a scenario where you disagreed with a technical decision made by your team. How did you advocate for your perspective while maintaining collaboration?",
        "rationale": "Evaluates teamwork, communication skills, and conflict resolution."
    })

    # Q6: Problem Solving & Recovery
    questions.append({
        "category": "Problem Solving",
        "question": "Tell us about a time a critical bug or production incident occurred in a system you maintained. How did you diagnose, resolve, and prevent future recurrences?",
        "rationale": "Measures debugging skills, resilience under pressure, and post-mortem mindset."
    })

    return {
        "candidate_id": candidate_eval["candidate_id"],
        "candidate_name": name,
        "questions": questions
    }
