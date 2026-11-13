import logging
from typing import List
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
            logger.info("SentenceTransformer model loaded and ready in memory.")
        except Exception as e:
            logger.error(f"Failed to load sentence_transformers ({e}).")
            _model = False
    return _model

def condense_for_embedding(text: str, max_chars: int = 1200) -> str:
    """
    Condenses resume or JD text to the most salient window for fast transformer encoding.
    MiniLM-L6-v2 max sequence length is 256 WordPiece tokens (~1,000-1,200 chars).
    """
    if not text:
        return ""
    text_clean = " ".join(text.split())
    return text_clean[:max_chars]

def compute_cosine_similarity(vec1: np.ndarray, vec2: np.ndarray) -> float:
    dot = np.dot(vec1, vec2)
    norm1 = np.linalg.norm(vec1)
    norm2 = np.linalg.norm(vec2)
    if norm1 == 0 or norm2 == 0:
        return 0.0
    return float(dot / (norm1 * norm2))

def compute_batch_semantic_similarity(candidate_texts: List[str], jd_text: str) -> List[float]:
    """
    Computes semantic cosine similarity for multiple candidates in a SINGLE batched forward pass.
    Drastically faster than sequential individual encoding passes.
    """
    if not candidate_texts:
        return []

    model = get_embedding_model()
    if model:
        try:
            condensed_jd = condense_for_embedding(jd_text)
            condensed_cands = [condense_for_embedding(t) for t in candidate_texts]

            # Encode JD + all candidates in ONE batch forward pass
            all_texts = [condensed_jd] + condensed_cands
            embeddings = model.encode(all_texts, batch_size=len(all_texts), show_progress_bar=False)

            jd_vec = embeddings[0]
            cand_vecs = embeddings[1:]

            jd_norm = np.linalg.norm(jd_vec)
            if jd_norm == 0:
                return [0.0] * len(candidate_texts)

            cand_norms = np.linalg.norm(cand_vecs, axis=1)
            cand_norms[cand_norms == 0] = 1.0

            dots = np.dot(cand_vecs, jd_vec)
            similarities = dots / (cand_norms * jd_norm)
            return [float(np.clip(s, 0.0, 1.0)) for s in similarities]
        except Exception as e:
            logger.error(f"Batch embedding error: {e}")

    # High-speed fallback: Token set overlap
    jd_words = set(jd_text.lower().split())
    if not jd_words:
        return [0.0] * len(candidate_texts)

    results = []
    for cand_text in candidate_texts:
        cand_words = set(cand_text.lower().split())
        overlap = len(cand_words.intersection(jd_words))
        results.append(min(1.0, overlap / (len(jd_words) * 0.5)))
    return results

def compute_semantic_similarity(resume_text: str, jd_text: str) -> float:
    res = compute_batch_semantic_similarity([resume_text], jd_text)
    return res[0] if res else 0.0
