import os


def test_multiline_getenv_fallback():
    base_url = os.getenv(
        'API_URL',
        'http://127.0.0.1:8000',
    )
    return base_url
