import io
import zipfile
import xml.etree.ElementTree as ET

def extract_text_from_docx(content: bytes) -> str:
    """Extract raw text from a .docx file."""
    try:
        with zipfile.ZipFile(io.BytesIO(content)) as z:
            xml_content = z.read('word/document.xml')
            tree = ET.fromstring(xml_content)
            
            namespaces = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
            paragraphs = []
            
            for p in tree.findall('.//w:p', namespaces):
                texts = [node.text for node in p.findall('.//w:t', namespaces) if node.text]
                if texts:
                    paragraphs.append(''.join(texts))
            
            return '\n'.join(paragraphs).strip()
    except (zipfile.BadZipFile, KeyError, ET.ParseError) as exc:
        raise ValueError("Invalid DOCX file") from exc
