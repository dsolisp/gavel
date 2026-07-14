import requests

def test_uses_explicit_port():
    response = requests.get('https://api.test:9090/status')
