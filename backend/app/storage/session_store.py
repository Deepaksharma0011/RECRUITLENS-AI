from typing import Dict, List, Any, Optional

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

    def set_jd(self, jd_data: Dict[str, Any]):
        self.jd_info = jd_data
        # Invalidate old scores when JD changes
        self.scored_results.clear()
        self.explanations.clear()
        self.interview_questions.clear()
        self.emails.clear()
        self.onboarding_plans.clear()

    def add_resume(self, candidate_data: Dict[str, Any]):
        cid = candidate_data["candidate_id"]
        self.resumes[cid] = candidate_data

    def get_resume(self, candidate_id: str) -> Optional[Dict[str, Any]]:
        return self.resumes.get(candidate_id)

    def set_scores(self, results: List[Dict[str, Any]]):
        self.scored_results = results

    def get_candidate_score(self, candidate_id: str) -> Optional[Dict[str, Any]]:
        for item in self.scored_results:
            if item["candidate_id"] == candidate_id:
                return item
        return None

    def update_candidate_status(self, candidate_id: str, stage: Optional[str] = None, rating: Optional[int] = None, notes: Optional[str] = None, tags: Optional[List[str]] = None) -> Optional[Dict[str, Any]]:
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

        # Also update scored_results item if present
        for item in self.scored_results:
            if item["candidate_id"] == candidate_id:
                if stage is not None: item["stage"] = stage
                if rating is not None: item["rating"] = rating
                if notes is not None: item["recruiter_notes"] = notes
                if tags is not None: item["tags"] = tags
                return item
        return meta

session_store = SessionStore()
