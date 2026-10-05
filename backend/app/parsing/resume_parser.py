import re
from typing import List, Dict, Any, Optional

COMMON_SKILLS_TAXONOMY = {
    # Social Media, Digital Marketing & Content
    "social media", "social media marketing", "social media management", "content creation",
    "content strategy", "content writing", "copywriting", "instagram", "facebook", "meta ads",
    "facebook ads", "linkedin", "tiktok", "youtube", "twitter", "canva", "adobe photoshop",
    "photoshop", "adobe illustrator", "illustrator", "video editing", "reels", "shorts",
    "hootsuite", "buffer", "sprout social", "google analytics", "google ads", "seo", "sem",
    "search engine optimization", "email marketing", "mailchimp", "influencer marketing",
    "influencer outreach", "community management", "brand management", "brand strategy",
    "public relations", "pr", "digital marketing", "growth marketing", "campaign management",
    "market research", "lead generation", "storytelling", "graphic design",

    # Business, Sales, HR & Operations
    "crm", "salesforce", "hubspot", "b2b", "b2c", "account management", "client servicing",
    "negotiation", "sales strategy", "event management", "project management", "ms excel",
    "excel", "powerpoint", "ms office", "budgeting", "financial analysis", "talent acquisition",
    "recruitment", "human resources", "onboarding", "payroll", "employee engagement",
    "stakeholder management", "customer support", "customer success",

    # Design & Creative
    "ui/ux", "ui design", "ux design", "figma", "adobe xd", "premiere pro", "after effects",
    "visual design", "wireframing", "prototyping", "branding", "typography",

    # Programming Languages & Core Tech
    "python", "javascript", "typescript", "java", "c++", "c#", "ruby", "go", "golang", "rust",
    "php", "swift", "kotlin", "r", "scala", "html", "css", "sql", "bash", "shell",
    
    # Frameworks & Libraries
    "react", "react.js", "reactjs", "next.js", "vue", "vue.js", "angular", "node", "node.js", "express",
    "fastapi", "flask", "django", "spring", "spring boot", "dot net", ".net", "laravel", "tailwind",
    "bootstrap", "redux", "graphql", "rest", "rest api", "pandas", "numpy", "scikit-learn", "sklearn",
    "tensorflow", "pytorch", "keras", "spacy", "nltk", "opencv", "matplotlib", "seaborn",
    
    # Cloud & DevOps
    "aws", "amazon web services", "azure", "gcp", "google cloud", "docker", "kubernetes", "k8s",
    "jenkins", "terraform", "ansible", "git", "github", "gitlab", "ci/cd", "linux", "unix",
    "helm", "prometheus", "grafana", "nginx", "apache", "microservices",
    
    # Databases & AI/ML
    "postgresql", "postgres", "mysql", "mongodb", "sqlite", "redis", "dynamodb", "elasticsearch",
    "cassandra", "snowflake", "bigquery", "machine learning", "deep learning", "nlp", "llm",
    "generative ai", "rag", "langchain", "embeddings", "transformers", "data analysis",
    
    # Methodologies & Core Competencies
    "agile", "scrum", "kanban", "jira", "communication", "leadership", "problem solving",
    "teamwork", "critical thinking", "collaboration", "adaptability", "multitasking"
}

SKILL_STOPWORDS = {
    "does", "do", "did", "done", "will", "would", "shall", "should", "can", "could", "may", "might",
    "must", "have", "has", "had", "having", "is", "are", "was", "were", "be", "been", "being",
    "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "with", "from", "by",
    "about", "against", "between", "into", "through", "during", "before", "after", "above", "below",
    "up", "down", "out", "off", "over", "under", "again", "further", "then", "once", "here", "there",
    "when", "where", "why", "how", "all", "any", "both", "each", "few", "more", "most", "other",
    "some", "such", "no", "nor", "not", "only", "own", "same", "so", "than", "too", "very", "just",
    "years", "year", "month", "months", "role", "roles", "responsible", "duties", "task", "tasks",
    "work", "worked", "working", "job", "team", "project", "projects", "company", "clients", "client",
    "using", "used", "etc", "including", "good", "strong", "excellent", "high", "great", "well",
    "ability", "knowledge", "experience", "experienced", "skills", "proficient", "familiar",
    "requirement", "requirements", "candidate", "candidates", "overview", "summary", "responsibilities"
}

SECTION_KEYWORDS = {
    'experience', 'education', 'skills', 'projects', 'summary', 'objective', 'contact',
    'about', 'work', 'employment', 'activities', 'certifications', 'honors', 'awards',
    'languages', 'references', 'experienceeducation', 'workexperience', 'skillseducation',
    'curriculum', 'vitae', 'resume', 'profile', 'personal', 'details', 'qualification'
}

def extract_email(text: str) -> Optional[str]:
    match = re.search(r'[\w\.-]+@[\w\.-]+\.\w+', text)
    return match.group(0) if match else None

def extract_phone(text: str) -> Optional[str]:
    match = re.search(r'(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}', text)
    return match.group(0) if match else None

def extract_candidate_name(text: str, filename: str) -> str:
    """Extract candidate name cleanly from text or filename fallback."""
    # Clean filename candidate
    clean_fn = re.sub(r'[\-_.]', ' ', filename.rsplit('.', 1)[0])
    clean_fn = re.sub(r'\b(resume|cv|parsed|profile|document|final|updated|new)\b', '', clean_fn, flags=re.IGNORECASE).strip()
    fallback_name = clean_fn.title() if len(clean_fn) >= 3 else "Candidate"

    lines = [line.strip() for line in text.split('\n') if line.strip()]
    for line in lines[:5]:
        line_clean = re.sub(r'[^\w\s]', '', line).strip()
        line_compact = line_clean.lower().replace(' ', '')
        
        # Skip section headers or contact details
        if any(sec in line_compact for sec in SECTION_KEYWORDS):
            continue
        if re.search(r'[@\d:]', line):
            continue
            
        words = line_clean.split()
        if 2 <= len(words) <= 4 and all(w.isalpha() and len(w) >= 2 for w in words):
            # Looks like a genuine human full name (e.g. "Aditi Vyas")
            return line_clean.title()

    return fallback_name

def extract_skills(text: str) -> List[str]:
    text_lower = text.lower()
    found_skills = set()
    
    # 1. Match against known taxonomy
    for skill in COMMON_SKILLS_TAXONOMY:
        pattern = r'(?:\b|_)' + re.escape(skill) + r'(?:\b|_)'
        if re.search(pattern, text_lower):
            found_skills.add(skill)
            
    # 2. Heuristic skills section extraction with strict stopword filter
    skills_section = re.search(r'(?:skills|technical skills|key skills|expertise|competencies)[\s:]*\n([\s\S]{1,500})(?:\n\n|\n[A-Z]|$)', text, re.IGNORECASE)
    if skills_section:
        raw_section_text = skills_section.group(1)
        items = re.split(r'[,;•\n|/]', raw_section_text)
        for item in items:
            cleaned = item.strip().lower()
            cleaned = re.sub(r'^[•\-\*\d\.\s]+', '', cleaned)
            if 2 <= len(cleaned) <= 30 and not re.search(r'\d', cleaned) and cleaned not in SKILL_STOPWORDS:
                found_skills.add(cleaned)

    # Format output casing
    formatted = []
    for s in sorted(list(found_skills)):
        if s in SKILL_STOPWORDS or len(s) < 2:
            continue
        if s in ['aws', 'gcp', 'sql', 'nlp', 'llm', 'rag', 'ci/cd', 'k8s', 'tdd', 'api', 'cv', 'seo', 'sem', 'crm', 'pr', 'b2b', 'b2c', 'hr']:
            formatted.append(s.upper())
        elif s in ['react.js', 'vue.js', 'node.js', 'next.js']:
            formatted.append(s.title().replace('.Js', '.js'))
        else:
            formatted.append(s.title())
            
    return formatted

def extract_experience_years(text: str) -> float:
    """Heuristic to estimate experience years from text numbers and date ranges."""
    matches = re.findall(r'(\d+)\+?\s*(?:years?|yrs?)\s*(?:of)?\s*(?:experience|exp)', text, re.IGNORECASE)
    if matches:
        return float(max(int(m) for m in matches))
    
    # Look for year ranges like 2018 - 2023 or 2020 - Present
    year_ranges = re.findall(r'(20\d{2}|19\d{2})\s*[-–—to]+\s*(20\d{2}|present|current)', text, re.IGNORECASE)
    if year_ranges:
        total_years = 0.0
        current_year = 2026
        for start, end in year_ranges:
            s_yr = int(start)
            e_yr = current_year if end.lower() in ['present', 'current'] else int(end)
            diff = max(0, e_yr - s_yr)
            total_years += diff
        return min(total_years, 30.0)
    
    return 0.0

def extract_education(text: str) -> List[str]:
    degrees = []
    degree_patterns = [
        r"(Bachelor[^\n,]*|B\.S\.|B\.A\.|B\.E\.|B\.Tech[^\n,]*)",
        r"(Master[^\n,]*|M\.S\.|M\.A\.|M\.E\.|M\.Tech[^\n,]*)",
        r"(Ph\.D\.|Doctorate[^\n,]*)",
        r"(Associate[^\n,]*|A\.S\.|A\.A\.[^\n,]*)"
    ]
    for pattern in degree_patterns:
        found = re.findall(pattern, text, re.IGNORECASE)
        for f in found:
            clean = f.strip()
            if clean and clean not in degrees:
                degrees.append(clean)
    return degrees

def extract_certifications(text: str) -> List[str]:
    cert_section = re.search(r'(?:certifications?|certificates?|licenses?)[\s:]*\n([\s\S]{1,400})(?:\n\n|\n[A-Z])', text, re.IGNORECASE)
    certs = []
    if cert_section:
        items = re.split(r'[\n•;]', cert_section.group(1))
        for item in items:
            clean = item.strip()
            if len(clean) > 3:
                certs.append(clean)
    return certs[:5]

def parse_resume_content(raw_text: str, filename: str, candidate_id: str) -> Dict[str, Any]:
    """Main parsing handler for resume text."""
    name = extract_candidate_name(raw_text, filename)
    email = extract_email(raw_text)
    phone = extract_phone(raw_text)
    skills = extract_skills(raw_text)
    exp_years = extract_experience_years(raw_text)
    education = extract_education(raw_text)
    certs = extract_certifications(raw_text)
    
    return {
        "candidate_id": candidate_id,
        "filename": filename,
        "name": name,
        "email": email,
        "phone": phone,
        "skills": skills,
        "experience_years": exp_years,
        "education": education,
        "certifications": certs,
        "raw_text": raw_text
    }
