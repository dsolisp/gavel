import requests

def test_fetches_from_localhost():
    response = requests.get('http://localhost:5000/api')
