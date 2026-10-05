import logging
import json
import urllib.request
import urllib.error
from typing import Dict, Any, Optional
from app.config import settings

logger = logging.getLogger(__name__)

def call_gemini(prompt: str, system_prompt: str = "") -> Optional[str]:
    """Call Google Gemini API using configured GEMINI_API_KEY."""
    gemini_key = settings.GEMINI_API_KEY.strip() if settings.GEMINI_API_KEY else ""
    if not gemini_key:
        return None

    try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key={gemini_key}"
        
        full_text = f"{system_prompt}\n\n{prompt}" if system_prompt else prompt
        payload = {
            "contents": [{
                "parts": [{"text": full_text}]
            }],
            "generationConfig": {
                "temperature": 0.4,
                "maxOutputTokens": 1000
            }
        }
        
        data_bytes = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            url,
            data=data_bytes,
            headers={"Content-Type": "application/json"},
            method="POST"
        )
        
        with urllib.request.urlopen(req, timeout=12) as response:
            res_data = json.loads(response.read().decode("utf-8"))
            candidates = res_data.get("candidates", [])
            if candidates and "content" in candidates[0]:
                parts = candidates[0]["content"].get("parts", [])
                if parts and "text" in parts[0]:
                    return parts[0]["text"].strip()
    except Exception as e:
        logger.warning(f"Gemini API call failed: {e}")
        
    return None

def call_openai(prompt: str, system_prompt: str = "") -> Optional[str]:
    """Call OpenAI API if OPENAI_API_KEY is configured."""
    api_key = settings.OPENAI_API_KEY.strip() if settings.OPENAI_API_KEY else ""
    if not api_key or not api_key.startswith("sk-"):
        return None
        
    try:
        from openai import OpenAI
        client = OpenAI(api_key=api_key)
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt or "You are an expert HR recruiter assistant."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.4,
            max_tokens=1000
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        logger.warning(f"OpenAI API call failed: {e}")
        return None

def call_llm(prompt: str, system_prompt: str = "You are an expert HR recruiter and talent evaluation AI assistant.") -> Optional[str]:
    """Unified LLM call interface: tries Gemini first, then OpenAI."""
    # 1. Try Gemini
    gemini_resp = call_gemini(prompt, system_prompt)
    if gemini_resp:
        return gemini_resp

    # 2. Try OpenAI
    openai_resp = call_openai(prompt, system_prompt)
    if openai_resp:
        return openai_resp

    logger.info("No external LLM available. Falling back to intelligent role-based dynamic generator.")
    return None
