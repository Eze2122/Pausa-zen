# Backend: server time + health endpoints for PAUSA
import os, time, requests
BASE_URL = os.environ.get('EXPO_PUBLIC_BACKEND_URL').rstrip('/')

def test_time_returns_now_ms():
    r = requests.get(f"{BASE_URL}/api/time", timeout=15)
    assert r.status_code == 200
    d = r.json()
    assert isinstance(d["now"], int)
    assert abs(d["now"] - int(time.time() * 1000)) < 120000

def test_root():
    r = requests.get(f"{BASE_URL}/api/", timeout=15)
    assert r.status_code == 200 and r.json()["message"] == "Hello World"
