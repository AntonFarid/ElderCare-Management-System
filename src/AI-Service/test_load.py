import time
import urllib.request
import json
import sys
import os
import threading
from dotenv import load_dotenv
from concurrent.futures import ThreadPoolExecutor

# Set console output encoding to UTF-8
if sys.platform.startswith('win'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except AttributeError:
        pass

load_dotenv()

BASE_URL = "http://localhost:8000"
API_KEY = os.getenv("API_KEY", "eldercare-secret-key-2026")

# Metrics list to store latencies of successful requests
latencies = []
status_codes = {}
lock = threading.Lock()

def make_request(request_id):
    payload = {
        "elderly_id": 100 + (request_id % 10),
        "age": 75,
        "heart_rate": 72 + (request_id % 5),
        "systolic_bp": 120,
        "diastolic_bp": 80,
        "blood_sugar": 100,
        "body_temperature": 98.6,
        "mobility_score": 7,
        "sleep_hours": 7.0,
        "missed_medications": 0,
        "meals_eaten_percent": 100,
        "mood_score": 7
    }
    
    url = f"{BASE_URL}/api/ml/predict-health-risk"
    req_data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=req_data,
        headers={
            "Content-Type": "application/json",
            "X-API-Key": API_KEY
        },
        method="POST"
    )
    
    start_time = time.perf_counter()
    try:
        with urllib.request.urlopen(req) as response:
            status = response.getcode()
    except urllib.error.HTTPError as e:
        status = e.code
    except Exception as e:
        status = 999  # connection error
        
    latency = (time.perf_counter() - start_time) * 1000.0  # in ms
    
    with lock:
        latencies.append(latency)
        status_codes[status] = status_codes.get(status, 0) + 1

def run_stress_test(target_req_per_sec=50, duration_seconds=5):
    print("====================================================")
    print(f"Starting AI Service Stress Test: {target_req_per_sec} req/sec for {duration_seconds}s")
    print(f"Targeting: {BASE_URL}/api/ml/predict-health-risk")
    print("====================================================")
    
    total_expected = target_req_per_sec * duration_seconds
    start_time = time.perf_counter()
    
    # We will submit tasks dynamically to maintain target throughput
    with ThreadPoolExecutor(max_workers=30) as executor:
        for sec in range(duration_seconds):
            sec_start = time.perf_counter()
            # Spawn target_req_per_sec requests in this second
            futures = [executor.submit(make_request, (sec * target_req_per_sec) + i) for i in range(target_req_per_sec)]
            
            # Wait for the remainder of the second to keep the rate steady
            elapsed = time.perf_counter() - sec_start
            if elapsed < 1.0:
                time.sleep(1.0 - elapsed)
            print(f"  [Progress] Second {sec + 1}/{duration_seconds} completed...")
            
    total_duration = time.perf_counter() - start_time
    total_requests = len(latencies)
    
    # Calculation of stats
    avg_latency = sum(latencies) / total_requests if total_requests > 0 else 0
    min_latency = min(latencies) if total_requests > 0 else 0
    max_latency = max(latencies) if total_requests > 0 else 0
    throughput = total_requests / total_duration
    
    print("\n================== TEST RESULTS ==================")
    print(f"Total Requests Executed : {total_requests}")
    print(f"Total Duration          : {total_duration:.2f} seconds")
    print(f"Throughput              : {throughput:.2f} requests/sec")
    print("\n--- Response Status Codes ---")
    for code, count in sorted(status_codes.items()):
        status_text = "OK" if code == 200 else ("Forbidden" if code == 403 else "Error")
        print(f"  Status {code} ({status_text}): {count} requests ({count/total_requests*100:.1f}%)")
        
    print("\n--- Latency Performance (ms) ---")
    print(f"  Average Latency       : {avg_latency:.2f} ms")
    print(f"  Minimum Latency       : {min_latency:.2f} ms")
    print(f"  Maximum Latency       : {max_latency:.2f} ms")
    print("====================================================")

if __name__ == "__main__":
    run_stress_test(target_req_per_sec=50, duration_seconds=5)
