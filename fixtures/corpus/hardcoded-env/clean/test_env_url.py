import os

def test_uses_env_url():
    response_url = os.environ['API_URL']
