import requests

def test_uses_raw_ip():
    response = requests.get('http://10.0.0.1/health')
