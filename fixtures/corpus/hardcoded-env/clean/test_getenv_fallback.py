import os


def test_uses_getenv_with_fallback():
    base_url = os.getenv('API_URL', 'http://127.0.0.1:8000')
    return base_url
