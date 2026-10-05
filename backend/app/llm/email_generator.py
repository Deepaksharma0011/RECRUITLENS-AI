import json
from typing import List, Dict, Any
from app.llm.gpt_client import call_llm

def generate_candidate_emails(candidate_eval: Dict[str, Any], candidate_info: Dict[str, Any], jd_info: Dict[str, Any]) -> Dict[str, Any]:
    """
    Generates personalized, professional email templates:
    1. Interview Invitation (personalized with candidate skills and role highlights)
    2. Technical Assessment Request (tailored to skill gaps and core requirements)
    3. Constructive Feedback & Rejection (empathetic, positive, constructive)
    """
    name = candidate_eval.get("candidate_name", "Candidate")
    matched = candidate_eval.get("matched_skills", [])
    missing = candidate_eval.get("missing_skills", [])
    score = candidate_eval.get("score", 0)
    job_title = jd_info.get("job_title", "Target Position")
    exp_years = candidate_info.get("experience_years", candidate_eval.get("experience_years", 0))

    # 1. Attempt Gemini / OpenAI LLM Generation
    system_prompt = f"You are an executive talent acquisition director writing high-touch, polite recruitment emails for a '{job_title}' candidate."
    user_prompt = f"""
Write 3 personalized email drafts for candidate {name} applying for '{job_title}':
- Candidate Match Score: {score}/100
- Strong Matching Skills: {', '.join(matched) if matched else f'Relevant background in {job_title}'}
- Missing Skills / Growth Areas: {', '.join(missing) if missing else 'General domain depth'}

Return a JSON array of 3 objects with keys:
- "template_type": ("interview_invite" | "assessment_request" | "rejection_feedback")
- "title": (e.g. "Round 1 Interview Invitation", "Take-Home Assessment / Case Study", "Constructive Feedback & Talent Pool")
- "subject": Email subject line
- "body": Full email body text with polite greeting, clear context, and placeholders like [Date/Time] or [Company Name] where needed.

Return ONLY valid raw JSON.
"""

    gpt_response = call_llm(user_prompt, system_prompt)
    if gpt_response:
        try:
            cleaned = gpt_response.strip()
            if cleaned.startswith("```"):
                cleaned = re.sub(r'^```(?:json)?\s*', '', cleaned)
                cleaned = re.sub(r'\s*```$', '', cleaned)
            email_list = json.loads(cleaned)
            if isinstance(email_list, list) and len(email_list) >= 3:
                return {
                    "candidate_id": candidate_eval["candidate_id"],
                    "candidate_name": name,
                    "emails": email_list
                }
        except Exception:
            pass

    # 2. Intelligent Local Fallback Templates
    top_skills_str = ", ".join(matched[:3]) if matched else f"core competency in {job_title}"
    gap_skills_str = ", ".join(missing[:2]) if missing else "specialized requirements"

    # Template 1: Interview Invitation
    invite_body = f"""Dear {name},

Thank you for taking the time to apply for the {job_title} position with our team.

Our talent acquisition team reviewed your profile and was particularly impressed by your background in {top_skills_str}{f' and {exp_years} years of relevant experience' if exp_years else ''}. Your profile demonstrates strong alignment with our key initiatives.

We would love to invite you to a 30–45 minute initial technical and culture fit conversation via Google Meet / Zoom. During this call, we will discuss:
• Your recent projects and experience with {top_skills_str}
• Our team's architectural roadmap and daily workflows
• Any questions you have regarding the role and our team culture

Please let us know your availability across the following time slots:
- [Option 1: Date & Time]
- [Option 2: Date & Time]
- [Option 3: Date & Time]

Alternatively, feel free to pick a time directly on our calendar: [Calendar Booking Link]

We look forward to speaking with you!

Warm regards,

Recruitment Team
[Company Name]
"""

    # Template 2: Technical Assessment Request
    assessment_body = f"""Dear {name},

Thank you for your interest in the {job_title} position.

Following our initial screening, we would like to invite you to complete a brief practical technical assessment. This take-home exercise gives you an opportunity to showcase your hands-on problem solving with {top_skills_str} and system design principles.

Assessment Overview:
• Scope: Practical implementation and problem-solving scenario
• Estimated Time: ~90–120 minutes (at your own pace)
• Submission Deadline: [Date, 48 hours from receipt]
• Key Focus Areas: Code quality, modular design, and robust error handling

You can access the assignment instructions and repository here:
👉 [Assessment Link / GitHub Classroom URL]

If you have any questions during the exercise, please don't hesitate to reply directly to this email.

Best of luck, and we look forward to reviewing your solution!

Best regards,

Engineering Hiring Team
[Company Name]
"""

    # Template 3: Polite Constructive Feedback & Rejection
    rejection_body = f"""Dear {name},

Thank you very much for your interest in the {job_title} position at [Company Name] and for the time and effort you invested in your application.

We received a high volume of accomplished candidates for this opening. While your experience with {top_skills_str} is notable, we have decided to move forward with other candidates whose skill profiles align even more closely with our immediate requirements{f' (particularly in {gap_skills_str})' if missing else ''}.

Because we were impressed with your engineering achievements, we would like to keep your resume on file in our talent network for upcoming roles that match your skill set.

We genuinely appreciate your time and wish you every success in your ongoing job search and professional journey.

Sincerely,

Talent Acquisition Team
[Company Name]
"""

    fallback_emails = [
        {
            "template_type": "invite",
            "title": "Interview Invitation",
            "subject": f"Interview Invitation: {job_title} at [Company Name]",
            "body": invite_body
        },
        {
            "template_type": "assessment",
            "title": "Technical Assessment Request",
            "subject": f"Next Steps: Technical Assessment for {job_title} — {name}",
            "body": assessment_body
        },
        {
            "template_type": "rejection",
            "title": "Constructive Feedback & Talent Pool",
            "subject": f"Update regarding your application for {job_title} at [Company Name]",
            "body": rejection_body
        }
    ]

    return {
        "candidate_id": candidate_eval["candidate_id"],
        "candidate_name": name,
        "emails": fallback_emails
    }
