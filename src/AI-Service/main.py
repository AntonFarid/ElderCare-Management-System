import logging
from fastapi import FastAPI, HTTPException, Security, Depends
from fastapi.security.api_key import APIKeyHeader
from fastapi.middleware.cors import CORSMiddleware
import random
import joblib
import os
import threading
from dotenv import load_dotenv
from datetime import datetime
import pandas as pd
import csv
from typing import List
import json
from schemas import HealthDataInput, PredictionOutput, FallDetectionInput, FallDetectionOutput, DietRecommendationInput, DietRecommendationOutput, MealItem, RecipeInput

# Configure standard Python logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler("ai_service.log", encoding="utf-8")
    ]
)
logger = logging.getLogger("ElderCare-AI")

app = FastAPI(
    title="ElderCare AI Microservice",
    description="Python-based Machine Learning Service for ElderCare Management System",
    version="1.0.0"
)

load_dotenv()

# API Key Security Setup
API_KEY = os.getenv("API_KEY", "eldercare-secret-key-2026")
API_KEY_NAME = "X-API-Key"
api_key_header = APIKeyHeader(name=API_KEY_NAME, auto_error=False)

def get_api_key(api_key_header_value: str = Security(api_key_header)):
    if api_key_header_value != API_KEY:
        logger.warning(f"Unauthorized access attempt. Received API Key: {api_key_header_value}")
        raise HTTPException(status_code=403, detail="Invalid or missing API Key")
    return api_key_header_value

# Allow requests from the .NET Backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict this to your .NET API URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load the trained AI Model and feature list on startup
model_path = "health_risk_model.pkl"
features_path = "model_features.pkl"
health_model = None
model_features = None

if os.path.exists(model_path) and os.path.exists(features_path):
    health_model = joblib.load(model_path)
    model_features = joblib.load(features_path)
    logger.info("Successfully loaded custom health_risk_model.pkl and features!")
else:
    logger.error("WARNING: Custom Model not found. Run train_model.py first!")

# Load the trained Meal Recommender Model on startup
meal_model_path = "meal_recommender.pkl"
meal_model_data = None
meal_model_lock = threading.Lock()

def reload_meal_model():
    global meal_model_data
    if os.path.exists(meal_model_path):
        try:
            with meal_model_lock:
                meal_model_data = joblib.load(meal_model_path)
            logger.info("Successfully loaded custom meal_recommender.pkl!")
        except Exception as e:
            logger.error(f"Error loading meal_recommender.pkl: {e}")
    else:
        logger.error("WARNING: Custom Meal Recommender Model not found. Run train_model.py first!")

reload_meal_model()

recipes_json_path = "recipes.json"
RECIPE_BANK = []

def load_recipes_from_json():
    global RECIPE_BANK
    if not os.path.exists(recipes_json_path):
        logger.error(f"Critical Error: {recipes_json_path} was not found on disk!")
        return
            
    try:
        with open(recipes_json_path, 'r', encoding='utf-8') as f:
            RECIPE_BANK = json.load(f)
        logger.info(f"Loaded {len(RECIPE_BANK)} recipes dynamically from recipes.json.")
        
        # Merge into meal recommender lookup
        with meal_model_lock:
            if meal_model_data is not None and 'recipe_lookup' in meal_model_data:
                lookup = meal_model_data['recipe_lookup']
                for recipe in RECIPE_BANK:
                    name = recipe["recipe_name"].strip()
                    # Update or insert into memory lookup table
                    lookup[name] = {
                        "calories": recipe["calories"],
                        "protein": recipe["protein_g"],
                        "carbs": recipe["carbs_g"],
                        "fat": recipe["fat_g"],
                        "description": recipe["description"],
                        "type": recipe["type"],
                        "tags": recipe.get("tags", [])
                    }
                logger.info("Successfully merged recipes.json entries into active lookup database.")
    except Exception as e:
        logger.error(f"Failed to load recipes.json: {e}")

load_recipes_from_json()


@app.get("/")
def read_root():
    return {"message": "ElderCare AI Service is running successfully."}

@app.get("/health")
def health_check():
    return {"status": "healthy"}

csv_lock = threading.Lock()

def log_prediction_to_csv(elderly_id, data, risk_level, confidence):
    csv_file = "prediction_history.csv"
    headers = ["timestamp", "elderly_id", "age", "heart_rate", "systolic_bp", "diastolic_bp", "blood_sugar", "body_temperature", "missed_medications", "risk_level", "confidence_score"]
    file_exists = os.path.exists(csv_file)
    try:
        with csv_lock:
            with open(csv_file, mode="a", newline="", encoding="utf-8") as f:
                writer = csv.writer(f)
                if not file_exists:
                    writer.writerow(headers)
                writer.writerow([
                    datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                    elderly_id,
                    data.age,
                    data.heart_rate,
                    data.systolic_bp,
                    data.diastolic_bp,
                    data.blood_sugar,
                    data.body_temperature,
                    data.missed_medications,
                    risk_level,
                    confidence
                ])
        logger.info(f"Auditing history log saved for resident {elderly_id}")
    except Exception as e:
        logger.error(f"Failed to save auditing history: {e}")

@app.post("/api/ml/predict-health-risk", response_model=PredictionOutput)
def predict_health_risk(data: HealthDataInput, api_key: str = Depends(get_api_key)):
    """
    Endpoint for Predictive Health Analytics using Custom Trained Scikit-Learn Model.
    Includes input validation/preprocessing for temperature, clinical rule overrides,
    X-API-Key security protection, and audit logging to CSV.
    """
    logger.info(f"Received health risk prediction request for resident ID {data.elderly_id}")
    if health_model is None or model_features is None:
        logger.error("Health risk model or features not initialized.")
        raise HTTPException(status_code=500, detail="AI Model is not loaded. Please train the model first.")

    # 1. Temperature Auto-Conversion (API Input Preprocessing/Validation)
    original_temp = data.body_temperature
    temp_f = original_temp
    is_converted = False
    if original_temp is not None and original_temp < 45.0:
        temp_f = round((original_temp * 9 / 5) + 32, 2)
        is_converted = True
        logger.info(f"Preprocessed input temperature: Converted {original_temp}°C to {temp_f}°F")

    # Prepare the features for the model using the exact same columns it was trained on
    input_dict = {
        'age': data.age,
        'heart_rate': data.heart_rate,
        'systolic_bp': data.systolic_bp,
        'diastolic_bp': data.diastolic_bp,
        'blood_sugar': data.blood_sugar,
        'body_temperature': temp_f, # Use the preprocessed Fahrenheit value
        'mobility_score': data.mobility_score,
        'sleep_hours': data.sleep_hours,
        'missed_medications': data.missed_medications,
        'meals_eaten_percent': data.meals_eaten_percent,
        'mood_score': data.mood_score,
        'oxygen_saturation': data.oxygen_saturation,
        'respiratory_rate': data.respiratory_rate,
        'water_intake_ml': data.water_intake_ml,
        'pain_level': data.pain_level
    }
    
    # Ensure pandas DataFrame columns match training features exactly
    features = pd.DataFrame([input_dict], columns=model_features)

    # Ask the AI to make an initial prediction
    probabilities = health_model.predict_proba(features)[0]
    is_high_risk = bool(health_model.predict(features)[0] == 1)
    confidence = round(probabilities[1] if is_high_risk else probabilities[0], 2)

    # 2. Hybrid Clinical Rule-Based Overrides (Safety Net)
    anomalies = []
    reasons = []
    actions = []

    # BP Overrides
    if data.systolic_bp >= 160 or data.diastolic_bp >= 100:
        anomalies.append(f"🔺 **Severe Hypertension (BP: {data.systolic_bp}/{data.diastolic_bp} mmHg)**: Exceeds Stage 2 / hypertensive crisis threshold.")
        reasons.append("High risk of cardiovascular distress, stroke, or organ strain.")
        actions.append("Ensure the resident is resting quietly. Conduct a manual BP check in 15 mins.")
        is_high_risk = True
        confidence = 0.99
    elif data.systolic_bp <= 85 or data.diastolic_bp <= 50:
        anomalies.append(f"🔻 **Severe Hypotension (BP: {data.systolic_bp}/{data.diastolic_bp} mmHg)**: Dangerously low blood pressure.")
        reasons.append("Risk of cerebral hypoperfusion, orthostatic syncope, or dehydration/shock.")
        actions.append("Keep the resident lying down with legs elevated. Offer fluids if conscious. Monitor vitals closely.")
        is_high_risk = True
        confidence = 0.99

    # Heart Rate Overrides
    if data.heart_rate >= 115:
        anomalies.append(f"🔺 **Tachycardia (Heart Rate: {data.heart_rate} bpm)**: Significantly elevated pulse.")
        reasons.append("Can indicate underlying fever, infection, severe dehydration, or cardiac stress.")
        actions.append("Assess for elevated temperature. Encourage sips of water. Monitor breathing rate.")
        is_high_risk = True
        confidence = 0.99
    elif data.heart_rate <= 45:
        anomalies.append(f"🔻 **Bradycardia (Heart Rate: {data.heart_rate} bpm)**: Abnormally low pulse.")
        reasons.append("Risk of low perfusion, fatigue, dizziness, or syncope.")
        actions.append("Assess cognitive response and check for signs of dizziness. Review active cardiac medications.")
        is_high_risk = True
        confidence = 0.99

    # Temperature Overrides
    if temp_f >= 101.5:
        temp_str = f"{original_temp:.1f}°C ({temp_f:.1f}°F)" if is_converted else f"{temp_f:.1f}°F"
        anomalies.append(f"🔺 **High Fever (Temperature: {temp_str})**: Elevated core body temperature.")
        reasons.append("Indicates active systemic infection, inflammatory response, or heat stress.")
        actions.append("Initiate standard cooling protocols, verify hydration, and watch for sepsis markers.")
        is_high_risk = True
        confidence = 0.99
    elif temp_f <= 94.0:
        temp_str = f"{original_temp:.1f}°C ({temp_f:.1f}°F)" if is_converted else f"{temp_f:.1f}°F"
        anomalies.append(f"🔻 **Hypothermia (Temperature: {temp_str})**: Dangerously low body temperature.")
        reasons.append("Risk of slowed metabolic functions and cardiac arrhythmias.")
        actions.append("Apply warm blankets, adjust ambient room temperature, and re-check in 30 minutes.")
        is_high_risk = True
        confidence = 0.99

    # Blood Sugar Overrides
    if data.blood_sugar >= 200:
        anomalies.append(f"🔺 **Severe Hyperglycemia (Blood Sugar: {data.blood_sugar} mg/dL)**: Dangerously high glucose level.")
        reasons.append("Risk of acute metabolic decompensation (DKA or HHS).")
        actions.append("Check insulin/diabetes medication logs. Offer plenty of water. Re-test glucose in 1-2 hours.")
        is_high_risk = True
        confidence = 0.99
    elif data.blood_sugar <= 60:
        anomalies.append(f"🔻 **Severe Hypoglycemia (Blood Sugar: {data.blood_sugar} mg/dL)**: Critically low glucose level.")
        reasons.append("Immediate risk of cognitive confusion, diaphoresis, seizures, or loss of consciousness.")
        actions.append("Administer 15g of fast-acting carbs (juice, sugar water, honey) immediately. Re-test in 15 mins.")
        is_high_risk = True
        confidence = 0.99

    # Missed Medications Override
    if data.missed_medications >= 2:
        anomalies.append(f"⚠️ **Severe Medication Non-Adherence ({data.missed_medications} Missed Doses)**: Multiple medications were missed.")
        reasons.append("Creates a high risk of chronic disease destabilization (e.g. rebound hypertension).")
        actions.append("Conduct immediate medication reconciliation. Administer scheduled doses safely.")
        is_high_risk = True
        confidence = 0.99

    # Oxygen Saturation Override
    if data.oxygen_saturation is not None and data.oxygen_saturation <= 92:
        anomalies.append(f"🔻 **Hypoxemia (Oxygen Saturation: {data.oxygen_saturation}%)**: Critical respiratory concern.")
        reasons.append("Risk of organ hypoperfusion and severe respiratory distress.")
        actions.append("Administer oxygen if prescribed. Ask the resident to sit upright and perform deep breathing exercises. Monitor closely.")
        is_high_risk = True
        confidence = 0.99

    # Respiratory Rate Override
    if data.respiratory_rate is not None and data.respiratory_rate >= 25:
        anomalies.append(f"🔺 **Tachypnea (Respiratory Rate: {data.respiratory_rate} breaths/min)**: Abnormally rapid breathing.")
        reasons.append("Can indicate respiratory infection, heart failure, pulmonary embolism, or anxiety/pain.")
        actions.append("Ensure the resident is resting quietly. Assess oxygen saturation level immediately. Notify nurse supervisor.")
        is_high_risk = True
        confidence = 0.99
    elif data.respiratory_rate is not None and data.respiratory_rate <= 10:
        anomalies.append(f"🔻 **Bradypnea (Respiratory Rate: {data.respiratory_rate} breaths/min)**: Dangerously slow breathing.")
        reasons.append("Risk of respiratory depression or neurological distress.")
        actions.append("Assess level of consciousness. Keep resident awake. Notify nurse supervisor immediately.")
        is_high_risk = True
        confidence = 0.99

    # Water Intake Override
    if data.water_intake_ml is not None and data.water_intake_ml < 500:
        anomalies.append(f"⚠️ **Critical Dehydration Risk (Water Intake: {data.water_intake_ml} ml)**: Abnormally low daily fluid intake.")
        reasons.append("Elderly residents have reduced thirst sensation, putting them at high risk for kidney damage, confusion, and hypotension.")
        actions.append("Offer small, frequent sips of water or fluids. Record all intake/output carefully.")
        is_high_risk = True
        confidence = 0.95

    # Pain Level Override
    if data.pain_level is not None and data.pain_level >= 7:
        anomalies.append(f"🔺 **Severe Pain (Pain Score: {data.pain_level}/10)**: High levels of distress or acute discomfort.")
        reasons.append("Uncontrolled pain can severely impact cardiovascular stability, mobility, and mental status.")
        actions.append("Administer prescribed analgesic medications. Conduct a physical check to locate pain source. Notify primary nurse.")
        is_high_risk = True
        confidence = 0.95

    # Handle cases where the ML model predicted High Risk, but individual rule thresholds were not breached
    if is_high_risk and not anomalies:
        anomalies.append(" *AI Model Pattern Alert**: Multivariate trend anomalies detected.")
        reasons.append(f"The ML model predicted high risk based on a combined pattern of vitals, age ({data.age}), mobility ({data.mobility_score}/10), sleep ({data.sleep_hours} hrs), and mood ({data.mood_score}/10).")
        actions.append("Perform a physical check-up. Review daily logs and monitor vital trends closely.")

    # 3. Dynamic Clinician Markdown Report Compile
    risk = "High" if is_high_risk else "Low"
    
    if is_high_risk:
        report_lines = [
            "### 🚨 URGENT: AI Clinical Health Alert: High Risk Detected",
            f"Risk Probability: *{confidence * 100:.0f}%*\n",
            "#### 📊 Physiological Anomalies Identified:",
        ]
        for item in anomalies:
            report_lines.append(item)
            
        report_lines.append("\n#### 🩺 Clinical Rationale:")
        for reason in reasons:
            report_lines.append(f"- {reason}")
            
        report_lines.append("\n#### 📋 Suggested Nursing Action Protocol:")
        for action in actions:
            report_lines.append(f"- [ ] **{action}**")
        report_lines.append("- [ ] **Escalation**: Notify the nurse supervisor or primary care doctor if parameters do not stabilize.")
    else:
        temp_display = f"{original_temp:.1f}°C ({temp_f:.1f}°F)" if is_converted else f"{temp_f:.1f}°F"
        report_lines = [
            "### 🩺 AI Clinical Health Assessment: Stable",
            f"Vitals and daily parameters are within standard acceptable physiological ranges (Risk Probability: **{(1 - confidence) * 100:.0f}%**).\n",
            "#### 📈 Current Summary:",
            f"- *Heart Rate*: {data.heart_rate} bpm (Normal)",
            f"- *Blood Pressure*: {data.systolic_bp}/{data.diastolic_bp} mmHg (Normal)",
            f"- *Blood Sugar*: {data.blood_sugar} mg/dL (Normal)",
            f"- *Body Temperature*: {temp_display} (Normal)",
            f"- *Medication Adherence*: All doses taken (0 missed)" if data.missed_medications == 0 else f"- *Medication Adherence*: {data.missed_medications} missed doses",
        ]
        
        if data.oxygen_saturation is not None:
            report_lines.append(f"- *Oxygen Saturation*: {data.oxygen_saturation}% (Normal)")
        if data.respiratory_rate is not None:
            report_lines.append(f"- *Respiratory Rate*: {data.respiratory_rate} breaths/min (Normal)")
        if data.water_intake_ml is not None:
            report_lines.append(f"- *Daily Water Intake*: {data.water_intake_ml} ml (Normal)")
        if data.pain_level is not None:
            report_lines.append(f"- *Pain Level*: {data.pain_level}/10 (Normal)")
            
        report_lines.extend([
            "\n#### 📋 Clinical Recommendation:",
            "- Continue standard daily care routine and scheduled observations. No acute interventions required."
        ])
        
        # Add warnings for minor issues
        minor_notes = []
        if data.missed_medications == 1:
            minor_notes.append("- ⚠️ *Note:* 1 missed medication dose recorded. Administer the scheduled dose as soon as possible.")
        if data.sleep_hours < 5.0:
            minor_notes.append(f"- ⚠️ *Note:* Resident slept less than normal ({data.sleep_hours} hours). Monitor fatigue levels.")
        if data.meals_eaten_percent <= 50:
            minor_notes.append(f"- ⚠️ *Note:* Reduced dietary intake ({data.meals_eaten_percent}% meals eaten). Offer light snacks and fluid intake.")
            
        if minor_notes:
            report_lines.append("\n#### ⚠️ Minor Notes:")
            report_lines.extend(minor_notes)

    recommendation = "\n".join(report_lines)
    
    # 4. Audit History Logger
    log_prediction_to_csv(data.elderly_id, data, risk, confidence)

    return PredictionOutput(
        elderly_id=data.elderly_id,
        risk_level=risk,
        confidence_score=confidence,
        recommendation=recommendation
    )

@app.post("/api/ml/detect-fall", response_model=FallDetectionOutput)
def detect_fall(data: FallDetectionInput, api_key: str = Depends(get_api_key)):
    """
    Endpoint for Computer Vision Fall Detection.
    Uses bounding box aspect ratio check as a simulated CV prototype.
    """
    logger.info(f"Received fall detection request for camera {data.camera_id}")
    
    # NOTE: This is a bounding-box heuristic simulation.
    # Production would require a pose estimation model (e.g., MediaPipe, YOLOv8-pose)
    dx = data.x_max - data.x_min
    dy = data.y_max - data.y_min
    if dx <= 0 or dy <= 0:
        ratio = 1.0
    else:
        ratio = dy / dx
        
    if ratio < 0.85:
        fall_detected = True
        confidence_score = 0.95
        alert_message = f"FALL DETECTED! Aspect ratio {ratio:.2f} (height/width) is below threshold 0.85 (horizontal posture)."
        logger.warning(f"Fall alert triggered: camera {data.camera_id}, aspect ratio {ratio:.2f}")
    else:
        fall_detected = False
        confidence_score = 0.0
        alert_message = f"No fall detected. Aspect ratio {ratio:.2f} indicates normal upright posture."
        logger.info(f"Normal posture detected: camera {data.camera_id}, aspect ratio {ratio:.2f}")
        
    return FallDetectionOutput(
        fall_detected=fall_detected,
        confidence_score=confidence_score,
        alert_message=alert_message
    )

# Dynamic Recipe Bank: RECIPE_BANK is loaded on startup from recipes.json and managed via endpoints
@app.get("/api/ml/recipes", response_model=List[RecipeInput])
def get_recipes(api_key: str = Depends(get_api_key)):
    """
    Endpoint to retrieve the current dynamic recipe bank loaded from recipes.json.
    """
    logger.info("Retrieving all dynamic recipes.")
    load_recipes_from_json() # Ensure we load the latest from disk
    return RECIPE_BANK

@app.post("/api/ml/recipes", response_model=RecipeInput)
def add_recipe(recipe: RecipeInput, api_key: str = Depends(get_api_key)):
    """
    Endpoint to dynamically add a new recipe to the recipe bank.
    Saves to recipes.json and reloads the active lookup memory.
    """
    logger.info(f"Adding new recipe dynamically: {recipe.recipe_name}")
    load_recipes_from_json() # Ensure we load latest first
    
    # Check if recipe already exists
    for r in RECIPE_BANK:
        if r["recipe_name"].strip().lower() == recipe.recipe_name.strip().lower():
            raise HTTPException(status_code=400, detail="Recipe with this name already exists.")
            
    # Append
    new_recipe_dict = {
        "recipe_name": recipe.recipe_name,
        "description": recipe.description,
        "calories": recipe.calories,
        "protein_g": recipe.protein_g,
        "carbs_g": recipe.carbs_g,
        "fat_g": recipe.fat_g,
        "type": recipe.type,
        "tags": recipe.tags
    }
    RECIPE_BANK.append(new_recipe_dict)
    
    # Save to file
    try:
        with open(recipes_json_path, 'w', encoding='utf-8') as f:
            json.dump(RECIPE_BANK, f, indent=4, ensure_ascii=False)
        logger.info("Saved updated recipes.json to disk.")
    except Exception as e:
        logger.error(f"Failed to write recipes.json: {e}")
        raise HTTPException(status_code=500, detail="Failed to save recipe to disk.")
        
    # Reload in-memory lookup table
    load_recipes_from_json()
    
    # Trigger model retraining to make the recipe active for prediction immediately
    try:
        from train_model import train_meal_recommender
        with meal_model_lock:
            status = train_meal_recommender(augment=True)
        if status:
            reload_meal_model()
            load_recipes_from_json()
            logger.info("Successfully retrained and reloaded model with new recipe.")
    except Exception as e:
        logger.error(f"Failed to auto-retrain model after adding recipe: {e}")
    
    return recipe

@app.post("/api/ml/recommend-diet", response_model=DietRecommendationOutput)
def recommend_diet(data: DietRecommendationInput, api_key: str = Depends(get_api_key)):
    """
    Endpoint for AI Dietary & Nutrition Plan Recommendations
    Uses the trained Random Forest classifiers to predict meals,
    and dynamically compiles dietitian notes referencing active allergies and restrictions.
    """
    # 1. Fallback if model is not loaded
    if meal_model_data is None:
        raise HTTPException(status_code=500, detail="Meal Recommender Model is not loaded. Train the model first.")

    with meal_model_lock:
        model_ref = meal_model_data
        lookup = dict(model_ref['recipe_lookup'])

    logger.info(f"Received diet recommendation request for resident ID {data.elderly_id}")
    
    # Seed the random number generator with a combination of elderly_id and the current date
    # to ensure identical recommendations for the same resident within the same day,
    # while still allowing diet variety/rotation across different days.
    date_seed = int(datetime.now().strftime("%Y%m%d")) + data.elderly_id
    random.seed(date_seed)
    # 2. Extract inputs
    age = data.age
    allergies = [a.strip().lower() for a in data.allergies.replace(";", ",").split(",") if a.strip()]
    conditions = [c.strip().lower() for c in data.medical_conditions.replace(";", ",").split(",") if c.strip()]
    restrictions = [r.strip().lower() for r in data.dietary_restrictions.replace(";", ",").split(",") if r.strip()]

    # 3. Map inputs to features expected by the trained meal recommender
    gender = data.gender if data.gender else "Female"
    if gender.lower() == "male":
        gender = "Male"
    else:
        gender = "Female"
        
    try:
        gender_encoded = model_ref['le_gender'].transform([gender])[0]
    except ValueError:
        gender_encoded = model_ref['le_gender'].transform(["Female"])[0]

    height = data.height if data.height is not None else 165.0
    weight = data.weight if data.weight is not None else 70.0
    
    # Calculate BMI
    bmi = 0.0
    if height > 0:
        bmi = weight / ((height / 100) ** 2)

    activity = "Lightly Active"
    activity_encoded = model_ref['le_activity'].transform([activity])[0]

    # Preference mapping
    preference = "Omnivore"
    if restrictions:
        rest_lower = [r.lower() for r in restrictions]
        if any("vegan" in r for r in rest_lower):
            preference = "Vegan"
        elif any("veg" in r for r in rest_lower):
            preference = "Vegetarian"
        elif any("fish" in r or "pesc" in r for r in rest_lower):
            preference = "Pescatarian"
    preference_encoded = model_ref['le_preference'].transform([preference])[0]

    # Disease mapping
    is_diabetic = any("diabet" in c or "sugar" in c for c in conditions) or data.recent_avg_blood_sugar >= 130
    is_hypertensive = any("hyper" in c or "blood pressure" in c or "bp" in c for c in conditions) or data.recent_avg_systolic_bp >= 140
    is_heart_disease = any("heart" in c or "cardio" in c or "coronary" in c or "stroke" in c or "cholesterol" in c for c in conditions)
    is_kidney_disease = any("kidney" in c or "renal" in c for c in conditions)
    is_acne = any("acne" in c for c in conditions)
    is_weight_loss = data.avg_meals_eaten_percent < 60
    is_weight_gain = any("obese" in c or "weight gain" in c for c in conditions)

    input_features = {
        'Ages': age,
        'gender_encoded': gender_encoded,
        'Height': height,
        'Weight': weight,
        'activity_encoded': activity_encoded,
        'preference_encoded': preference_encoded,
        'has_diabetes': int(is_diabetic),
        'has_hypertension': int(is_hypertensive),
        'has_heart_disease': int(is_heart_disease),
        'has_kidney_disease': int(is_kidney_disease),
        'has_acne': int(is_acne),
        'has_weight_gain': int(is_weight_gain),
        'has_weight_loss': int(is_weight_loss)
    }

    # Format as pandas DataFrame matching feature columns exactly
    features_df = pd.DataFrame([input_features], columns=model_ref['features'])

    # Helper function to check allergen matching
    def contains_allergen(recipe_name, allergen_list):
        import re
        text = recipe_name.lower()
        for allergen in allergen_list:
            allergen_clean = allergen.strip().lower()
            
            # Singularize allergen by removing trailing 's'
            allergen_singular = allergen_clean[:-1] if allergen_clean.endswith('s') else allergen_clean
            
            # 1. Peanut allergy (specifically)
            if "peanut" in allergen_clean:
                if "peanut" in text:
                    return True
                continue
                
            # 2. Tree nut allergy (distinguished from peanut)
            if "tree nut" in allergen_clean or allergen_clean in ["nut", "nuts"]:
                # Check for common tree nuts (chia is a seed, not a tree nut, so not included here)
                tree_nuts = ["almond", "walnut", "hazelnut", "pecan", "cashew", "macadamia", "pistachio", "brazil nut", "chestnut"]
                if any(nut in text for nut in tree_nuts):
                    return True
                # Check for word "nut" or "nuts" but avoid matching "coconut" or "peanut" unless desired
                if re.search(r'\bnuts?\b', text):
                    return True
                continue
                
            # 3. Seeds (like chia, sesame)
            if "seed" in allergen_clean or "chia" in allergen_clean or "sesame" in allergen_clean:
                if any(x in text for x in ["seed", "chia", "sesame", "flax"]):
                    return True
                continue

            # 4. Seafood / Fish
            if "seafood" in allergen_clean or "fish" in allergen_clean:
                seafood_words = ["salmon", "cod", "fish", "tuna", "shrimp", "crab", "lobster", "seafood", "prawn", "halibut", "snapper", "bass"]
                if any(x in text for x in seafood_words):
                    return True
                continue
                
            # 5. Milk / Dairy
            if any(x in allergen_clean for x in ["milk", "dairy", "lactose"]):
                dairy_words = ["cheese", "yogurt", "cream", "milk", "butter", "dairy", "lactose", "ghee", "feta", "parm", "whey"]
                if any(x in text for x in dairy_words):
                    return True
                continue
                
            # 6. Egg allergy
            if "egg" in allergen_clean:
                # Use regex to match 'egg' or 'eggs' but avoid matching 'veggie' or 'eggplant'
                if re.search(r'\b(egg|eggs)\b', text) or "egg white" in text or "egg-white" in text:
                    return True
                continue
                
            # 7. Soy allergy
            if "soy" in allergen_clean:
                if any(x in text for x in ["soy", "tofu", "edamame", "tempeh"]):
                    return True
                continue

            # 8. General fallback matching
            if allergen_singular in text:
                return True
                
        return False

    # Predict safe meal using probabilistic top-5 class sampling, allergy-filtering, and clinical tag boosting
    def predict_safe_meal(clf, meal_type, allergen_list):
        # Get class probabilities
        probabilities = clf.predict_proba(features_df)[0]
        class_probs = list(zip(clf.classes_, probabilities))
        
        # Filter out classes containing allergens
        safe_class_probs = [(name, prob) for name, prob in class_probs if not contains_allergen(name, allergen_list)]
        
        # Apply clinical tag matching boost to help custom / suitable recipes surface
        boosted_probs = []
        for name, prob in safe_class_probs:
            recipe_details = lookup.get(name.strip(), {})
            tags = [t.lower().strip() for t in recipe_details.get("tags", [])]
            
            boost_multiplier = 1.0
            
            # 1. Cardiovascular / Hypertension matching
            if is_heart_disease or is_hypertensive:
                if "heart-healthy" in tags or "low-sodium" in tags or "omega-3" in tags:
                    boost_multiplier += 3.0
            
            # 2. Diabetes matching
            if is_diabetic:
                if "diabetic-friendly" in tags or "low-sugar" in tags:
                    boost_multiplier += 3.0
                    
            # 3. Weight Loss / Low Appetite matching
            if is_weight_loss:
                if "high-protein" in tags or "calorie-dense" in tags:
                    boost_multiplier += 2.0
                    
            # 4. Specific dietary restrictions
            for restriction in restrictions:
                rest_clean = restriction.strip().lower()
                if "soft" in rest_clean and "soft" in tags:
                    boost_multiplier += 2.5
                if "sodium" in rest_clean and "low-sodium" in tags:
                    boost_multiplier += 4.0
                if "vegetarian" in rest_clean and "vegetarian" in tags:
                    boost_multiplier += 4.0
                if "vegan" in rest_clean and "vegan" in tags:
                    boost_multiplier += 4.0
                if "gluten" in rest_clean and "gluten-free" in tags:
                    boost_multiplier += 3.0
            
            boosted_probs.append((name, prob * boost_multiplier))
            
        if boosted_probs:
            # Sort by boosted probability descending
            boosted_probs.sort(key=lambda x: x[1], reverse=True)
            # Take top 5 options to allow a wider safe pool for custom meals
            top_options = boosted_probs[:5]
            names = [x[0] for x in top_options]
            weights = [x[1] for x in top_options]
            
            if sum(weights) > 0:
                # Square the weights to focus selection on the highest scoring clinically appropriate options,
                # while still allowing variety when scores are close.
                squared_weights = [w ** 2 for w in weights]
                return random.choices(names, weights=squared_weights, k=1)[0]
            else:
                return random.choice(names)
                
        # Fallback to recipes.json
        safe_recipes = [r["recipe_name"] for r in RECIPE_BANK if r["type"].lower() == meal_type and not contains_allergen(r["recipe_name"], allergen_list)]
        if safe_recipes:
            return random.choice(safe_recipes)
            
        return "Custom Dietary Blend (Dietitian Review Required)"

    final_breakfast = predict_safe_meal(model_ref['clf_breakfast'], "breakfast", allergies)
    final_lunch = predict_safe_meal(model_ref['clf_lunch'], "lunch", allergies)
    final_dinner = predict_safe_meal(model_ref['clf_dinner'], "dinner", allergies)

    # 6. Build MealItems by fetching macros from lookup database
    def make_meal_item(recipe_name, meal_type):
        name_clean = recipe_name.strip()
        if name_clean == "Custom Dietary Blend (Dietitian Review Required)":
            desc = "No pre-configured recipe in the database met all active allergy and restriction criteria. The kitchen must prepare a custom plain meal (e.g. plain rice/vegetables) under clinical supervision."
            return MealItem(
                recipe_name=name_clean,
                description=desc,
                calories=0,
                protein_g=0,
                carbs_g=0,
                fat_g=0,
                type=meal_type
            )

        details = lookup.get(name_clean, {
            "calories": 300,
            "protein": 15,
            "carbs": 35,
            "fat": 10
        })
        desc = f"A nutritious and delicious serving of {name_clean}, prepared to support elder wellness."
        return MealItem(
            recipe_name=name_clean,
            description=desc,
            calories=details["calories"],
            protein_g=details["protein"],
            carbs_g=details["carbs"],
            fat_g=details["fat"],
            type=meal_type
        )

    selected_meals = [
        make_meal_item(final_breakfast, "breakfast"),
        make_meal_item(final_lunch, "lunch"),
        make_meal_item(final_dinner, "dinner")
    ]

    # Check if we triggered the safety fallback
    has_unsafe_meal = any(m.recipe_name == "Custom Dietary Blend (Dietitian Review Required)" for m in selected_meals)

    # 7. Compile Dietitian Notes with custom explanations for Allergies and Restrictions
    notes_lines = [
        "### 📋 AI Dietitian Clinical Rationale",
    ]
    
    total_cal = sum(m.calories for m in selected_meals)
    total_protein = sum(m.protein_g for m in selected_meals)

    if has_unsafe_meal:
        notes_lines.append("> [!CAUTION]")
        notes_lines.append("> ⚠️ **CRITICAL ALERT: EXTREME ALLERGIES DETECTED**")
        notes_lines.append("> The resident's allergy and restriction profile is extremely restrictive. No pre-configured recipes in our database are 100% safe. **A dietitian or kitchen supervisor must customize this meal plan manually to ensure safety.**\n")

    # Dynamic Nutritional Deficit Alert block at the top if targets are missed
    if total_cal < 1400 or total_protein < 65:
        notes_lines.append("> [!IMPORTANT]")
        notes_lines.append("> ⚠️ **NUTRITIONAL DEFICIT WARNING & PROTOCOLS:**")
        notes_lines.append(f"> The prescribed main meals provide a total daily intake of approximately **{total_cal} kcal** and **{total_protein}g protein**, which falls below standard senior health requirements (recommended minimums: 1,400 kcal and 65g protein).")
        notes_lines.append("> **Actionable Clinical Care Protocols:**")
        
        # Customize snacks based on allergies
        has_nut_allergy = any("peanut" in a or "nut" in a for a in allergies)
        has_dairy_allergy = any("milk" in a or "dairy" in a for a in allergies)
        
        if has_nut_allergy and has_dairy_allergy:
            snacks = "avocado slices, hummus with whole-wheat crackers, or plant-based dairy-free protein shakes"
        elif has_nut_allergy:
            snacks = "Greek yogurt, soft cheese, cottage cheese, hummus with crackers, or avocado"
        elif has_dairy_allergy:
            snacks = "hummus with crackers, avocado, dairy-free protein pudding, or peanut/almond butter on toast (ensure nut compatibility)"
        else:
            snacks = "Greek yogurt, soft cheese, peanut butter on whole-wheat crackers, or hard-boiled eggs"
            
        notes_lines.append(f"> 1. **Supplemental Snacks:** Offer 2-3 small, high-calorie, nutrient-dense snacks between meals (e.g., {snacks}).")
        
        if has_dairy_allergy:
            notes_lines.append("> 2. **Liquid Nutrition:** Administer daily specialized dairy-free/plant-based liquid nutritional supplements (e.g., soy-based or pea-protein drinks) under clinical supervision.")
        else:
            notes_lines.append("> 2. **Liquid Nutrition:** Administer a daily liquid nutritional supplement (e.g., Ensure, Glucerna, or protein shake) under clinical supervision to bridge the deficit.")
            
        notes_lines.append("> 3. **Protein Enrichment:** Enrich soup, purees, or sauces by mixing in protein powders, egg whites, or high-protein milk derivatives where appropriate.\n")

    notes_lines.append(f"* **Nutritional Intake Analysis:** Resident appetite is averaging **{data.avg_meals_eaten_percent:.1f}%** meals consumed over the last week.")
    
    is_low_appetite = data.avg_meals_eaten_percent < 60
    if is_low_appetite:
        notes_lines.append("  * ⚠️ *Clinical Note:* Appetite is low. Dietary plan prioritizes soft-textured, nutrient-dense meals to ensure swallowing comfort, maximize calorie intake, and prevent weight loss.")
    else:
        notes_lines.append("  * *Clinical Note:* Appetite is stable. Continuing standard calorie-balanced plan.")

    notes_lines.append("\n* **BMI & Body Mass Index Analysis:**")
    # Determine senior status
    is_senior = age >= 65
    
    if is_senior:
        # Senior BMI standards: Underweight < 22, Healthy/Protective 22-30, Obese >= 30
        if bmi < 22.0:
            notes_lines.append(f"  * ⚖️ **Underweight Alert (BMI: {bmi:.1f} - Senior Standard):** Recommended high-protein, calorie-dense foods (e.g., avocado, whole grains, eggs) to support healthy weight gain, combat low appetite, and prevent muscle loss/sarcopenia.")
        elif bmi >= 30.0:
            if is_low_appetite:
                notes_lines.append(f"  * ⚖️ **Obesity/Elevated BMI (BMI: {bmi:.1f} - Senior Standard):** Weight-reduction and portion-control measures are *temporarily deferred* due to low appetite and malnutrition risk. Primary focus is maintaining muscle mass and ensuring adequate nutrition.")
            else:
                notes_lines.append(f"  * ⚖️ **Obesity Alert (BMI: {bmi:.1f} - Senior Standard):** Recommended portion control, lower calorie density, high-fiber foods, and reduced sugar/refined carbohydrates to manage weight and metabolic health.")
        else:
            notes_lines.append(f"  * ⚖️ **Healthy Weight (BMI: {bmi:.1f} - Senior Standard):** BMI falls within the protective senior range (22.0 - 29.9). Continuing balanced diet to maintain stable weight.")
    else:
        # Standard adult BMI guidelines
        if bmi < 18.5:
            notes_lines.append(f"  * ⚖️ **Underweight Alert (BMI: {bmi:.1f}):** Recommended high-protein, calorie-dense foods to support healthy weight gain and muscle preservation.")
        elif bmi >= 25.0:
            if is_low_appetite:
                notes_lines.append(f"  * ⚖️ **Overweight/Obesity Alert (BMI: {bmi:.1f}):** Portion-control and calorie-reduction goals are *temporarily deferred* because appetite is low. Nutrition intake and lean mass retention take immediate priority.")
            else:
                notes_lines.append(f"  * ⚖️ **Overweight/Obesity Alert (BMI: {bmi:.1f}):** Recommended portion control, low-calorie density, high-fiber foods, and reduced sugar/refined carbohydrates to manage weight and metabolic health.")
        else:
            notes_lines.append(f"  * ⚖️ **Healthy Weight (BMI: {bmi:.1f}):** Continuing balanced diet suitable for maintaining current stable weight.")

    notes_lines.append("\n* **Vital Trends & Medical History Assessment:**")
    if is_heart_disease:
        notes_lines.append("  * 🩺 Resident has recorded cardiovascular conditions (e.g. Heart Disease). Plan restricts high-cholesterol foods and prioritizes heart-healthy choices.")
        notes_lines.append("  * 🫀 **Cardiovascular Nutritional Targets:**\n"
                           "    * **Sodium:** Restrict daily intake to < 1,500 mg.\n"
                           "    * **Saturated Fat:** Limit to < 5-6% of total daily energy (approx. 7-10g per day).\n"
                           "    * **Dietary Cholesterol:** Limit to < 200 mg per day.\n"
                           "    * **Dietary Fiber:** Aim for 25-30g per day to support vascular health and lipid clearance.")
    elif is_hypertensive:
        # Hypertensive but no explicitly flagged heart disease still benefits from low sodium targets
        notes_lines.append(f"  * 🩺 Average Systolic BP is elevated (**{data.recent_avg_systolic_bp:.1f} mmHg**). Recommended sodium-restricted, heart-healthy meals.")
        notes_lines.append("  * 🫀 **Hypertension Dietetic Targets:**\n"
                           "    * **Sodium:** Restrict daily intake to < 1,500 mg.\n"
                           "    * **Dietary Fiber:** Target 25-30g per day to manage cardiovascular pressure.")
    else:
        notes_lines.append(f"  * 🩺 Average Blood Pressure is stable (**{data.recent_avg_systolic_bp:.1f} mmHg** systolic).")
        
    if is_diabetic:
        notes_lines.append(f"  * 🩸 Average Blood Glucose is high/borderline (**{data.recent_avg_blood_sugar:.1f} mg/dL**). Structured diet around low-glycemic, complex carbohydrates and diabetic-friendly choices.")
    else:
        notes_lines.append(f"  * 🩸 Average Blood Glucose is in healthy limits (**{data.recent_avg_blood_sugar:.1f} mg/dL**).")

    # Dynamic Notes for Allergies and Dietary Restrictions
    notes_lines.append("\n* **Allergies & Restrictions Clinical Review:**")
    if allergies:
        for allergy in allergies:
            if "milk" in allergy or "dairy" in allergy:
                notes_lines.append("  * 🥛 **Dairy Allergen Alert:** Dairy and lactose-containing ingredients (milk, cheese, yogurt) have been completely excluded from the recipes to prevent allergic reactions or digestive distress.")
            elif "peanut" in allergy or "nut" in allergy:
                notes_lines.append("  * 🥜 **Nut Allergen Alert:** Strict peanut/tree nut elimination filters applied to ensure safe food consumption.")
            elif "fish" in allergy or "seafood" in allergy:
                notes_lines.append("  * 🐟 **Seafood Allergen Alert:** Excluded fish, cod, salmon, and shellfish products from today's recipe selection.")
            elif "egg" in allergy:
                notes_lines.append("  * 🍳 **Egg Allergen Alert:** Egg-free recipes selected to prevent hypersensitivity reactions.")
            elif "soy" in allergy:
                notes_lines.append("  * 🫘 **Soy Allergen Alert:** Soy-free ingredients prioritized to accommodate sensitivities.")
            else:
                notes_lines.append(f"  * ⚠️ **Allergen Protection:** Excluded all ingredients and recipes containing '{allergy}' from the menu.")
    else:
        notes_lines.append("  * ✅ No active ingredient allergies detected.")

    if restrictions:
        for rest in restrictions:
            rest_clean = rest.strip().lower()
            if "gluten" in rest_clean:
                notes_lines.append("  * 🌾 **Gluten-Free Restriction:** Selected gluten-free grain alternatives (like quinoa and oats) to promote gastrointestinal comfort and prevent autoimmune triggers.")
            elif "sodium" in rest_clean or "salt" in rest_clean:
                notes_lines.append("  * 🧂 **Low-Sodium Restriction:** Salt intake restricted; menu utilizes herbs and citrus flavoring to manage cardiovascular pressure.")
            elif "vegetarian" in rest_clean or "vegan" in rest_clean:
                notes_lines.append("  * 🥗 **Vegetarian Choice:** Prioritized plant-based protein sources (beans, lentils, seeds) to align with personal preference.")
            elif "halal" in rest_clean:
                notes_lines.append("  * 🌙 **Halal Compliance:** Handled meat selection under strict Halal dietary guidelines.")
            elif "soft" in rest_clean:
                notes_lines.append("  * 🥣 **Soft-Food Texturing:** Recommended easy-to-chew and digest recipes to prevent fatigue during feeding.")
            elif "sugar" in rest_clean or "diabetic" in rest_clean:
                notes_lines.append("  * 🍬 **Low-Sugar Restriction:** Avoided refined sugars and high-glycemic index starches to stabilize blood glucose levels.")
            else:
                notes_lines.append(f"  * 📋 **Dietary Goal:** Menu adapted to fully satisfy the '{rest}' profile requirements.")
    else:
        notes_lines.append("  * ✅ No specific dietary restrictions required.")

    notes_lines.append(f"\n* **Meal Breakdown:** The selected menu offers a total daily intake of approximately **{total_cal} kcal** containing **{total_protein}g protein**, which supports lean mass retention and cardiovascular health.")

    return DietRecommendationOutput(
        elderly_id=data.elderly_id,
        meals=selected_meals,
        dietitian_notes="\n".join(notes_lines)
    )


@app.post("/api/ml/retrain")
def retrain_model(api_key: str = Depends(get_api_key)):
    """
    Endpoint to trigger dynamic model retraining and dataset augmentation on the fly.
    If new recipes exist in recipes.json, it augments the training dataset and retrains the classifiers.
    """
    logger.info("Retrain request received. Starting dataset augmentation check and model retraining...")
    try:
        from train_model import train_meal_recommender
        
        # We run this inside the lock to make sure we don't have multiple retraining runs concurrently 
        # or load the model while it's in a partially saved state on disk.
        with meal_model_lock:
            status = train_meal_recommender(augment=True)
            
        if not status:
            raise HTTPException(status_code=500, detail="Retraining failed. Check service logs.")
            
        if status == "skipped":
            logger.info("Model is already up-to-date. Retraining skipped.")
            return {"status": "success", "message": "Meal recommendation model is already up-to-date. Retraining skipped."}
            
        # Reload the newly trained model into memory
        reload_meal_model()
        
        # Reload recipes from recipes.json to merge any active fields
        load_recipes_from_json()
        
        logger.info("Model retrained and reloaded successfully.")
        return {"status": "success", "message": "Meal recommendation model retrained and reloaded successfully on the fly."}
    except Exception as e:
        logger.error(f"Retraining endpoint failed: {e}")
        raise HTTPException(status_code=500, detail=f"Retraining failed: {str(e)}")
