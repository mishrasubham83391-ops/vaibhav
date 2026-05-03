#!/usr/bin/env python3
"""
CORS Configuration Verification Test Suite
Tests CORS headers and functional endpoints for PAL Institute API
Backend URL: https://enq-scholar-setup.preview.emergentagent.com
"""

import requests
import json
import sys
from typing import Dict, Any, Optional

# Backend URL
BASE_URL = "https://enq-scholar-setup.preview.emergentagent.com/api"
ADMIN_PASSWORD = "admin123"

# Test results tracking
test_results = []


def log_test(test_name: str, passed: bool, details: str = ""):
    """Log test result"""
    status = "✅ PASS" if passed else "❌ FAIL"
    result = f"{status}: {test_name}"
    if details:
        result += f"\n    {details}"
    print(result)
    test_results.append({"test": test_name, "passed": passed, "details": details})


def check_cors_headers(response: requests.Response, expected_origin: str, test_name: str) -> bool:
    """Verify CORS headers in response"""
    headers = {k.lower(): v for k, v in response.headers.items()}
    
    issues = []
    
    # Check allow-origin header
    allow_origin = headers.get("access-control-allow-origin")
    if not allow_origin:
        issues.append("Missing access-control-allow-origin header")
    elif allow_origin != expected_origin and allow_origin != "*":
        issues.append(f"Expected origin '{expected_origin}' but got '{allow_origin}'")
    
    # Check allow-credentials header
    allow_creds = headers.get("access-control-allow-credentials")
    if allow_creds != "true":
        issues.append(f"Expected allow-credentials: true, got: {allow_creds}")
    
    if issues:
        log_test(test_name, False, "; ".join(issues))
        return False
    else:
        log_test(test_name, True, f"Origin: {allow_origin}, Credentials: {allow_creds}")
        return True


def test_preflight_vercel():
    """Test 1: Preflight from Vercel-style origin"""
    print("\n=== Test 1: Preflight from Vercel-style origin ===")
    
    origin = "https://my-app.vercel.app"
    headers = {
        "Origin": origin,
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "content-type, authorization"
    }
    
    try:
        response = requests.options(f"{BASE_URL}/toppers", headers=headers, timeout=10)
        
        # Check status code (200 or 204 are both valid for OPTIONS)
        if response.status_code not in [200, 204]:
            log_test("Preflight Vercel - Status Code", False, f"Expected 200 or 204, got {response.status_code}")
            return False
        else:
            log_test("Preflight Vercel - Status Code", True, f"{response.status_code} OK")
        
        # Check CORS headers
        resp_headers = {k.lower(): v for k, v in response.headers.items()}
        
        # Check allow-origin
        allow_origin = resp_headers.get("access-control-allow-origin")
        if allow_origin == origin:
            log_test("Preflight Vercel - Allow Origin", True, f"Echoed: {origin}")
        else:
            log_test("Preflight Vercel - Allow Origin", False, f"Expected {origin}, got {allow_origin}")
        
        # Check allow-credentials
        allow_creds = resp_headers.get("access-control-allow-credentials")
        if allow_creds == "true":
            log_test("Preflight Vercel - Allow Credentials", True, "true")
        else:
            log_test("Preflight Vercel - Allow Credentials", False, f"Expected true, got {allow_creds}")
        
        # Check allow-methods
        allow_methods = resp_headers.get("access-control-allow-methods", "")
        if "POST" in allow_methods:
            log_test("Preflight Vercel - Allow Methods", True, f"Includes POST: {allow_methods}")
        else:
            log_test("Preflight Vercel - Allow Methods", False, f"POST not in: {allow_methods}")
        
        # Check allow-headers
        allow_headers = resp_headers.get("access-control-allow-headers", "").lower()
        if "content-type" in allow_headers and "authorization" in allow_headers:
            log_test("Preflight Vercel - Allow Headers", True, f"Includes content-type and authorization")
        else:
            log_test("Preflight Vercel - Allow Headers", False, f"Missing required headers: {allow_headers}")
        
        # Check max-age
        max_age = resp_headers.get("access-control-max-age")
        if max_age == "600":
            log_test("Preflight Vercel - Max Age", True, "600")
        else:
            log_test("Preflight Vercel - Max Age", False, f"Expected 600, got {max_age}")
        
        return True
        
    except Exception as e:
        log_test("Preflight Vercel - Request", False, f"Exception: {str(e)}")
        return False


def test_preflight_localhost():
    """Test 2: Preflight from localhost origin"""
    print("\n=== Test 2: Preflight from localhost origin ===")
    
    origin = "http://localhost:3000"
    headers = {
        "Origin": origin,
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "content-type"
    }
    
    try:
        response = requests.options(f"{BASE_URL}/admin/login", headers=headers, timeout=10)
        
        # Check status code (200 or 204 are both valid for OPTIONS)
        if response.status_code not in [200, 204]:
            log_test("Preflight Localhost - Status Code", False, f"Expected 200 or 204, got {response.status_code}")
            return False
        else:
            log_test("Preflight Localhost - Status Code", True, f"{response.status_code} OK")
        
        # Check allow-origin
        resp_headers = {k.lower(): v for k, v in response.headers.items()}
        allow_origin = resp_headers.get("access-control-allow-origin")
        if allow_origin == origin:
            log_test("Preflight Localhost - Allow Origin", True, f"Echoed: {origin}")
        else:
            log_test("Preflight Localhost - Allow Origin", False, f"Expected {origin}, got {allow_origin}")
        
        return True
        
    except Exception as e:
        log_test("Preflight Localhost - Request", False, f"Exception: {str(e)}")
        return False


def test_actual_get_with_origin():
    """Test 3: Actual GET request with Origin header"""
    print("\n=== Test 3: Actual GET request with Origin header ===")
    
    origin = "https://test-frontend.vercel.app"
    headers = {"Origin": origin}
    
    try:
        response = requests.get(f"{BASE_URL}/toppers", headers=headers, timeout=10)
        
        # Check status code
        if response.status_code != 200:
            log_test("GET with Origin - Status Code", False, f"Expected 200, got {response.status_code}")
            return False
        else:
            log_test("GET with Origin - Status Code", True, "200 OK")
        
        # Check JSON body
        try:
            data = response.json()
            if isinstance(data, list):
                log_test("GET with Origin - JSON Body", True, f"Array with {len(data)} items")
            else:
                log_test("GET with Origin - JSON Body", False, f"Expected array, got {type(data)}")
        except Exception as e:
            log_test("GET with Origin - JSON Body", False, f"Invalid JSON: {str(e)}")
        
        # Check CORS headers
        resp_headers = {k.lower(): v for k, v in response.headers.items()}
        allow_origin = resp_headers.get("access-control-allow-origin")
        if allow_origin == origin or allow_origin == "*":
            log_test("GET with Origin - Allow Origin", True, f"Header present: {allow_origin}")
        else:
            log_test("GET with Origin - Allow Origin", False, f"Expected {origin} or *, got {allow_origin}")
        
        return True
        
    except Exception as e:
        log_test("GET with Origin - Request", False, f"Exception: {str(e)}")
        return False


def test_functional_smoke():
    """Test 4: Functional smoke test (no regression)"""
    print("\n=== Test 4: Functional smoke test ===")
    
    # 4a. GET /api/health
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=10)
        if response.status_code == 200:
            data = response.json()
            if data.get("status") == "ok":
                log_test("Smoke Test - Health Endpoint", True, f"Status: {data.get('status')}")
            else:
                log_test("Smoke Test - Health Endpoint", False, f"Unexpected status: {data}")
        else:
            log_test("Smoke Test - Health Endpoint", False, f"Status code: {response.status_code}")
    except Exception as e:
        log_test("Smoke Test - Health Endpoint", False, f"Exception: {str(e)}")
    
    # 4b. POST /api/admin/login
    token = None
    try:
        response = requests.post(
            f"{BASE_URL}/admin/login",
            json={"password": ADMIN_PASSWORD},
            timeout=10
        )
        if response.status_code == 200:
            data = response.json()
            token = data.get("token")
            if token:
                log_test("Smoke Test - Admin Login", True, f"Token received (length: {len(token)})")
            else:
                log_test("Smoke Test - Admin Login", False, "No token in response")
        else:
            log_test("Smoke Test - Admin Login", False, f"Status code: {response.status_code}")
    except Exception as e:
        log_test("Smoke Test - Admin Login", False, f"Exception: {str(e)}")
        return False
    
    if not token:
        print("    ⚠️  Cannot continue smoke tests without admin token")
        return False
    
    # 4c. GET /api/toppers
    try:
        response = requests.get(f"{BASE_URL}/toppers", timeout=10)
        if response.status_code == 200:
            data = response.json()
            if isinstance(data, list):
                log_test("Smoke Test - Get Toppers", True, f"Array with {len(data)} items")
            else:
                log_test("Smoke Test - Get Toppers", False, f"Expected array, got {type(data)}")
        else:
            log_test("Smoke Test - Get Toppers", False, f"Status code: {response.status_code}")
    except Exception as e:
        log_test("Smoke Test - Get Toppers", False, f"Exception: {str(e)}")
    
    # 4d. POST /api/admin/toppers (create)
    topper_id = None
    try:
        response = requests.post(
            f"{BASE_URL}/admin/toppers",
            json={
                "name": "CORS Test Student",
                "photo": "",
                "exam": "JEE Advanced",
                "rank": "AIR 1",
                "year": "2025"
            },
            headers={"Authorization": f"Bearer {token}"},
            timeout=10
        )
        if response.status_code == 200:
            data = response.json()
            topper_id = data.get("id")
            if topper_id:
                log_test("Smoke Test - Create Topper", True, f"Created with ID: {topper_id}")
            else:
                log_test("Smoke Test - Create Topper", False, "No ID in response")
        else:
            log_test("Smoke Test - Create Topper", False, f"Status code: {response.status_code}")
    except Exception as e:
        log_test("Smoke Test - Create Topper", False, f"Exception: {str(e)}")
    
    # 4e. DELETE /api/admin/toppers/{id} (cleanup)
    if topper_id:
        try:
            response = requests.delete(
                f"{BASE_URL}/admin/toppers/{topper_id}",
                headers={"Authorization": f"Bearer {token}"},
                timeout=10
            )
            if response.status_code == 200:
                log_test("Smoke Test - Delete Topper", True, "Cleanup successful")
            else:
                log_test("Smoke Test - Delete Topper", False, f"Status code: {response.status_code}")
        except Exception as e:
            log_test("Smoke Test - Delete Topper", False, f"Exception: {str(e)}")
    
    # 4f. POST /api/bookings
    try:
        response = requests.post(
            f"{BASE_URL}/bookings",
            json={
                "student_name": "Rajesh Kumar",
                "parent_name": "Suresh Kumar",
                "phone": "9876543210",
                "email": "rajesh@example.com",
                "student_class": "11th",
                "program": "JEE (Main + Advanced)",
                "preferred_date": "2025-12-15",
                "preferred_timing": "Morning (9 AM - 12 PM)",
                "source": "Website",
                "questions": "",
                "consent": True
            },
            timeout=10
        )
        if response.status_code == 200:
            data = response.json()
            if data.get("success"):
                log_test("Smoke Test - Create Booking", True, f"Booking ID: {data.get('id')}")
            else:
                log_test("Smoke Test - Create Booking", False, "Success flag not true")
        else:
            log_test("Smoke Test - Create Booking", False, f"Status code: {response.status_code}")
    except Exception as e:
        log_test("Smoke Test - Create Booking", False, f"Exception: {str(e)}")
    
    # 4g. POST /api/scholarship
    try:
        response = requests.post(
            f"{BASE_URL}/scholarship",
            json={
                "student_name": "Priya Patel",
                "parent_name": "Ramesh Patel",
                "phone": "9876543211",
                "email": "priya@example.com",
                "student_class": "10th",
                "program": "Scholarship Test",
                "consent": True
            },
            timeout=10
        )
        if response.status_code == 200:
            data = response.json()
            if data.get("success"):
                log_test("Smoke Test - Create Scholarship", True, f"Scholarship ID: {data.get('id')}")
            else:
                log_test("Smoke Test - Create Scholarship", False, "Success flag not true")
        else:
            log_test("Smoke Test - Create Scholarship", False, f"Status code: {response.status_code}")
    except Exception as e:
        log_test("Smoke Test - Create Scholarship", False, f"Exception: {str(e)}")
    
    return True


def test_credentials_with_origin():
    """Test 5: Request with credentials (auth header + Origin)"""
    print("\n=== Test 5: Request with credentials (auth header + Origin) ===")
    
    # First get admin token
    try:
        response = requests.post(
            f"{BASE_URL}/admin/login",
            json={"password": ADMIN_PASSWORD},
            timeout=10
        )
        if response.status_code != 200:
            log_test("Credentials Test - Get Token", False, f"Login failed: {response.status_code}")
            return False
        
        token = response.json().get("token")
        if not token:
            log_test("Credentials Test - Get Token", False, "No token in response")
            return False
        
        log_test("Credentials Test - Get Token", True, "Token obtained")
        
    except Exception as e:
        log_test("Credentials Test - Get Token", False, f"Exception: {str(e)}")
        return False
    
    # Now test GET /api/admin/bookings with Bearer token + Origin header
    origin = "https://my-app.vercel.app"
    headers = {
        "Authorization": f"Bearer {token}",
        "Origin": origin
    }
    
    try:
        response = requests.get(f"{BASE_URL}/admin/bookings", headers=headers, timeout=10)
        
        # Check status code
        if response.status_code != 200:
            log_test("Credentials Test - Status Code", False, f"Expected 200, got {response.status_code}")
            return False
        else:
            log_test("Credentials Test - Status Code", True, "200 OK")
        
        # Check CORS headers
        resp_headers = {k.lower(): v for k, v in response.headers.items()}
        
        # Check allow-origin
        allow_origin = resp_headers.get("access-control-allow-origin")
        if allow_origin == origin or allow_origin == "*":
            log_test("Credentials Test - Allow Origin", True, f"Header present: {allow_origin}")
        else:
            log_test("Credentials Test - Allow Origin", False, f"Expected {origin} or *, got {allow_origin}")
        
        # Check allow-credentials
        allow_creds = resp_headers.get("access-control-allow-credentials")
        if allow_creds == "true":
            log_test("Credentials Test - Allow Credentials", True, "true")
        else:
            log_test("Credentials Test - Allow Credentials", False, f"Expected true, got {allow_creds}")
        
        # Check JSON body
        try:
            data = response.json()
            if isinstance(data, list):
                log_test("Credentials Test - JSON Body", True, f"Array with {len(data)} bookings")
            else:
                log_test("Credentials Test - JSON Body", False, f"Expected array, got {type(data)}")
        except Exception as e:
            log_test("Credentials Test - JSON Body", False, f"Invalid JSON: {str(e)}")
        
        return True
        
    except Exception as e:
        log_test("Credentials Test - Request", False, f"Exception: {str(e)}")
        return False


def main():
    """Run all CORS verification tests"""
    print("=" * 70)
    print("CORS Configuration Verification Test Suite")
    print("Backend: https://enq-scholar-setup.preview.emergentagent.com/api")
    print("=" * 70)
    
    # Run all tests
    test_preflight_vercel()
    test_preflight_localhost()
    test_actual_get_with_origin()
    test_functional_smoke()
    test_credentials_with_origin()
    
    # Summary
    print("\n" + "=" * 70)
    print("TEST SUMMARY")
    print("=" * 70)
    
    passed = sum(1 for r in test_results if r["passed"])
    failed = sum(1 for r in test_results if not r["passed"])
    total = len(test_results)
    
    print(f"Total Tests: {total}")
    print(f"Passed: {passed} ✅")
    print(f"Failed: {failed} ❌")
    
    if failed > 0:
        print("\nFailed Tests:")
        for r in test_results:
            if not r["passed"]:
                print(f"  ❌ {r['test']}")
                if r["details"]:
                    print(f"     {r['details']}")
    
    print("=" * 70)
    
    return 0 if failed == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
