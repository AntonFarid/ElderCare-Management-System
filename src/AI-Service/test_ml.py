import urllib.request
import json
import sys
import os
from dotenv import load_dotenv

# Set console output encoding to UTF-8 to prevent charmap errors with emojis
if sys.platform.startswith('win'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except AttributeError:
        pass

load_dotenv()

BASE_URL = "http://localhost:8000"
API_KEY = os.getenv("API_KEY", "eldercare-secret-key-2026")

def run_post_request(endpoint: str, data: dict, custom_headers: dict = None):
    url = f"{BASE_URL}{endpoint}"
    req_data = json.dumps(data).encode("utf-8")
    
    headers = {
        "Content-Type": "application/json",
        "X-API-Key": API_KEY
    }
    if custom_headers is not None:
        headers.update(custom_headers)
        
    req = urllib.request.Request(
        url, 
        data=req_data, 
        headers=headers,
        method="POST"
    )
    try:
        with urllib.request.urlopen(req) as response:
            status_code = response.getcode()
            response_body = response.read().decode("utf-8")
            return status_code, json.loads(response_body)
    except urllib.error.HTTPError as e:
        status_code = e.code
        response_body = e.read().decode("utf-8")
        try:
            return status_code, json.loads(response_body)
        except json.JSONDecodeError:
            return status_code, response_body
    except urllib.error.URLError as e:
        print(f"\n[ERROR] Connection failed: {e.reason}")
        print("Please make sure the FastAPI server is running (run start_server.bat first).")
        sys.exit(1)

def run_get_request(endpoint: str, custom_headers: dict = None):
    url = f"{BASE_URL}{endpoint}"
    headers = {"X-API-Key": API_KEY}
    if custom_headers is not None:
        headers.update(custom_headers)
        
    req = urllib.request.Request(url, headers=headers, method="GET")
    try:
        with urllib.request.urlopen(req) as response:
            status_code = response.getcode()
            response_body = response.read().decode("utf-8")
            return status_code, json.loads(response_body)
    except urllib.error.HTTPError as e:
        status_code = e.code
        response_body = e.read().decode("utf-8")
        try:
            return status_code, json.loads(response_body)
        except json.JSONDecodeError:
            return status_code, response_body
    except urllib.error.URLError as e:
        print(f"\n[ERROR] Connection failed: {e.reason}")
        print("Please make sure the FastAPI server is running (run start_server.bat first).")
        sys.exit(1)

def test_root_endpoint():
    print("Testing Root GET / ...", end=" ")
    status, body = run_get_request("/")
    assert status == 200, f"Expected status 200, got {status}"
    assert "message" in body, "Expected 'message' in response"
    print("PASSED")

def test_health_endpoint():
    print("Testing Health GET /health ...", end=" ")
    status, body = run_get_request("/health")
    assert status == 200, f"Expected status 200, got {status}"
    assert body.get("status") == "healthy", f"Expected status to be healthy, got {body.get('status')}"
    print("PASSED")

def test_api_security_header():
    print("Testing API Security (Invalid API Key) ...", end=" ")
    low_risk_data = {
        "elderly_id": 101,
        "age": 70,
        "heart_rate": 72,
        "systolic_bp": 120,
        "diastolic_bp": 80,
        "blood_sugar": 95,
        "body_temperature": 98.6,
        "mobility_score": 8,
        "sleep_hours": 7.5,
        "missed_medications": 0,
        "meals_eaten_percent": 100,
        "mood_score": 9
    }
    # Send request with invalid API Key
    status, body = run_post_request(
        "/api/ml/predict-health-risk", 
        low_risk_data, 
        custom_headers={"X-API-Key": "wrong-key-code"}
    )
    assert status == 403, f"Expected 403 Forbidden with invalid key, got {status}"
    
    # Send request with missing API Key
    print("Testing API Security (Missing API Key) ...", end=" ")
    url = f"{BASE_URL}/api/ml/predict-health-risk"
    req_data = json.dumps(low_risk_data).encode("utf-8")
    req = urllib.request.Request(
        url, 
        data=req_data, 
        headers={"Content-Type": "application/json"}, # No X-API-Key
        method="POST"
    )
    try:
        with urllib.request.urlopen(req) as response:
            status = response.getcode()
            body = json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        status = e.code
        
    assert status == 403, f"Expected 403 Forbidden with missing key, got {status}"
    print("PASSED")

def test_predict_low_risk():
    print("Testing Predict Health Risk (Low Risk Patient) ...", end=" ")
    low_risk_data = {
        "elderly_id": 101,
        "age": 70,
        "heart_rate": 72,
        "systolic_bp": 120,
        "diastolic_bp": 80,
        "blood_sugar": 95,
        "body_temperature": 98.6,
        "mobility_score": 8,
        "sleep_hours": 7.5,
        "missed_medications": 0,
        "meals_eaten_percent": 100,
        "mood_score": 9
    }
    status, body = run_post_request("/api/ml/predict-health-risk", low_risk_data)
    assert status == 200, f"Expected status 200, got {status}"
    assert body.get("risk_level") == "Low", f"Expected 'Low' risk level, got {body.get('risk_level')}"
    assert body.get("confidence_score") >= 0.5, "Confidence score should be reasonable"
    assert "stable" in body.get("recommendation").lower(), "Recommendation should indicate stable vitals"
    print("PASSED")

def test_predict_high_risk():
    print("Testing Predict Health Risk (High Risk Patient) ...", end=" ")
    high_risk_data = {
        "elderly_id": 102,
        "age": 85,
        "heart_rate": 115,       # High HR
        "systolic_bp": 175,      # High BP
        "diastolic_bp": 105,     # High BP
        "blood_sugar": 220,      # High Blood Sugar
        "body_temperature": 101.5, # Fever
        "mobility_score": 2,     # Restricted mobility
        "sleep_hours": 3.0,      # Insufficient sleep
        "missed_medications": 3, # Missed multiple doses
        "meals_eaten_percent": 25, # Barely ate
        "mood_score": 2          # Poor mood
    }
    status, body = run_post_request("/api/ml/predict-health-risk", high_risk_data)
    assert status == 200, f"Expected status 200, got {status}"
    assert body.get("risk_level") == "High", f"Expected 'High' risk level, got {body.get('risk_level')}"
    assert body.get("confidence_score") >= 0.5, "Confidence score should be reasonable"
    assert "urgent" in body.get("recommendation").lower(), "Recommendation should indicate urgency"
    assert "risk probability:" in body.get("recommendation").lower(), "Should explain exact risk probability"
    print("PASSED")

def test_predict_borderline_risk():
    print("Testing Predict Health Risk (Borderline Patient) ...", end=" ")
    borderline_data = {
        "elderly_id": 105,
        "age": 75,
        "heart_rate": 100,        # Borderline HR (Normal is up to 100)
        "systolic_bp": 150,       # Borderline Systolic (Hypertension override is 160)
        "diastolic_bp": 90,        # Borderline Diastolic (Hypertension override is 100)
        "blood_sugar": 180,       # Borderline Glucose (Hyperglycemia override is 200)
        "body_temperature": 99.5,  # Borderline temp
        "mobility_score": 5,
        "sleep_hours": 6.0,
        "missed_medications": 1,
        "meals_eaten_percent": 80,
        "mood_score": 6
    }
    status, body = run_post_request("/api/ml/predict-health-risk", borderline_data)
    assert status == 200, f"Expected status 200, got {status}"
    assert "risk_level" in body, "Response must include risk_level"
    assert "confidence_score" in body, "Response must include confidence_score"
    assert "recommendation" in body, "Response must include recommendation report"
    print(f"PASSED (Model output risk level: {body.get('risk_level')} with confidence {body.get('confidence_score') * 100:.0f}%)")

def test_fall_detection_fall():
    print("Testing Fall Detection (Positive Case: Fall Detected) ...", end=" ")
    fall_data = {
        "camera_id": "CAM_01",
        "frame_data": "base64_encoded_dummy_frame_data_here",
        "x_min": 100.0,
        "y_min": 100.0,
        "x_max": 300.0,
        "y_max": 200.0  # Width = 200, Height = 100 => Ratio = 0.5 (<0.85)
    }
    status, body = run_post_request("/api/ml/detect-fall", fall_data)
    assert status == 200, f"Expected status 200, got {status}"
    assert body.get("fall_detected") is True, f"Expected fall_detected to be True, got {body.get('fall_detected')}"
    assert body.get("confidence_score") == 0.95, f"Expected confidence score 0.95, got {body.get('confidence_score')}"
    assert "FALL DETECTED" in body.get("alert_message"), "Alert message should indicate fall detected"
    print("PASSED")

def test_fall_detection_no_fall():
    print("Testing Fall Detection (Negative Case: No Fall) ...", end=" ")
    upright_data = {
        "camera_id": "CAM_01",
        "frame_data": "base64_encoded_dummy_frame_data_here",
        "x_min": 100.0,
        "y_min": 100.0,
        "x_max": 200.0,
        "y_max": 300.0  # Width = 100, Height = 200 => Ratio = 2.0 (>=0.85)
    }
    status, body = run_post_request("/api/ml/detect-fall", upright_data)
    assert status == 200, f"Expected status 200, got {status}"
    assert body.get("fall_detected") is False, f"Expected fall_detected to be False, got {body.get('fall_detected')}"
    assert body.get("confidence_score") == 0.0, f"Expected confidence score 0.0, got {body.get('confidence_score')}"
    assert "No fall detected" in body.get("alert_message"), "Alert message should indicate no fall"
    print("PASSED")

def test_invalid_input_validation():
    print("Testing Input Validation (Missing Required Fields) ...", end=" ")
    invalid_data = {
        "age": 70
    }
    status, body = run_post_request("/api/ml/predict-health-risk", invalid_data)
    assert status == 422, f"Expected status 422, got {status}"
    assert "detail" in body, "Expected pydantic validation detail"
    print("PASSED")

def test_diet_recommendation_underweight():
    print("Testing Diet Recommendation (Underweight BMI Adjustment) ...", end=" ")
    diet_input = {
        "elderly_id": 103,
        "age": 78,
        "medical_conditions": "hypertension",
        "allergies": "peanuts",
        "dietary_restrictions": "halal",
        "avg_meals_eaten_percent": 55.0,
        "recent_avg_blood_sugar": 100.0,
        "recent_avg_systolic_bp": 145.0,
        "weight": 45.0,
        "height": 165.0  # BMI = 45 / (1.65^2) = 16.5 (< 18.5)
    }
    status, body = run_post_request("/api/ml/recommend-diet", diet_input)
    assert status == 200, f"Expected status 200, got {status}"
    assert "Underweight Alert" in body.get("dietitian_notes"), "Dietitian notes should contain Underweight adjustment alert"
    assert "high-protein" in body.get("dietitian_notes").lower(), "Should mention high protein/dense guidelines"
    print("PASSED")

def test_diet_recommendation_overweight():
    print("Testing Diet Recommendation (Overweight BMI Adjustment) ...", end=" ")
    diet_input = {
        "elderly_id": 103,
        "age": 78,
        "medical_conditions": "hypertension",
        "allergies": "peanuts",
        "dietary_restrictions": "halal",
        "avg_meals_eaten_percent": 85.0,
        "recent_avg_blood_sugar": 100.0,
        "recent_avg_systolic_bp": 130.0,
        "weight": 85.0,
        "height": 165.0  # BMI = 85 / (1.65^2) = 31.2 (>= 25.0)
    }
    status, body = run_post_request("/api/ml/recommend-diet", diet_input)
    assert status == 200, f"Expected status 200, got {status}"
    assert "Overweight/Obesity Alert" in body.get("dietitian_notes"), "Dietitian notes should contain Overweight/Obesity adjustment alert"
    assert "portion control" in body.get("dietitian_notes").lower(), "Should mention portion control/low density guidelines"
    print("PASSED")

def test_prediction_auditing():
    print("Testing Prediction Auditing (CSV file generation) ...", end=" ")
    csv_file = "prediction_history.csv"
    if os.path.exists(csv_file):
        try:
            os.remove(csv_file)
        except OSError:
            pass
            
    # Trigger a prediction to generate history
    low_risk_data = {
        "elderly_id": 999,
        "age": 75,
        "heart_rate": 75,
        "systolic_bp": 120,
        "diastolic_bp": 80,
        "blood_sugar": 100,
        "body_temperature": 98.6,
        "mobility_score": 5,
        "sleep_hours": 7.0,
        "missed_medications": 0,
        "meals_eaten_percent": 100,
        "mood_score": 5
    }
    status, _ = run_post_request("/api/ml/predict-health-risk", low_risk_data)
    assert status == 200
    
    # Check if CSV file is created and contains correct data
    assert os.path.exists(csv_file), "prediction_history.csv was not created!"
    with open(csv_file, mode="r", encoding="utf-8") as f:
        lines = f.readlines()
        assert len(lines) >= 2, "CSV must contain headers and at least one log row"
        assert "999" in lines[1], "Resident ID 999 not found in CSV logs"
        
    print("PASSED")

if __name__ == "__main__":
    print("========================================")
    print("ElderCare AI Service Integration Tester")
    print("========================================")
    
    tests = [
        test_root_endpoint,
        test_health_endpoint,
        test_api_security_header,
        test_predict_low_risk,
        test_predict_high_risk,
        test_predict_borderline_risk,
        test_fall_detection_fall,
        test_fall_detection_no_fall,
        test_invalid_input_validation,
        test_diet_recommendation_underweight,
        test_diet_recommendation_overweight,
        test_prediction_auditing
    ]
    
    passed_count = 0
    for test in tests:
        try:
            test()
            passed_count += 1
        except AssertionError as e:
            print(f"FAILED: {e}")
        except Exception as e:
            print(f"FAILED (Unexpected Error): {e}")
            
    print("========================================")
    print(f"Result: {passed_count}/{len(tests)} tests passed.")
    print("========================================")
    if passed_count == len(tests):
        print("Success: All AI Service components are working correctly!")
        sys.exit(0)
    else:
        print("Failure: One or more components failed the validation tests.")
        sys.exit(1)
