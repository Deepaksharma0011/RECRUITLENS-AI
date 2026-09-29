# AI Powered Recruiter Assistant 🎯

An intelligent, production-quality resume screening system that automates candidate evaluation using Natural Language Processing (NLP), `sentence-transformers` embeddings, demographic bias mitigation, cosine similarity match scoring, and GPT-based score explanations and personalized interview questions.

---

## 🌟 Key Features

1. **Multi-Format Resume Parsing**: Parses PDF, DOCX, and TXT resumes into structured fields (Name, Email, Phone, Skills, Experience Years, Education, Certifications).
2. **Demographic Bias Mitigation Layer**: Strips demographic indicators (name, gender pronouns, contact details, addresses, photo markers, age references, university names) prior to embedding generation for fair, unbiased scoring.
3. **Semantic Matching Engine**: Utilizes `sentence-transformers` (`all-MiniLM-L6-v2`) and `scikit-learn` cosine similarity to compute high-accuracy semantic relevance between candidate experience and job descriptions.
4. **Candidate Ranking Pipeline**: Blends 60% semantic embedding similarity with 40% skill match coverage to rank candidates in descending match score order.
5. **GPT Score Explanation**: Generates plain-language recruiter narratives explaining candidate strengths, fit, and potential verification gaps (`/explain/{candidate_id}`).
6. **Personalized Interview Question Generator**: Generates 5–8 role-relevant, tailored technical & behavioral interview questions based on candidate background and missing skill gaps (`/generate-questions/{candidate_id}`).
7. **Sleek React Dashboard**: Glassmorphic dark dashboard with candidate search/filters, circular score gauges, matched vs missing skill badges, and quick copy-to-clipboard interview question cards.
8. **Smart Local Fallback**: Seamlessly works out-of-the-box even without an OpenAI API key using built-in intelligent fallback generators.

---

## 🛠️ Tech Stack

- **Backend**: Python 3.10+, FastAPI, Uvicorn, Pydantic
- **NLP & Parsing**: PyPDF, pdfplumber, python-docx, Regular Expressions & Skill Taxonomies
- **Embeddings & Similarity**: `sentence-transformers` (`all-MiniLM-L6-v2`), `scikit-learn` `cosine_similarity`
- **LLM Layer**: OpenAI GPT API (`gpt-3.5-turbo` / `gpt-4o-mini`) with rule-based fallback
- **Frontend**: React 18, Vite, Lucide Icons, Canvas Confetti, Custom CSS Design System

---

## 📁 Repository Directory Structure

```
RecruitLens AI/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── routes.py              # REST API Endpoints
│   │   ├── models/
│   │   │   └── schemas.py             # Pydantic Schemas
│   │   ├── parsing/
│   │   │   ├── pdf_parser.py          # PDF Text Extraction
│   │   │   ├── docx_parser.py         # DOCX Text Extraction
│   │   │   ├── resume_parser.py       # Candidate Structured Field Parser
│   │   │   └── jd_parser.py           # Job Description Parser & Skill Extractor
│   │   ├── scoring/
│   │   │   ├── bias_mitigator.py      # Demographic Bias Masking Engine
│   │   │   ├── embeddings.py          # Sentence Transformer Cosine Similarity
│   │   │   └── ranker.py              # Candidate Ranker & Skill Analyzer
│   │   ├── llm/
│   │   │   ├── gpt_client.py          # OpenAI GPT Client Wrapper
│   │   │   ├── explainer.py           # Score Explanation Generator
│   │   │   └── question_generator.py  # Personalized Interview Qs Generator
│   │   ├── storage/
│   │   │   └── session_store.py       # In-Memory Session Store
│   │   ├── config.py                  # Environment Settings
│   │   └── main.py                    # FastAPI Entrypoint & CORS Setup
│   ├── sample_resumes/                # Pre-packaged sample resumes for testing
│   ├── requirements.txt
│   ├── .env.example
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.jsx
│   │   │   ├── ResumeUploader.jsx
│   │   │   ├── JDInput.jsx
│   │   │   ├── CandidateList.jsx
│   │   │   ├── CandidateCard.jsx
│   │   │   ├── CandidateDetailModal.jsx
│   │   │   └── AnalyticsSummary.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   ├── App.css
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
└── README.md
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- Python 3.10+
- Node.js 18+ and npm / yarn

---

### 2. Backend Setup & Run

1. Open a terminal in the `backend` folder:
   ```bash
   cd backend
   ```

2. Create and activate a Python virtual environment:
   ```bash
   # On Windows:
   python -m venv venv
   .\venv\Scripts\activate

   # On macOS/Linux:
   python3 -m venv venv
   source venv/bin/activate
   ```

3. Install required Python packages:
   ```bash
   pip install -r requirements.txt
   ```

4. Configure Environment Variables (Optional for live OpenAI API):
   Create a `.env` file inside `backend/`:
   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   PORT=8000
   HOST=0.0.0.0
   EMBEDDING_MODEL=all-MiniLM-L6-v2
   ```
   *(Note: If `OPENAI_API_KEY` is left blank, the application automatically uses local intelligence generators for score explanations and interview questions).*

5. Start the FastAPI backend server:
   ```bash
   uvicorn main:app --reload
   ```
   The backend server runs at `http://localhost:8000`. OpenAPI documentation is available at `http://localhost:8000/docs`.

---

### 3. Frontend Setup & Run

1. Open a new terminal in the `frontend` folder:
   ```bash
   cd frontend
   ```

2. Install Node dependencies:
   ```bash
   npm install
   ```

3. Start the Vite React development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5173`.

---

## 🧪 Testing the Application (1-Click Demo)

1. Open `http://localhost:5173`.
2. Click **"Load 3 Sample Resumes"** at the top left of the dashboard.
3. Click **"Evaluate & Rank Candidates"**.
4. The system will mask demographic bias, calculate sentence-transformer embeddings, compute cosine similarities, match skills, rank candidates, and display circular match gauges.
5. Click **"View GPT Analysis & Qs"** on any candidate card to open the detail view containing:
   - GPT match score explanation
   - Personalized 5-8 interview questions with 1-click copy buttons
   - Side-by-side matched vs missing skills
   - Demographic bias sanitization text preview
