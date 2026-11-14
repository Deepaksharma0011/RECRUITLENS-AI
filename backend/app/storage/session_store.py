from typing import Dict, List, Any, Optional
from secrets import token_urlsafe
from time import monotonic

from fastapi import HTTPException, Response, Security
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer


SESSION_TTL_SECONDS = 8 * 60 * 60
MAX_ACTIVE_SESSIONS = 1000
bearer = HTTPBearer(auto_error=False)

class SessionStore:
    def __init__(self):
        self.jd_info: Optional[Dict[str, Any]] = None
        self.resumes: Dict[str, Dict[str, Any]] = {} # candidate_id -> raw parsed resume
        self.scored_results: List[Dict[str, Any]] = [] # ranked scores list
        self.explanations: Dict[str, Dict[str, Any]] = {} # candidate_id -> explanation
        self.interview_questions: Dict[str, Dict[str, Any]] = {} # candidate_id -> questions
        self.emails: Dict[str, Dict[str, Any]] = {} # candidate_id -> email drafts
        self.onboarding_plans: Dict[str, Dict[str, Any]] = {} # candidate_id -> onboarding
        self.candidate_metadata: Dict[str, Dict[str, Any]] = {} # candidate_id -> {stage, rating, recruiter_notes, tags}

    def clear(self):
        self.jd_info = None
        self.resumes.clear()
        self.scored_results.clear()
        self.explanations.clear()
        self.interview_questions.clear()
        self.emails.clear()
        self.onboarding_plans.clear()
        self.candidate_metadata.clear()

    def set_jd(self, jd_data: Optional[Dict[str, Any]]):
        self.jd_info = jd_data
        # Invalidate old scores when JD changes
        self.scored_results.clear()
        self.explanations.clear()
        self.interview_questions.clear()
        self.emails.clear()
        self.onboarding_plans.clear()

    def replace_resumes(self, candidates: List[Dict[str, Any]]):
        self.resumes = {candidate["candidate_id"]: candidate for candidate in candidates}
        self.candidate_metadata.clear()
        self.set_jd(self.jd_info)

    def get_resume(self, candidate_id: str) -> Optional[Dict[str, Any]]:
        return self.resumes.get(candidate_id)

    def set_scores(self, results: List[Dict[str, Any]]):
        for item in results:
            item.update(self.candidate_metadata.get(item["candidate_id"], {}))
        self.scored_results = results

    def get_candidate_score(self, candidate_id: str) -> Optional[Dict[str, Any]]:
        for item in self.scored_results:
            if item["candidate_id"] == candidate_id:
                return item
        return None

    def update_candidate_status(self, candidate_id: str, stage: Optional[str] = None, rating: Optional[int] = None, notes: Optional[str] = None, tags: Optional[List[str]] = None) -> Optional[Dict[str, Any]]:
        if candidate_id not in self.resumes:
            return None
        meta = self.candidate_metadata.setdefault(candidate_id, {
            "stage": "Screened",
            "rating": 0,
            "recruiter_notes": "",
            "tags": []
        })
        if stage is not None:
            meta["stage"] = stage
        if rating is not None:
            meta["rating"] = rating
        if notes is not None:
            meta["recruiter_notes"] = notes
        if tags is not None:
            meta["tags"] = tags

        score = self.get_candidate_score(candidate_id)
        if score is not None:
            score.update(meta)
        return meta

sessions: Dict[str, tuple[SessionStore, float]] = {}


async def create_session() -> str:
    now = monotonic()
    expired = [token for token, (_, expires) in sessions.items() if expires <= now]
    for token in expired:
        del sessions[token]
    if len(sessions) >= MAX_ACTIVE_SESSIONS:
        raise HTTPException(status_code=503, detail="Too many active screening sessions. Try again later.")
    token = token_urlsafe(32)
    sessions[token] = (SessionStore(), now + SESSION_TTL_SECONDS)
    return token


async def require_session(
    response: Response,
    credentials: Optional[HTTPAuthorizationCredentials] = Security(bearer),
) -> SessionStore:
    token = credentials.credentials if credentials else ""
    entry = sessions.get(token)
    now = monotonic()
    if entry is None or entry[1] <= now:
        sessions.pop(token, None)
        raise HTTPException(
            status_code=401,
            detail="Screening session ended. Reload the page and upload your resumes again.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    session, _ = entry
    sessions[token] = (session, now + SESSION_TTL_SECONDS)
    response.headers["Cache-Control"] = "private, no-store"
    return session
