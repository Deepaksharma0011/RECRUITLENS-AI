import logging
import numpy as np
from app.config import settings

logger = logging.getLogger(__name__)

_model = None

def get_embedding_model():
    global _model
    if _model is None:
        try:
            from sentence_transformers import SentenceTransformer
            _model = SentenceTransformer(settings.EMBEDDING_MODEL_NAME)
        except Exception as e:
            logger.error(f"Failed to load sentence_transformers ({e}).")
            _model = False
    return _model

def compute_cosine_similarity(vec1: np.ndarray, vec2: np.ndarray) -> float:
    dot = np.dot(vec1, vec2)
    norm1 = np.linalg.norm(vec1)
    norm2 = np.linalg.norm(vec2)
    if norm1 == 0 or norm2 == 0:
        return 0.0
    return float(dot / (norm1 * norm2))

def compute_semantic_similarity(resume_text: str, jd_text: str) -> float:
    model = get_embedding_model()
    if model:
        try:
            embeddings = model.encode([resume_text, jd_text])
            sim = compute_cosine_similarity(embeddings[0], embeddings[1])
            return max(0.0, min(1.0, float(sim)))
        except Exception as e:
            logger.error(f"Embedding error: {e}")

    words1 = set(resume_text.lower().split())
    words2 = set(jd_text.lower().split())
    if not words1 or not words2:
        return 0.0
    overlap = len(words1.intersection(words2))
    return min(1.0, overlap / (len(words2) * 0.5))
