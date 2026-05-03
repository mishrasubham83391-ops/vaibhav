"""
Backend API smoke tests for toppers endpoints.
Tests admin login, topper CRUD operations, and sorting.
"""
import requests
import sys

# Backend URL from environment
BASE_URL = "https://enq-scholar-setup.preview.emergentagent.com/api"
ADMIN_PASSWORD = "admin123"

# Test results tracking
test_results = []


def log_test(step, passed, message):
    """Log test result."""
    status = "✅ PASS" if passed else "❌ FAIL"
    result = f"{status} - Step {step}: {message}"
    print(result)
    test_results.append({"step": step, "passed": passed, "message": message})
    return passed


def test_toppers_api():
    """Run all topper API tests."""
    print("\n" + "=" * 70)
    print("TOPPERS API SMOKE TEST")
    print("=" * 70 + "\n")
    
    token = None
    created_id = None
    photo_id = None
    initial_count = 0
    
    # Step 1: Admin login
    print("\n[Step 1] Testing POST /api/admin/login")
    try:
        response = requests.post(
            f"{BASE_URL}/admin/login",
            json={"password": ADMIN_PASSWORD},
            timeout=10
        )
        if response.status_code == 200:
            data = response.json()
            if "token" in data:
                token = data["token"]
                log_test(1, True, f"Admin login successful, token received (length: {len(token)})")
            else:
                log_test(1, False, "Admin login returned 200 but no token field in response")
                return False
        else:
            log_test(1, False, f"Admin login failed with status {response.status_code}: {response.text}")
            return False
    except Exception as e:
        log_test(1, False, f"Admin login request failed: {str(e)}")
        return False
    
    # Step 2: Get initial toppers count (public endpoint)
    print("\n[Step 2] Testing GET /api/toppers (public, no auth)")
    try:
        response = requests.get(f"{BASE_URL}/toppers", timeout=10)
        if response.status_code == 200:
            toppers = response.json()
            if isinstance(toppers, list):
                initial_count = len(toppers)
                log_test(2, True, f"Public toppers endpoint returned {initial_count} toppers")
            else:
                log_test(2, False, f"Expected array but got: {type(toppers)}")
                return False
        else:
            log_test(2, False, f"GET /api/toppers failed with status {response.status_code}: {response.text}")
            return False
    except Exception as e:
        log_test(2, False, f"GET /api/toppers request failed: {str(e)}")
        return False
    
    # Step 3: Create topper without photo
    print("\n[Step 3] Testing POST /api/admin/toppers (create topper)")
    try:
        response = requests.post(
            f"{BASE_URL}/admin/toppers",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "name": "Test Student",
                "exam": "JEE Advanced",
                "rank": "AIR 100",
                "year": "2025",
                "photo": ""
            },
            timeout=10
        )
        if response.status_code == 200:
            data = response.json()
            if "id" in data:
                created_id = data["id"]
                log_test(3, True, f"Topper created successfully with id: {created_id}")
            else:
                log_test(3, False, "Create topper returned 200 but no id field in response")
                return False
        else:
            log_test(3, False, f"Create topper failed with status {response.status_code}: {response.text}")
            return False
    except Exception as e:
        log_test(3, False, f"Create topper request failed: {str(e)}")
        return False
    
    # Step 4: Verify count increased and sorting (newest first)
    print("\n[Step 4] Testing GET /api/toppers (verify count N+1 and sorting)")
    try:
        response = requests.get(f"{BASE_URL}/toppers", timeout=10)
        if response.status_code == 200:
            toppers = response.json()
            new_count = len(toppers)
            
            # Check count
            if new_count != initial_count + 1:
                log_test(4, False, f"Expected {initial_count + 1} toppers but got {new_count}")
                return False
            
            # Check if newly created topper is first (sorted by created_at DESC)
            if len(toppers) > 0:
                first_topper = toppers[0]
                if first_topper.get("id") == created_id:
                    log_test(4, True, f"Count increased to {new_count} and newest topper appears FIRST (correct sorting)")
                else:
                    log_test(4, False, f"Count is correct ({new_count}) but newest topper is NOT first. First topper id: {first_topper.get('id')}, expected: {created_id}")
                    return False
            else:
                log_test(4, False, "Toppers array is empty after creation")
                return False
        else:
            log_test(4, False, f"GET /api/toppers failed with status {response.status_code}: {response.text}")
            return False
    except Exception as e:
        log_test(4, False, f"GET /api/toppers request failed: {str(e)}")
        return False
    
    # Step 5: Create topper with photo (base64 data URL)
    print("\n[Step 5] Testing POST /api/admin/toppers (with photo)")
    try:
        photo_data = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD3+iiigD//2Q=="
        response = requests.post(
            f"{BASE_URL}/admin/toppers",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "name": "Test With Photo",
                "exam": "NEET",
                "rank": "99.1%",
                "year": "2025",
                "photo": photo_data
            },
            timeout=10
        )
        if response.status_code == 200:
            data = response.json()
            if "id" in data:
                photo_id = data["id"]
                log_test(5, True, f"Topper with photo created successfully with id: {photo_id}")
            else:
                log_test(5, False, "Create topper with photo returned 200 but no id field")
                return False
        else:
            log_test(5, False, f"Create topper with photo failed with status {response.status_code}: {response.text}")
            return False
    except Exception as e:
        log_test(5, False, f"Create topper with photo request failed: {str(e)}")
        return False
    
    # Step 6: Delete first topper (without photo)
    print(f"\n[Step 6] Testing DELETE /api/admin/toppers/{created_id}")
    try:
        response = requests.delete(
            f"{BASE_URL}/admin/toppers/{created_id}",
            headers={"Authorization": f"Bearer {token}"},
            timeout=10
        )
        if response.status_code == 200:
            log_test(6, True, f"Topper {created_id} deleted successfully")
        else:
            log_test(6, False, f"Delete topper failed with status {response.status_code}: {response.text}")
            return False
    except Exception as e:
        log_test(6, False, f"Delete topper request failed: {str(e)}")
        return False
    
    # Step 7: Verify count is N+1 (photo topper still there)
    print("\n[Step 7] Testing GET /api/toppers (verify count is N+1)")
    try:
        response = requests.get(f"{BASE_URL}/toppers", timeout=10)
        if response.status_code == 200:
            toppers = response.json()
            current_count = len(toppers)
            expected_count = initial_count + 1  # One deleted, one with photo remains
            
            if current_count == expected_count:
                log_test(7, True, f"Count is {current_count} (N+1) as expected after deleting first topper")
            else:
                log_test(7, False, f"Expected count {expected_count} but got {current_count}")
                return False
        else:
            log_test(7, False, f"GET /api/toppers failed with status {response.status_code}: {response.text}")
            return False
    except Exception as e:
        log_test(7, False, f"GET /api/toppers request failed: {str(e)}")
        return False
    
    # Step 8: Cleanup - delete photo topper
    print(f"\n[Step 8] Testing DELETE /api/admin/toppers/{photo_id} (cleanup)")
    try:
        response = requests.delete(
            f"{BASE_URL}/admin/toppers/{photo_id}",
            headers={"Authorization": f"Bearer {token}"},
            timeout=10
        )
        if response.status_code == 200:
            log_test(8, True, f"Photo topper {photo_id} deleted successfully (cleanup)")
        else:
            log_test(8, False, f"Delete photo topper failed with status {response.status_code}: {response.text}")
            return False
    except Exception as e:
        log_test(8, False, f"Delete photo topper request failed: {str(e)}")
        return False
    
    # Step 9: Verify count restored to N
    print("\n[Step 9] Testing GET /api/toppers (verify count restored to N)")
    try:
        response = requests.get(f"{BASE_URL}/toppers", timeout=10)
        if response.status_code == 200:
            toppers = response.json()
            final_count = len(toppers)
            
            if final_count == initial_count:
                log_test(9, True, f"Count restored to original {initial_count} after cleanup")
            else:
                log_test(9, False, f"Expected count {initial_count} but got {final_count}")
                return False
        else:
            log_test(9, False, f"GET /api/toppers failed with status {response.status_code}: {response.text}")
            return False
    except Exception as e:
        log_test(9, False, f"GET /api/toppers request failed: {str(e)}")
        return False
    
    # Bonus: Verify public endpoint works without auth
    print("\n[Bonus] Verifying GET /api/toppers is public (no auth required)")
    try:
        response = requests.get(f"{BASE_URL}/toppers", timeout=10)
        if response.status_code == 200:
            log_test("Bonus", True, "Public endpoint /api/toppers works without authentication")
        else:
            log_test("Bonus", False, f"Public endpoint failed with status {response.status_code}")
    except Exception as e:
        log_test("Bonus", False, f"Public endpoint request failed: {str(e)}")
    
    return True


def print_summary():
    """Print test summary."""
    print("\n" + "=" * 70)
    print("TEST SUMMARY")
    print("=" * 70)
    
    passed = sum(1 for r in test_results if r["passed"])
    total = len(test_results)
    
    print(f"\nTotal Tests: {total}")
    print(f"Passed: {passed}")
    print(f"Failed: {total - passed}")
    
    if total - passed > 0:
        print("\n❌ FAILED TESTS:")
        for r in test_results:
            if not r["passed"]:
                print(f"  - Step {r['step']}: {r['message']}")
    
    print("\n" + "=" * 70)
    
    if passed == total:
        print("✅ ALL TESTS PASSED!")
        return 0
    else:
        print("❌ SOME TESTS FAILED")
        return 1


if __name__ == "__main__":
    try:
        test_toppers_api()
        exit_code = print_summary()
        sys.exit(exit_code)
    except KeyboardInterrupt:
        print("\n\nTests interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n❌ FATAL ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
