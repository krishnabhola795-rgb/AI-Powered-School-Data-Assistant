"""Regression tests for EduChat AI - lazy seed refactor."""
import os
import time
import json
import requests
import pytest

BASE = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE:
    # fallback: read from frontend/.env
    with open("/app/frontend/.env") as f:
        for line in f:
            if line.startswith("REACT_APP_BACKEND_URL="):
                BASE = line.strip().split("=", 1)[1].rstrip("/")


# --- Root readiness probe ---
class TestRoot:
    def test_root_fast_no_db(self):
        start = time.time()
        r = requests.get(f"{BASE}/api/", timeout=10)
        elapsed = time.time() - start
        assert r.status_code == 200
        data = r.json()
        assert data == {"app": "EduChat AI", "status": "ready"}
        # readiness probe must be fast - no DB touching
        assert elapsed < 2.0, f"Root took {elapsed:.2f}s, too slow for readiness"


# --- Auth ---
class TestAuth:
    def test_principal_login(self):
        r = requests.post(f"{BASE}/api/auth/login", json={
            "email": "principal@school.edu",
            "password": "principal123",
            "role": "principal",
        }, timeout=15)
        assert r.status_code == 200, r.text
        data = r.json()
        assert "token" in data and isinstance(data["token"], str) and len(data["token"]) > 0
        assert data["user"]["email"] == "principal@school.edu"
        assert data["user"]["role"] == "principal"
        assert data["user"]["name"]

    def test_invalid_login(self):
        r = requests.post(f"{BASE}/api/auth/login", json={
            "email": "principal@school.edu",
            "password": "wrong",
            "role": "principal",
        }, timeout=15)
        assert r.status_code == 401


# --- Dashboard triggers lazy seed ---
class TestDashboard:
    def test_dashboard_returns_300(self):
        r = requests.get(f"{BASE}/api/dashboard", timeout=30)
        assert r.status_code == 200
        data = r.json()
        assert data["total"] == 300, f"Expected 300 students, got {data.get('total')}"
        assert "avg_attendance" in data
        assert "avg_percentage" in data
        assert "class_performance" in data and len(data["class_performance"]) > 0
        assert "top_performers" in data and len(data["top_performers"]) == 10

    def test_dashboard_idempotent_no_duplicate_seed(self):
        """Call dashboard multiple times, total must remain 300."""
        totals = []
        for _ in range(3):
            r = requests.get(f"{BASE}/api/dashboard", timeout=15)
            assert r.status_code == 200
            totals.append(r.json()["total"])
        assert all(t == 300 for t in totals), f"Duplicate seeding detected: {totals}"


# --- Students ---
class TestStudents:
    def test_list_all_students(self):
        r = requests.get(f"{BASE}/api/students", timeout=20)
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        assert len(data) == 300, f"Expected 300 students, got {len(data)}"
        # verify shape
        s = data[0]
        for k in ("student_id", "name", "class", "section", "attendance", "total_percentage"):
            assert k in s

    def test_filter_by_class_8(self):
        r = requests.get(f"{BASE}/api/students", params={"class": 8}, timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        assert len(data) > 0, "Expected at least some class 8 students"
        assert all(s["class"] == 8 for s in data), "Filter returned non-class-8 students"


# --- Chat streaming ---
class TestChat:
    session_id = f"test-session-{int(time.time())}"

    def test_chat_stream_sse(self):
        payload = {"session_id": self.session_id, "message": "How many students are in class 5?"}
        deltas = []
        done_seen = False
        with requests.post(f"{BASE}/api/chat/stream", json=payload, stream=True, timeout=60) as r:
            assert r.status_code == 200
            assert "text/event-stream" in r.headers.get("content-type", "")
            for raw in r.iter_lines(decode_unicode=True):
                if not raw:
                    continue
                if raw.startswith("data:"):
                    obj = json.loads(raw[5:].strip())
                    if "delta" in obj:
                        deltas.append(obj["delta"])
                    if obj.get("done"):
                        done_seen = True
                        break
        assert done_seen, "Stream did not emit done event"
        assert len(deltas) > 0, "No text deltas received from LLM stream"
        # ensure no error-flagged deltas from LLM connectivity
        # (deltas may contain [Error...] if LLM failed - flag it)
        joined = "".join(deltas)
        assert "[Error contacting AI" not in joined, f"LLM error: {joined[:200]}"

    def test_chat_history_after_stream(self):
        # Depends on previous stream test writing messages
        r = requests.get(f"{BASE}/api/chat/history/{self.session_id}", timeout=15)
        assert r.status_code == 200
        msgs = r.json()
        assert isinstance(msgs, list)
        assert len(msgs) >= 2, f"Expected at least user+assistant, got {len(msgs)}"
        roles = [m["role"] for m in msgs]
        assert "user" in roles and "assistant" in roles
