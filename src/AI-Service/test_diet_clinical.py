import sys
import os
import json

# Reconfigure stdout to support UTF-8 emojis
sys.stdout.reconfigure(encoding='utf-8')

# Add current directory to path so we can import main
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from main import app, API_KEY

client = TestClient(app)

def run_tests():
    print("=== RUNNING CLINICAL DIET RECOMMENDATION TESTS ===")
    
    headers = {"X-API-Key": API_KEY}
    
    # Test case 1: Senior (72 y/o), low appetite (40.0%), high BMI (31.2), Heart Disease, Low Sodium restriction, Peanut allergy
    payload = {
        "elderly_id": 101,
        "age": 72,
        "gender": "Male",
        "medical_conditions": "Heart Disease, Obesity",
        "allergies": "Peanuts",
        "dietary_restrictions": "Low Sodium Diet",
        "avg_meals_eaten_percent": 40.0,
        "recent_avg_blood_sugar": 100.0,
        "recent_avg_systolic_bp": 120.0,
        "weight": 95.0, # BMI ~31.2 for 175cm
        "height": 175.0
    }
    
    print("\n--- Sending request for Test Case 1 (Senior, low appetite, high BMI, Heart Disease, Peanut Allergy, Low Sodium) ---")
    response = client.post("/api/ml/recommend-diet", json=payload, headers=headers)
    
    if response.status_code != 200:
        print(f"FAILED: Status code is {response.status_code}")
        print(response.json())
        sys.exit(1)
        
    res_data = response.json()
    meals = res_data["meals"]
    notes = res_data["dietitian_notes"]
    
    print("\n[RECOMMENDED MEALS]")
    for meal in meals:
        print(f"- {meal['type'].capitalize()}: {meal['recipe_name']} ({meal['calories']} kcal, {meal['protein_g']}g protein, {meal['carbs_g']}g carbs, {meal['fat_g']}g fat)")
        
    print("\n[DIETITIAN CLINICAL RATIONALE NOTES]")
    print(notes)
    print("\n-------------------------------------------")
    
    # Assertions / Validations
    print("\nRunning validations on notes content:")
    
    # 1. Check senior BMI range and low-appetite override message
    assert "Senior Standard" in notes, "Should use Senior Standard BMI labels."
    assert "temporarily deferred" in notes, "Should defer portion control/weight loss measures due to low appetite."
    
    # 2. Check cardiac targets
    assert "Cardiovascular Nutritional Targets:" in notes, "Should list cardiac nutritional targets."
    assert "**Sodium:** Restrict daily intake to < 1,500 mg." in notes, "Should specify sodium target."
    assert "**Saturated Fat:** Limit to < 5-6%" in notes, "Should specify saturated fat target."
    assert "**Dietary Cholesterol:** Limit to < 200 mg" in notes, "Should specify cholesterol target."
    assert "**Dietary Fiber:** Aim for 25-30g" in notes, "Should specify fiber target."
    
    # 3. Check allergy protection
    assert "Nut Allergen Alert:" in notes, "Should trigger Nut Allergen Alert."
    
    # 4. Check deficit warning and snack recommendations
    total_cal = sum(m["calories"] for m in meals)
    total_protein = sum(m["protein_g"] for m in meals)
    
    if total_cal < 1400 or total_protein < 65:
        assert "NUTRITIONAL DEFICIT WARNING & PROTOCOLS:" in notes, "Should trigger nutritional deficit warning."
        assert "Greek yogurt" in notes or "cottage cheese" in notes or "avocado" in notes, "Should list allergy-safe snacks."
        assert "peanut butter" not in notes.lower(), "Should NOT recommend peanut butter as a snack if allergic."
        print("✓ Nutritional deficit warning and allergy-safe snack verification passed!")
        
    print("✓ All assertions passed successfully!")
    print("\n=== TESTS COMPLETED SUCCESSFULLY ===")

if __name__ == "__main__":
    run_tests()
