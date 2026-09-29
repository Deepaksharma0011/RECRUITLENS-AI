import logging
import re
import html
import urllib.request
import urllib.parse
import json
from typing import Dict, Any, List
from app.llm.gpt_client import call_llm

logger = logging.getLogger(__name__)

def fetch_live_web_suggestions(query: str) -> List[str]:
    """
    Queries real-time live internet auto-complete APIs (DuckDuckGo & Google Suggest)
    to dynamically discover authentic job roles from the web for any query.
    """
    if not query or len(query.strip()) < 1:
        return []

    q_clean = query.strip()
    suggestions = []
    seen = set()

    # 1. DuckDuckGo Autocomplete
    try:
        ddg_url = f"https://duckduckgo.com/ac/?q={urllib.parse.quote(q_clean)}&type=list"
        req = urllib.request.Request(ddg_url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=3) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            for item in data[1]:
                cleaned = clean_job_title_string(item)
                if cleaned and cleaned.lower() not in seen and len(cleaned) >= 3:
                    seen.add(cleaned.lower())
                    suggestions.append(cleaned)
    except Exception as e:
        logger.debug(f"DuckDuckGo suggestion error: {e}")

    # 2. Google Suggest
    try:
        g_url = f"https://suggestqueries.google.com/complete/search?client=firefox&q={urllib.parse.quote(q_clean + ' jobs')}"
        req = urllib.request.Request(g_url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=3) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            for item in data[1]:
                cleaned = clean_job_title_string(item)
                if cleaned and cleaned.lower() not in seen and len(cleaned) >= 3:
                    seen.add(cleaned.lower())
                    suggestions.append(cleaned)
    except Exception as e:
        logger.debug(f"Google suggestion error: {e}")

    # Fallback to query title if nothing returned
    if not suggestions:
        title_case = q_clean.title()
        suggestions = [
            title_case,
            f"Senior {title_case}",
            f"Lead {title_case}",
            f"{title_case} Specialist",
            f"{title_case} Manager"
        ]

    return suggestions[:8]

def clean_job_title_string(raw: str) -> str:
    """Cleans search engine noise from title strings."""
    t = raw.strip()
    # Remove search artifacts like "jobs", "jobs near me", "salary", "job description", "in dubai"
    t = re.sub(r'\b(jobs?|salary|near me|in\s+\w+|for freshers?|entry level|interview questions?|remote|description|part time|online|pdf|template|meaning|reddit|indeed|linkedin)\b', '', t, flags=re.IGNORECASE)
    t = re.sub(r'[\(\)\[\]\-]+', ' ', t)
    t = re.sub(r'\s+', ' ', t).strip()
    return t.title()

def get_online_job_title_suggestions(query: str) -> List[str]:
    """Public router function that fetches live web suggestions."""
    return fetch_live_web_suggestions(query)

def fetch_live_web_job_snippets(query: str) -> List[str]:
    """Fetches real-time live internet web snippets for the role."""
    try:
        encoded = urllib.parse.quote(f"{query} job description responsibilities skills requirements")
        url = f"https://html.duckduckgo.com/html/?q={encoded}"
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        }
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=4) as response:
            html_content = response.read().decode('utf-8', errors='ignore')
            snippets = re.findall(r'<a class="result__snippet[^>]*>(.*?)</a>', html_content, re.DOTALL)
            clean_snippets = []
            for s in snippets:
                clean_s = html.unescape(re.sub(r'<.*?>', '', s)).strip()
                if len(clean_s) > 25:
                    clean_snippets.append(clean_s)
            return clean_snippets[:6]
    except Exception as e:
        logger.debug(f"Live web snippet error: {e}")
        return []

def extract_skills_and_tasks_from_web(role_title: str, web_snippets: List[str]) -> Dict[str, Any]:
    """
    Dynamically analyzes live web snippets for the specific job role to extract
    authentic domain skills, responsibilities, and qualifications without static sets.
    """
    combined_text = " ".join(web_snippets)
    
    # Common stop words & search boilerplates
    stopwords = {
        'the', 'and', 'for', 'with', 'from', 'this', 'that', 'have', 'been', 'will',
        'your', 'their', 'must', 'should', 'more', 'about', 'including', 'such',
        'build', 'post', 'today', 'description', 'page', 'contains', 'plus', 'explore',
        'learn', 'differ', 'other', 'roles', 'complete', 'needed', 'details', 'application',
        'instructions', 'well-written', 'guide', 'provides', 'commonly', 'perform',
        'presents', 'important', 'expected', 'meet', 'hired', 'most', 'employers',
        'salary', 'insights', 'using', 'list', 'duties', 'looking', 'someone', 'seeking',
        'join', 'team', 'ideal', 'candidate', 'responsibilities', 'qualifications'
    }

    # Extract 2-3 word key skill phrases from live web text
    phrases = re.findall(r'\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+\b', combined_text)
    words = re.findall(r'\b[A-Za-z0-9+#./-]{3,}\b', combined_text)

    skills_extracted = []
    seen_skills = set()

    for p in phrases:
        p_clean = p.strip()
        p_lower = p_clean.lower()
        if not any(sw in p_lower for sw in ['job description', 'page contains', 'salary insights', 'explore a detailed', 'build your own']):
            if p_lower not in seen_skills and len(p_clean) > 4:
                seen_skills.add(p_lower)
                skills_extracted.append(p_clean)

    for w in words:
        w_lower = w.lower()
        if w_lower not in stopwords and len(w) >= 4 and w_lower not in seen_skills:
            seen_skills.add(w_lower)
            skills_extracted.append(w.title())

    top_skills = skills_extracted[:10]
    if len(top_skills) < 4:
        top_skills = [
            f"{role_title} Operations & Execution",
            "Cross-functional Collaboration",
            "Domain Best Practices",
            "Performance Analysis & Reporting",
            "Quality Assurance",
            "Strategic Project Planning"
        ]

    # Build clean responsibilities from live web sentences
    clean_sentences = []
    for snip in web_snippets:
        sentences = re.split(r'[.!?]+', snip)
        for s in sentences:
            s_clean = s.strip()
            # Filter out search artifacts
            if (len(s_clean) > 35 and
                not any(k in s_clean.lower() for k in ['click here', 'post your job', 'salary insights', 'explore a detailed', 'build your own', 'page contains'])):
                clean_sentences.append(s_clean)

    if clean_sentences:
        resp_bullets = "\n".join([f"• {s}." for s in clean_sentences[:4]])
    else:
        resp_bullets = (
            f"• Lead, develop, and execute key operational workflows for the {role_title} function.\n"
            f"• Collaborate with cross-functional stakeholders to deliver on core business objectives.\n"
            f"• Monitor quality metrics, resolve domain-specific challenges, and optimize processes.\n"
            f"• Maintain rigorous documentation, reporting, and continuous improvement standards."
        )

    return {
        "skills": ", ".join(top_skills),
        "responsibilities": resp_bullets
    }

def generate_jd_from_search(query: str) -> Dict[str, Any]:
    """
    Dynamically generates a comprehensive Job Description for ANY job role in the world
    by fetching live web data from the internet in real-time.
    """
    clean_title = clean_job_title_string(query)
    if not clean_title:
        clean_title = query.strip().title()

    # 1. Try LLM first if API key is active
    system_prompt = (
        "You are an expert executive recruiter. "
        "Generate a comprehensive, structured Job Description tailored strictly to the specified role, including: "
        "Job Title, Experience Level, Role Overview, Core Responsibilities, "
        "and a bulleted list of Required Skills & Preferred Qualifications appropriate for that exact profession."
    )
    user_prompt = f"Generate an industry-standard Job Description strictly for: '{clean_title}'."
    gpt_res = call_llm(user_prompt, system_prompt)

    if gpt_res and len(gpt_res.strip()) >= 50:
        title = clean_title
        for line in gpt_res.split('\n'):
            if line.lower().startswith('job title:'):
                title = line.split(':', 1)[1].strip()
                break
        return {"job_title": title, "jd_text": gpt_res.strip()}

    # 2. Live Internet Web Search & Extraction
    web_snippets = fetch_live_web_job_snippets(clean_title)
    web_data = extract_skills_and_tasks_from_web(clean_title, web_snippets)

    jd_content = f"""Job Title: {clean_title}
Experience Required: 2-5+ Years
Work Location: Hybrid / Remote / Onsite

Role Overview:
We are seeking a proactive and skilled {clean_title} to join our organization. In this role, you will be responsible for executing domain-specific deliverables, collaborating with cross-functional team members, and driving measurable excellence in our {clean_title} initiatives.

Key Responsibilities:
{web_data['responsibilities']}

Required Technical & Operational Skills:
• {web_data['skills']}

Preferred Qualifications:
• Proven track record and hands-on experience in the {clean_title} field.
• Strong analytical mindset, problem-solving ability, and detail orientation.
• Exceptional written and verbal communication and stakeholder management skills."""

    return {
        "job_title": clean_title,
        "jd_text": jd_content.strip()
    }
