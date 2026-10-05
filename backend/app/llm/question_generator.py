import json
import re
import logging
from typing import List, Dict, Any
from app.llm.gpt_client import call_llm

logger = logging.getLogger(__name__)

def detect_role_domain(job_title: str) -> str:
    """Classify the job role into an appropriate industry domain."""
    title = job_title.lower()
    
    if any(k in title for k in ["social media", "marketing", "content", "copywriter", "seo", "sem", "brand", "community", "digital marketing", "growth", "instagram", "pr", "public relations", "influencer", "communications"]):
        return "MARKETING_SOCIAL_MEDIA"
    elif any(k in title for k in ["design", "ui", "ux", "graphic", "creative", "illustrator", "animator", "visual", "product designer"]):
        return "DESIGN_CREATIVE"
    elif any(k in title for k in ["sales", "business development", "bdr", "sdr", "account executive", "account manager", "commercial", "partnerships", "client"]):
        return "SALES_BUSINESS"
    elif any(k in title for k in ["finance", "accountant", "financial", "auditor", "banking", "treasury", "tax", "controller", "bookkeeper"]):
        return "FINANCE_ACCOUNTING"
    elif any(k in title for k in ["hr", "human resources", "talent", "recruiter", "people ops", "training", "payroll", "people"]):
        return "HR_PEOPLE_OPS"
    elif any(k in title for k in ["data", "analytics", "bi", "scientist", "analyst", "statistician", "machine learning", "ai engineer"]):
        return "DATA_AI"
    elif any(k in title for k in ["developer", "engineer", "software", "frontend", "backend", "full stack", "devops", "architect", "programmer", "tech lead"]):
        return "SOFTWARE_ENGINEERING"
    elif any(k in title for k in ["operations", "supply chain", "logistics", "project manager", "scrum master", "procurement"]):
        return "OPERATIONS_MANAGEMENT"
    elif any(k in title for k in ["support", "customer service", "success", "helpdesk"]):
        return "CUSTOMER_SUCCESS"
    else:
        return "GENERAL"

def generate_personalized_interview_questions(candidate_eval: Dict[str, Any], candidate_info: Dict[str, Any], jd_info: Dict[str, Any]) -> Dict[str, Any]:
    """Generates 5-8 personalized, role-relevant interview questions specific to candidate background, role domain, and skill gaps."""
    name = candidate_eval.get("candidate_name", "Candidate")
    matched = candidate_eval.get("matched_skills", [])
    missing = candidate_eval.get("missing_skills", [])
    all_skills = candidate_info.get("skills", [])
    job_title = jd_info.get("job_title", "Target Role")
    exp_years = candidate_info.get("experience_years", candidate_eval.get("experience_years", 0))
    domain = detect_role_domain(job_title)

    # 1. Try Gemini / OpenAI LLM Call
    system_prompt = (
        f"You are a specialized hiring director creating targeted, domain-specific interview questions "
        f"for a '{job_title}' position. NEVER ask software engineering or programming questions unless the job is strictly software development. "
        f"Generate professional, practical, and highly relevant questions assessing real-world competency in {job_title}."
    )
    
    user_prompt = f"""
Create 6 personalized interview questions for candidate {name} applying for the role: '{job_title}' (Domain: {domain}):
- Candidate Skills: {', '.join(all_skills[:8]) if all_skills else 'General Background'}
- Candidate Experience: {exp_years} years
- Matched Skills with Job: {', '.join(matched[:6]) if matched else 'Foundational alignment'}
- Missing Job Requirements / Skill Gaps: {', '.join(missing[:4]) if missing else 'None'}

Format rules:
Return a JSON array of objects with the exact schema:
[
  {{
    "category": "Domain Expertise" / "Skill Gap Probe" / "Campaign & Strategy" / "Problem Solving" / "Behavioral",
    "question": "The exact question tailored to {job_title}",
    "rationale": "Why this question tests candidate capabilities for {job_title}",
    "expected_answer": "Key technical or strategic signals the interviewer should look for",
    "green_flags": ["Positive indicator 1", "Positive indicator 2"],
    "red_flags": ["Concerning answer 1", "Concerning answer 2"]
  }}
]
Return ONLY valid raw JSON without markdown backticks.
"""

    gpt_response = call_llm(user_prompt, system_prompt)
    if gpt_response:
        try:
            cleaned = gpt_response.strip()
            if cleaned.startswith("```"):
                cleaned = re.sub(r'^```(?:json)?\s*', '', cleaned)
                cleaned = re.sub(r'\s*```$', '', cleaned)
            
            # Find JSON array
            json_match = re.search(r'\[\s*\{.*\}\s*\]', cleaned, re.DOTALL)
            if json_match:
                cleaned = json_match.group(0)
                
            questions_list = json.loads(cleaned)
            if isinstance(questions_list, list) and len(questions_list) > 0:
                return {
                    "candidate_id": candidate_eval["candidate_id"],
                    "candidate_name": name,
                    "questions": questions_list
                }
        except Exception as e:
            logger.warning(f"Failed to parse LLM interview questions JSON ({e}), using dynamic domain generator.")

    # 2. Intelligent Dynamic Domain-Aware Generator Fallback
    questions = []
    top_skill = matched[0] if matched else "Core Competency"
    gap_skill = missing[0] if missing else "Advanced Execution"
    second_skill = matched[1] if len(matched) > 1 else "Strategic Planning"

    if domain == "MARKETING_SOCIAL_MEDIA":
        questions.append({
            "category": "Content & Campaign Strategy",
            "question": f"Can you walk us through a high-performing social media campaign or content initiative where you utilized {top_skill}? What engagement rates or audience growth did you achieve?",
            "rationale": f"Validates practical execution and measurable impact in primary matched skill ({top_skill}).",
            "expected_answer": "Clear breakdown of campaign goals, target audience persona, creative format (reels/carousels), and quantifiable ROI/engagement.",
            "green_flags": ["Mentions specific metrics (CTR, engagement rate, reach)", "Understands platform algorithms"],
            "red_flags": ["Vague on analytics", "Focuses only on vanity metrics without strategy"]
        })
        questions.append({
            "category": "Skill Gap Probe",
            "question": f"Our marketing roadmap requires working with {gap_skill}. How familiar are you with {gap_skill}, and how would you apply your existing content creation background to ramp up quickly?",
            "rationale": f"Probes potential gap in required skill ({gap_skill}) and evaluates learning velocity.",
            "expected_answer": "Candidate demonstrates proactive learning mindset and relates adjacent marketing tools to master the requirement.",
            "green_flags": ["Shares relevant past experience with similar tools", "Eager to upskill"],
            "red_flags": ["Dismissive of the skill", "Shows no curiosity about platform nuances"]
        })
        questions.append({
            "category": "Community & Brand Voice",
            "question": f"How do you adapt brand voice across diverse platforms (e.g. Instagram vs LinkedIn vs TikTok), and how do you handle negative user comments or brand PR situations?",
            "rationale": f"Evaluates brand management and community moderation under real-world pressure.",
            "expected_answer": "Professional de-escalation framework, knowing when to take conversations to DM, maintaining consistent brand guidelines.",
            "green_flags": ["Empathy-first moderation", "Clear brand guideline discipline"],
            "red_flags": ["Combative tone", "Ignores community feedback"]
        })
        questions.append({
            "category": "Analytics & Performance",
            "question": f"When a post or campaign underperforms against benchmarks, what is your diagnostic process to identify whether the issue was copywriting, visual hook, timing, or targeting?",
            "rationale": "Measures analytical problem-solving and A/B testing methodology.",
            "expected_answer": "Audits first 3-second hook, audience retention curves, caption CTA, and performs controlled A/B creative testing.",
            "green_flags": ["Data-driven iteration mindset", "Tests headlines and thumbnail variations"],
            "red_flags": ["Blames algorithm without analyzing creative inputs"]
        })
        questions.append({
            "category": "Workflow & Multi-Platform Publishing",
            "question": f"How do you organize your content calendar and production pipeline using {second_skill} while staying agile to capitalize on sudden viral trends?",
            "rationale": f"Assesses scheduling discipline and trend agility with {second_skill}.",
            "expected_answer": "Balances scheduled evergreen pillar content with 20% flexible bandwidth for reactive trend hijacking.",
            "green_flags": ["Structured calendar tool usage (Notion, Trello, Hootsuite)", "Quick turnaround time"],
            "red_flags": ["Chaotic posting schedule", "No content batching strategy"]
        })
        questions.append({
            "category": "Cross-Functional Collaboration",
            "question": "Describe a time you collaborated with sales, graphic designers, or leadership to align social media output with overarching business revenue goals.",
            "rationale": "Evaluates teamwork, cross-functional communication, and stakeholder alignment.",
            "expected_answer": "Collaborative briefing process, clear design specs, tracking attribution to sales pipeline.",
            "green_flags": ["Bridges creative and business goals", "Respectful cross-team workflow"],
            "red_flags": ["Works in isolation", "Resents feedback from other departments"]
        })

    elif domain == "DESIGN_CREATIVE":
        questions.append({
            "category": "Design Craft & Workflow",
            "question": f"Can you walk us through a recent project where you utilized {top_skill} to solve a complex visual or user experience challenge?",
            "rationale": f"Evaluates depth of craft and creative problem-solving in {top_skill}.",
            "expected_answer": "Explains user research, iterative wireframing, typography, color theory, and final design deliverables.",
            "green_flags": ["User-centered rationale", "Structured design system thinking"],
            "red_flags": ["Purely aesthetic focus with no usability reasoning"]
        })
        questions.append({
            "category": "Skill Gap Probe",
            "question": f"We noticed {gap_skill} is a key requirement for our team. How would you leverage your design foundation to quickly deliver high-quality assets in {gap_skill}?",
            "rationale": f"Assesses adaptability and learning agility in {gap_skill}."
        })
        questions.append({
            "category": "Stakeholder Critique",
            "question": "How do you handle critical feedback or conflicting opinions from non-design stakeholders on a concept you strongly believe in?",
            "rationale": "Measures communication maturity and collaborative compromise."
        })

    elif domain == "SALES_BUSINESS":
        questions.append({
            "category": "Pipeline & Deal Execution",
            "question": f"Walk us through your end-to-end sales prospecting and deal-closing process where you leveraged {top_skill} to exceed targets.",
            "rationale": f"Validates commercial acumen and deal velocity with {top_skill}."
        })
        questions.append({
            "category": "Skill Gap Probe",
            "question": f"This role involves proficiency with {gap_skill}. How have you approached mastering new CRM platforms or sales enablement tools in previous roles?",
            "rationale": f"Evaluates readiness to adopt {gap_skill}."
        })
        questions.append({
            "category": "Objection Handling",
            "question": "Describe a scenario where a prospective client pushed back aggressively on pricing or timeline. How did you navigate the negotiation to a win-win outcome?",
            "rationale": "Tests negotiation resilience and value-selling methodology."
        })

    elif domain == "HR_PEOPLE_OPS":
        questions.append({
            "category": "Talent Strategy",
            "question": f"Can you share how you leveraged {top_skill} to improve candidate experience, sourcing speed, or employee retention in a past role?",
            "rationale": f"Measures strategic impact of {top_skill} in people operations."
        })
        questions.append({
            "category": "Skill Gap Probe",
            "question": f"Our team utilizes {gap_skill} across talent workflows. How will you quickly integrate {gap_skill} into your daily operations?",
            "rationale": f"Probes operational flexibility with {gap_skill}."
        })

    elif domain == "FINANCE_ACCOUNTING":
        questions.append({
            "category": "Financial Rigor & Analysis",
            "question": f"How do you ensure audit accuracy, data integrity, and compliance when utilizing {top_skill} for reporting and forecasting?",
            "rationale": f"Evaluates quantitative precision and regulatory rigor in {top_skill}."
        })
        questions.append({
            "category": "Skill Gap Probe",
            "question": f"How comfortable are you transitioning your financial analysis capabilities into {gap_skill} for complex modeling?",
            "rationale": f"Tests analytical adaptability in {gap_skill}."
        })

    elif domain == "SOFTWARE_ENGINEERING" or domain == "DATA_AI":
        questions.append({
            "category": "Technical Architecture",
            "question": f"Can you walk us through a recent project where you utilized {top_skill} to solve a complex engineering or performance challenge?",
            "rationale": f"Validates technical depth and implementation standards in {top_skill}."
        })
        questions.append({
            "category": "Skill Gap Probe",
            "question": f"We noticed {gap_skill} is central to our tech stack. How familiar are you with {gap_skill}, and what is your strategy to quickly ramp up?",
            "rationale": f"Assesses technical learning speed in {gap_skill}."
        })
        questions.append({
            "category": "System Reliability",
            "question": "How do you approach writing clean, maintainable code, implementing automated testing, and conducting thorough code reviews?",
            "rationale": "Evaluates code quality standards and engineering hygiene."
        })

    else:
        # General Professional Role
        questions.append({
            "category": "Core Competency",
            "question": f"Can you describe a key milestone or project where you leveraged {top_skill} to achieve measurable results for the {job_title} role?",
            "rationale": f"Validates practical capability and results orientation in {top_skill}."
        })
        questions.append({
            "category": "Skill Gap Probe",
            "question": f"Our requirements highlight {gap_skill} as a core expectation. How would you approach quickly acquiring depth in {gap_skill}?",
            "rationale": f"Evaluates learning agility and growth potential in {gap_skill}."
        })
        questions.append({
            "category": "Operational Execution",
            "question": f"How do you prioritize competing deadlines and manage stakeholder expectations when delivering on {job_title} responsibilities?",
            "rationale": "Measures organizational efficiency and time management."
        })
        questions.append({
            "category": "Problem Solving",
            "question": "Tell us about a time an unexpected hurdle disrupted your project plan. What steps did you take to navigate the obstacle and deliver on time?",
            "rationale": "Evaluates resilience, resourcefulness, and solution-oriented thinking."
        })
        questions.append({
            "category": "Collaboration",
            "question": "Describe a scenario where you worked with cross-functional team members to achieve a shared objective. How did you maintain alignment?",
            "rationale": "Assesses team dynamics, interpersonal skills, and constructive communication."
        })

    return {
        "candidate_id": candidate_eval["candidate_id"],
        "candidate_name": name,
        "questions": questions
    }
