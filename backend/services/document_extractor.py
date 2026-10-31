import io
import re
import logging
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

try:
    import fitz  # PyMuPDF
except Exception as e:
    fitz = None
    logger.warning(f"fitz (PyMuPDF) not available in this environment: {e}")

class DocumentExtractorService:
    @staticmethod
    def extract_text_from_pdf_bytes(file_bytes: bytes, filename: str = "document.pdf") -> Dict[str, Any]:
        """
        Extracts clean text and metadata from PDF bytes using PyMuPDF or fallback.
        """
        try:
            if fitz is not None:
                doc = fitz.open(stream=file_bytes, filetype="pdf")
                total_pages = len(doc)
                full_text_list = []
                metadata = doc.metadata or {}

                for page_num in range(total_pages):
                    page = doc[page_num]
                    text = page.get_text("text")
                    cleaned_page_text = re.sub(r'\n{3,}', '\n\n', text).strip()
                    if cleaned_page_text:
                        full_text_list.append(f"--- Page {page_num + 1} ---\n{cleaned_page_text}")

                full_text = "\n\n".join(full_text_list)
                return {
                    "success": True,
                    "filename": filename,
                    "pages": total_pages,
                    "raw_text": full_text,
                    "metadata": metadata
                }
            else:
                # Lightweight regex text fallback
                raw_str = file_bytes.decode('latin-1', errors='ignore')
                text_chunks = re.findall(r'\((.*?)\)', raw_str)
                full_text = " ".join([t for t in text_chunks if len(t) > 3])
                if not full_text:
                    full_text = re.sub(r'[^\x20-\x7E\n\r\t]', ' ', raw_str)
                    full_text = re.sub(r'\s{3,}', ' ', full_text)[:4000]
                return {
                    "success": True,
                    "filename": filename,
                    "pages": 1,
                    "raw_text": full_text,
                    "metadata": {}
                }
        except Exception as e:
            logger.error(f"Failed to extract PDF text: {str(e)}", exc_info=True)
            return {
                "success": False,
                "filename": filename,
                "error": str(e),
                "raw_text": ""
            }

    @staticmethod
    def process_raw_text(text: str, source_type: str = "text") -> Dict[str, Any]:
        """
        Processes and normalizes raw text or email pastes.
        """
        cleaned = text.strip()
        return {
            "success": True,
            "source_type": source_type,
            "raw_text": cleaned,
            "length": len(cleaned)
        }
