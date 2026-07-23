import os


def test_uses_env_url_with_fallback():
    base_url = os.environ.get('API_URL', 'http://localhost:3000')
    return base_url
