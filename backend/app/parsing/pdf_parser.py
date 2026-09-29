import io
import logging

logger = logging.getLogger(__name__)

def extract_text_from_pdf(content: bytes) -> str:
    """Extract raw text from PDF using pypdf with fallback to pdfplumber."""
    extracted_text = []
    
    try:
        from pypdf import PdfReader
        reader = PdfReader(io.BytesIO(content))
        for page in reader.pages:
            t = page.extract_text()
            if t:
                extracted_text.append(t)
    except Exception as e:
        logger.warning(f"pypdf extraction failed ({e}), trying pdfplumber fallback.")

    if not extracted_text:
        try:
            import pdfplumber
            with pdfplumber.open(io.BytesIO(content)) as pdf:
                for page in pdf.pages:
                    t = page.extract_text()
                    if t:
                        extracted_text.append(t)
        except Exception as e:
            logger.error(f"pdfplumber extraction failed ({e}).")

    return "\n\n".join(extracted_text).strip()
