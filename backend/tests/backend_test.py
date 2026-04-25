"""Backend API tests for PAL Institute."""
import os
import pytest
import requests
from datetime import datetime, timedelta

BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/") if os.environ.get("REACT_APP_BACKEND_URL") else None

# Fallback: read from frontend/.env if not in env
if not BASE_URL:
    from pathlib import Path
    env_path = Path("/app/frontend/.env")
    for line in env_path.read_text().splitlines():
        if line.startswith("REACT_APP_BACKEND_URL="):
            BASE_URL = line.split("=", 1)[1].strip().rstrip("/")
            break

API = f"{BASE_URL}/api"
ADMIN_PASSWORD = "admin123"


def _future_weekday_date():
    """Return a date 5 days in future, skipping Sundays."""
    d = datetime.utcnow().date() + timedelta(days=5)
    while d.weekday() == 6:
        d += timedelta(days=1)
    return d.isoformat()


# ---------- Shared ----------
@pytest.fixture(scope="session")
def admin_token():
    r = requests.post(f"{API}/admin/login", json={"password": ADMIN_PASSWORD}, timeout=15)
    assert r.status_code == 200, f"Admin login failed: {r.status_code} {r.text}"
    token = r.json().get("token")
    assert token
    return token


@pytest.fixture()
def auth_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


# ---------- Health ----------
def test_root():
    r = requests.get(f"{API}/", timeout=10)
    assert r.status_code == 200
    assert r.json().get("status") == "ok"


def test_health():
    r = requests.get(f"{API}/health", timeout=10)
    assert r.status_code == 200
    body = r.json()
    assert body.get("status") == "ok"
    assert body.get("db") == "connected"


# ---------- Public Forms - Consent validation ----------
def test_booking_consent_false_rejected():
    payload = {
        "student_name": "TEST S", "parent_name": "TEST P", "phone": "9876543210",
        "email": "t@t.com", "student_class": "10", "program": "Class 10 Foundation",
        "preferred_date": _future_weekday_date(), "preferred_timing": "4 PM",
        "source": "Website", "consent": False,
    }
    r = requests.post(f"{API}/bookings", json=payload, timeout=15)
    assert r.status_code == 400
    detail = r.json().get("detail", "")
    assert "consent" in detail.lower()
    assert "Terms & Conditions" in detail and "Privacy Policy" in detail


def test_booking_consent_true_ok():
    payload = {
        "student_name": "TEST_Booking Student", "parent_name": "TEST Parent",
        "phone": "9876543210", "email": "t@t.com", "student_class": "10",
        "program": "Class 10 Foundation", "preferred_date": _future_weekday_date(),
        "preferred_timing": "4 PM", "source": "Website", "consent": True,
    }
    r = requests.post(f"{API}/bookings", json=payload, timeout=15)
    assert r.status_code == 200, r.text
    data = r.json()
    assert data.get("success") is True
    assert isinstance(data.get("id"), str) and len(data["id"]) > 0
    assert "_id" not in data


def test_enquiry_consent_flow():
    bad = {
        "student_name": "TEST", "parent_name": "TEST", "phone": "9876543210",
        "student_class": "10", "program": "JEE", "source": "Website", "consent": False,
    }
    r = requests.post(f"{API}/enquiries", json=bad, timeout=15)
    assert r.status_code == 400

    good = {**bad, "student_name": "TEST_Enq", "consent": True}
    r = requests.post(f"{API}/enquiries", json=good, timeout=15)
    assert r.status_code == 200
    assert r.json().get("id")


def test_scholarship_consent_flow():
    bad = {
        "student_name": "TEST", "parent_name": "TEST", "phone": "9876543210",
        "student_class": "10", "program": "Scholarship Test", "consent": False,
    }
    r = requests.post(f"{API}/scholarship", json=bad, timeout=15)
    assert r.status_code == 400

    good = {**bad, "student_name": "TEST_Sch", "consent": True}
    r = requests.post(f"{API}/scholarship", json=good, timeout=15)
    assert r.status_code == 200
    assert r.json().get("id")


def test_contact_no_consent_required():
    payload = {"name": "TEST User", "phone": "9876543210", "email": "t@t.com", "message": "hi"}
    r = requests.post(f"{API}/contact", json=payload, timeout=15)
    assert r.status_code == 200
    assert r.json().get("id")


def test_public_toppers_list():
    r = requests.get(f"{API}/toppers", timeout=15)
    assert r.status_code == 200
    assert isinstance(r.json(), list)
    # No _id leak
    for item in r.json():
        assert "_id" not in item


# ---------- Admin Auth ----------
def test_admin_login_wrong_password():
    r = requests.post(f"{API}/admin/login", json={"password": "wrongpass"}, timeout=10)
    assert r.status_code == 401


def test_admin_login_correct(admin_token):
    assert admin_token
    # JWT: 3 base64 segments separated by '.'
    parts = admin_token.split(".")
    assert len(parts) == 3, f"Expected 3-segment JWT, got: {admin_token!r}"
    for seg in parts:
        assert len(seg) > 0


def test_admin_verify_invalid_token():
    r = requests.get(
        f"{API}/admin/verify",
        headers={"Authorization": "Bearer not-a-real-token"},
        timeout=10,
    )
    assert r.status_code == 401


def test_admin_verify_with_token(auth_headers):
    r = requests.get(f"{API}/admin/verify", headers=auth_headers, timeout=10)
    assert r.status_code == 200
    assert r.json().get("valid") is True


def test_admin_verify_without_token():
    r = requests.get(f"{API}/admin/verify", timeout=10)
    assert r.status_code == 401


def test_admin_bookings_requires_auth():
    r = requests.get(f"{API}/admin/bookings", timeout=10)
    assert r.status_code == 401


# ---------- Admin Lists + No _id leak ----------
def test_admin_lists_return_data_no_id(auth_headers):
    for path in ["/admin/bookings", "/admin/enquiries", "/admin/scholarship", "/admin/contacts"]:
        r = requests.get(f"{API}{path}", headers=auth_headers, timeout=15)
        assert r.status_code == 200, f"{path} -> {r.status_code}"
        data = r.json()
        assert isinstance(data, list)
        for item in data:
            assert "_id" not in item, f"{path} leaked _id"


# ---------- Status updates ----------
def test_booking_status_update(auth_headers):
    # create booking
    payload = {
        "student_name": "TEST_StatusBooking", "parent_name": "P", "phone": "9876543210",
        "student_class": "10", "program": "Class 10 Foundation",
        "preferred_date": _future_weekday_date(), "preferred_timing": "4 PM",
        "source": "Website", "consent": True,
    }
    r = requests.post(f"{API}/bookings", json=payload, timeout=15)
    bid = r.json()["id"]

    r = requests.patch(f"{API}/admin/bookings/{bid}/status",
                       headers=auth_headers, json={"status": "Called"}, timeout=15)
    assert r.status_code == 200

    # Verify via list
    r = requests.get(f"{API}/admin/bookings", headers=auth_headers, timeout=15)
    found = next((x for x in r.json() if x.get("id") == bid), None)
    assert found and found["status"] == "Called"

    # invalid id -> 404
    r = requests.patch(f"{API}/admin/bookings/nonexistent-id/status",
                       headers=auth_headers, json={"status": "Called"}, timeout=15)
    assert r.status_code == 404


def test_enquiry_status_update(auth_headers):
    payload = {
        "student_name": "TEST_StatusEnq", "parent_name": "P", "phone": "9876543210",
        "student_class": "10", "program": "JEE", "source": "Website", "consent": True,
    }
    r = requests.post(f"{API}/enquiries", json=payload, timeout=15)
    eid = r.json()["id"]

    r = requests.patch(f"{API}/admin/enquiries/{eid}/status",
                       headers=auth_headers, json={"status": "Enrolled"}, timeout=15)
    assert r.status_code == 200

    r = requests.patch(f"{API}/admin/enquiries/nonexistent-id/status",
                       headers=auth_headers, json={"status": "Called"}, timeout=15)
    assert r.status_code == 404


# ---------- Toppers CRUD ----------
def test_toppers_crud(auth_headers):
    payload = {"name": "TEST_Topper", "photo": "", "exam": "JEE", "rank": "AIR 42", "year": "2025"}
    r = requests.post(f"{API}/admin/toppers", headers=auth_headers, json=payload, timeout=15)
    assert r.status_code == 200
    created = r.json()
    assert created["name"] == "TEST_Topper"
    assert "_id" not in created
    tid = created["id"]

    # Listed publicly
    r = requests.get(f"{API}/toppers", timeout=15)
    assert any(t.get("id") == tid for t in r.json())

    # Delete
    r = requests.delete(f"{API}/admin/toppers/{tid}", headers=auth_headers, timeout=15)
    assert r.status_code == 200

    r = requests.get(f"{API}/toppers", timeout=15)
    assert not any(t.get("id") == tid for t in r.json())

    # Delete missing
    r = requests.delete(f"{API}/admin/toppers/nonexistent", headers=auth_headers, timeout=15)
    assert r.status_code == 404


# ---------- Dashboard ----------
def test_admin_dashboard(auth_headers):
    r = requests.get(f"{API}/admin/dashboard", headers=auth_headers, timeout=15)
    assert r.status_code == 200
    data = r.json()
    for key in ["total_enquiries", "total_bookings", "total_scholarship",
                "total_leads", "by_program", "by_source"]:
        assert key in data
    assert isinstance(data["by_program"], list)
    assert isinstance(data["by_source"], list)


# ---------- CSV Export ----------
def test_admin_export_csv(auth_headers):
    r = requests.get(f"{API}/admin/export/csv", headers=auth_headers, timeout=20)
    assert r.status_code == 200
    ctype = r.headers.get("content-type", "")
    assert "text/csv" in ctype
    body = r.text
    assert "student_name" in body  # header row
