from typing import Tuple, Optional
from app.models.source import SourceItem

def verify_quote_in_source(quote: str, source_text: str) -> Tuple[bool, int, int, Optional[str]]:
    """
    Verifies that a quote exists verbatim inside source_text.
    Returns (is_verified, start_offset, end_offset, failure_reason).
    """
    if not quote or not quote.strip():
        return False, -1, -1, "Empty quote string"

    clean_quote = quote.strip()

    # 1. Exact match attempt
    idx = source_text.find(clean_quote)
    if idx != -1:
        return True, idx, idx + len(clean_quote), None

    # 2. Case-sensitive whitespace normalized search
    # If the quote has newline variations (e.g. \r\n vs \n), check normalized
    norm_source = source_text.replace("\r\n", "\n")
    norm_quote = clean_quote.replace("\r\n", "\n")
    idx_norm = norm_source.find(norm_quote)
    if idx_norm != -1:
        return True, idx_norm, idx_norm + len(norm_quote), None

    # 3. Trim outer quotation marks if model wrapped them in extra quotes
    if (clean_quote.startswith('"') and clean_quote.endswith('"')) or (clean_quote.startswith("'") and clean_quote.endswith("'")):
        inner = clean_quote[1:-1].strip()
        idx_inner = source_text.find(inner)
        if idx_inner != -1:
            return True, idx_inner, idx_inner + len(inner), None

    return False, -1, -1, f"Verbatim quote '{clean_quote[:40]}...' was not found in source text (len={len(source_text)})"
