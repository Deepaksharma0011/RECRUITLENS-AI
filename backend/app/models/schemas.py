from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any

class CandidateParsedInfo(BaseModel):
    candidate_id: str
    filename: str
    name: Optional[str] = "Candidate"
    email: Optional[str] = None
    phone: Optional[str] = None
    skills: List[str] = []
    experience_years: Optional[float] = 0.0
    education: List[str] = []
    certifications: List[str] = []
    raw_text: str
    sanitized_text: str

class JDParseRequest(BaseModel):
    jd_text: str
    job_title: Optional[str] = "Target Position"

class JDParseResponse(BaseModel):
    job_title: str
    required_skills: List[str]
    preferred_skills: List[str]
    raw_text: str
    total_skills_count: int

class JDSearchRequest(BaseModel):
    query: str

class JDSearchResponse(BaseModel):
    job_title: str
    jd_text: str

class CandidateScoreResult(BaseModel):
    candidate_id: str
    filename: str
    candidate_name: str
    score: float  # 0 to 100
    semantic_similarity: float  # 0 to 1
    skill_match_percentage: float  # 0 to 100
    matched_skills: List[str] = []
    missing_skills: List[str] = []
    extracted_skills: List[str] = []
    sanitized_preview: str = ""
    raw_text: Optional[str] = ""
    experience_years: Optional[float] = 0.0
    education: Optional[List[str]] = []
    certifications: Optional[List[str]] = []
    stage: Optional[str] = "Screened"
    rating: Optional[int] = 0
    recruiter_notes: Optional[str] = ""
    tags: Optional[List[str]] = []
    integrity_score: Optional[int] = 100
    anomalies: Optional[List[Dict[str, Any]]] = []
    audit_stats: Optional[Dict[str, Any]] = None

class EvaluationResultsResponse(BaseModel):
    job_title: str
    total_candidates: int
    jd_skills: List[str]
    candidates: List[CandidateScoreResult]

class CandidateExplanationResponse(BaseModel):
    candidate_id: str
    candidate_name: str
    score: float
    explanation: str
    key_strengths: List[str]
    potential_gaps: List[str]

class QuestionItem(BaseModel):
    category: str  # Technical, Behavioral, Role-Specific, Problem-Solving
    question: str
    rationale: str
    rubric_scale: Optional[Dict[str, str]] = None
    expected_answer: Optional[str] = None
    green_flags: Optional[List[str]] = None
    red_flags: Optional[List[str]] = None

class CandidateQuestionsResponse(BaseModel):
    candidate_id: str
    candidate_name: str
    questions: List[QuestionItem]

class EmailTemplate(BaseModel):
    template_type: str
    title: str
    subject: str
    body: str

class CandidateEmailsResponse(BaseModel):
    candidate_id: str
    candidate_name: str
    emails: List[Dict[str, Any]]

class OnboardingPhase(BaseModel):
    days: str
    title: str
    focus: str
    milestones: List[str]
    skill_gap_action: Optional[str] = None
    key_deliverable: Optional[str] = None

class OnboardingPlanResponse(BaseModel):
    candidate_id: str
    candidate_name: str
    summary: str
    skill_gap_focus: List[str] = []
    phases: List[Dict[str, Any]] = []
    recommended_resources: List[Dict[str, Any]] = []
