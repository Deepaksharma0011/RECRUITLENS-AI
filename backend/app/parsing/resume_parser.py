import re
from typing import List, Dict, Any, Optional

COMMON_SKILLS_TAXONOMY = {
    # Programming Languages
    "python", "javascript", "typescript", "java", "c++", "c#", "ruby", "go", "golang", "rust",
    "php", "swift", "kotlin", "r", "scala", "html", "css", "sql", "bash", "shell",
    
    # Frameworks & Libraries
    "react", "react.js", "reactjs", "next.js", "vue", "vue.js", "angular", "node", "node.js", "express",
    "fastapi", "flask", "django", "spring", "spring boot", "dot net", ".net", "laravel", "tailwind",
    "bootstrap", "redux", "graphql", "rest", "rest api", "pandas", "numpy", "scikit-learn", "sklearn",
    "tensorflow", "pytorch", "keras", "spacy", "nltk", "opencv", "matplotlib", "seaborn",
    
    # Cloud & DevOps
    "aws", "amazon web services", "azure", "gcp", "google cloud", "docker", "kubernetes", "k8s",
    "jenkins", "terraform", "ansible", "git", "github", "gitlab", "ci/cd", "linux", "unix", "bash",
    "helm", "prometheus", "grafana", "nginx", "apache", "microservices",
    
    # Databases & Storage
    "postgresql", "postgres", "mysql", "mongodb", "sqlite", "redis", "dynamodb", "elasticsearch",
    "cassandra", "oracle", "snowflake", "bigquery", "sql server",
    
    # AI / ML & Data Science
    "machine learning", "deep learning", "nlp", "natural language processing", "cv", "computer vision",
    "llm", "large language models", "generative ai", "rag", "langchain", "embeddings", "transformers",
    "bert", "gpt", "data analysis", "data mining", "feature engineering", "neural networks",
    
    # Methodologies & Soft Skills
    "agile", "scrum", "kanban", "jira", "system design", "software architecture", "unit testing",
    "tdd", "ci/cd", "communication", "leadership", "problem solving", "critical thinking", "teamwork"
}

def extract_email(text: str) -> Optional[str]:
    match = re.search(r'[\w\.-]+@[\w\.-]+\.\w+', text)
    return match.group(0) if match else None

def extract_phone(text: str) -> Optional[str]:
    match = re.search(r'(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}', text)
    return match.group(0) if match else None

def extract_candidate_name(text: str, filename: str) -> str:
    """Extract candidate name from header lines or filename fallback."""
    lines = [line.strip() for line in text.split('\n') if line.strip()]
    if lines:
        for line in lines[:3]:
            # If line is short and looks like a clean name (no emails/numbers)
            if len(line) < 40 and not re.search(r'[@\d:]', line) and not any(kw in line.lower() for kw in ['resume', 'curriculum', 'cv', 'profile', 'page']):
                return line.title()
    
    # Fallback to filename
    clean_fn = re.sub(r'[\-_]', ' ', filename.split('.')[0])
    clean_fn = re.sub(r'(resume|cv|parsed|profile)', '', clean_fn, flags=re.IGNORECASE).strip()
    return clean_fn.title() if clean_fn else "Candidate"

def extract_skills(text: str) -> List[str]:
    text_lower = text.lower()
    found_skills = set()
    
    # Exact and regex boundary matches for canonical taxonomy skills
    for skill in COMMON_SKILLS_TAXONOMY:
        # Escaping for regex safe match (e.g. c++, node.js)
        pattern = r'(?:\b|_)' + re.escape(skill) + r'(?:\b|_)'
        if re.search(pattern, text_lower):
            # Normalize casing display
            found_skills.add(skill)
            
    # Additional skill section heuristic extraction
    skills_section = re.search(r'(?:skills|technical skills|technologies|expertise)[\s:]*\n([\s\S]{1,500})(?:\n\n|\n[A-Z])', text, re.IGNORECASE)
    if skills_section:
        raw_section_text = skills_section.group(1)
        items = re.split(r'[,;•\n|/]', raw_section_text)
        for item in items:
            cleaned = item.strip()
            if 2 <= len(cleaned) <= 30 and not re.search(r'\d', cleaned):
                found_skills.add(cleaned.lower())

    # Format prettily (Capitalize/Upper)
    formatted = []
    for s in sorted(list(found_skills)):
        if s in ['aws', 'gcp', 'sql', 'nlp', 'llm', 'rag', 'ci/cd', 'k8s', 'tdd', 'api', 'cv']:
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
