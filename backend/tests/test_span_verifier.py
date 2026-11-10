from app.services.span_verifier import verify_quote_in_source

def test_verbatim_quote_exact_match():
    source_text = "The quick brown fox jumps over the lazy dog."
    quote = "brown fox jumps"

    is_verified, start, end, reason = verify_quote_in_source(quote, source_text)

    assert is_verified is True
    assert start == 10
    assert end == 25
    assert source_text[start:end] == quote
    assert reason is None

def test_verbatim_quote_not_found():
    source_text = "The quick brown fox jumps over the lazy dog."
    quote = "green dragon flies"

    is_verified, start, end, reason = verify_quote_in_source(quote, source_text)

    assert is_verified is False
    assert start == -1
    assert end == -1
    assert "was not found" in reason

def test_verbatim_quote_with_newline_normalization():
    source_text = "First paragraph\r\nSecond paragraph has key details\r\nThird paragraph."
    quote = "Second paragraph has key details"

    is_verified, start, end, reason = verify_quote_in_source(quote, source_text)

    assert is_verified is True
    assert start > 0
    assert end > start
    assert reason is None

def test_verbatim_quote_empty():
    source_text = "Some text."
    is_verified, start, end, reason = verify_quote_in_source("", source_text)

    assert is_verified is False
    assert reason == "Empty quote string"
