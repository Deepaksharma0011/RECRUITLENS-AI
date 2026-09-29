import logging
import json
from typing import Dict, Any, Optional
from app.config import settings

logger = logging.getLogger(__name__)

def call_llm(prompt: str, system_prompt: str = "You are an expert HR recruiter and talent evaluation AI assistant.") -> Optional[str]:
    """Call OpenAI API if OPENAI_API_KEY is configured."""
    api_key = settings.OPENAI_API_KEY.strip() if settings.OPENAI_API_KEY else ""
    
    if not api_key:
        logger.info("OPENAI_API_KEY is not set. Using intelligent rule-based local LLM fallback.")
        return None
        
    try:
        from openai import OpenAI
        client = OpenAI(api_key=api_key)
        response = client.chat.completions.create(
            model="gpt-3.5-turbo", # or gpt-4o-mini
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=800
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        logger.error(f"OpenAI API call failed ({e}). Falling back to local intelligence generator.")
        return None
