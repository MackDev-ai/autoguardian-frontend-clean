from typing import Any, Dict


def extract_policy_metadata(file_bytes: bytes, filename: str) -> Dict[str, Any]:
    # Placeholder extraction logic. In production integrate pdfplumber/pytesseract.
    text = file_bytes.decode("utf-8", errors="ignore")
    return {
        "raw_text": text,
        "extracted_fields": {
            "insurer": None,
            "policy_number": None,
            "start_date": None,
            "end_date": None,
            "premium_total": None,
            "confidence": 0.0,
        },
    }
