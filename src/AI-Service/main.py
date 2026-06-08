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

# Default recipes backup (the original 12 recipes)
DEFAULT_RECIPES = [
    # Breakfast
    {
        "recipe_name": "Antioxidant Oatmeal Bowl",
        "description": "Warm steel-cut oats topped with fresh blueberries, chia seeds, sliced almonds, and a touch of honey.",
        "calories": 320, "protein_g": 10, "carbs_g": 52, "fat_g": 8, "type": "breakfast",
        "tags": ["low-sodium", "high-fiber", "vegetarian", "heart-healthy"]
    },
    {
        "recipe_name": "Vegetable Egg White Frittata",
        "description": "Fluffy baked egg whites with spinach, diced tomatoes, bell peppers, and low-fat feta cheese.",
        "calories": 180, "protein_g": 18, "carbs_g": 8, "fat_g": 6, "type": "breakfast",
        "tags": ["low-sugar", "diabetic-friendly", "high-protein", "low-sodium", "soft-food"]
    },
    {
        "recipe_name": "Creamy Banana Avocado Smoothie",
        "description": "Blended ripe banana, avocado, Greek yogurt, spinach, and unsweetened almond milk. Easy to swallow and highly nutritious.",
        "calories": 290, "protein_g": 12, "carbs_g": 35, "fat_g": 11, "type": "breakfast",
        "tags": ["soft-food", "high-potassium", "low-sodium", "vegetarian"]
    },
    {
        "recipe_name": "Whole Wheat Toast with Poached Eggs",
        "description": "Two perfectly poached eggs served on a slice of sprouted whole wheat toast with sliced tomatoes.",
        "calories": 240, "protein_g": 14, "carbs_g": 18, "fat_g": 10, "type": "breakfast",
        "tags": ["low-sugar", "diabetic-friendly", "high-protein", "heart-healthy"]
    },
    # Lunch
    {
        "recipe_name": "Herb-Grilled Salmon & Broccoli",
        "description": "Rich in Omega-3s, grilled salmon fillet seasoned with dill and lemon juice, served with tender steamed broccoli.",
        "calories": 380, "protein_g": 34, "carbs_g": 12, "fat_g": 18, "type": "lunch",
        "tags": ["low-sodium", "low-sugar", "diabetic-friendly", "high-protein", "heart-healthy", "salmon", "fish"]
    },
    {
        "recipe_name": "Golden Lentil & Vegetable Soup",
        "description": "Slow-simmered red lentils, carrots, celery, and sweet potatoes with turmeric and ginger. Mild and soft texture.",
        "calories": 260, "protein_g": 14, "carbs_g": 42, "fat_g": 3, "type": "lunch",
        "tags": ["soft-food", "vegetarian", "low-sodium", "low-sugar", "high-fiber", "lentils"]
    },
    {
        "recipe_name": "Quinoa & Roasted Veggie Salad",
        "description": "Fluffy quinoa tossed with roasted zucchini, bell peppers, eggplant, parsley, and a light olive oil-lemon dressing.",
        "calories": 310, "protein_g": 9, "carbs_g": 44, "fat_g": 10, "type": "lunch",
        "tags": ["vegetarian", "low-sodium", "diabetic-friendly", "heart-healthy"]
    },
    {
        "recipe_name": "Baked Cod with Sweet Potato Mash",
        "description": "Mild, flaky Atlantic cod baked with herbs, served with smooth, fiber-rich sweet potato mash.",
        "calories": 320, "protein_g": 26, "carbs_g": 38, "fat_g": 5, "type": "lunch",
        "tags": ["soft-food", "low-sodium", "low-sugar", "diabetic-friendly", "heart-healthy", "cod", "fish"]
    },
    # Dinner
    {
        "recipe_name": "Tender Roasted Turkey Breast & Pumpkin Purée",
        "description": "Thinly sliced, tender roasted turkey breast served alongside smooth pumpkin purée and sautéed green beans.",
        "calories": 340, "protein_g": 30, "carbs_g": 24, "fat_g": 8, "type": "dinner",
        "tags": ["soft-food", "low-sodium", "low-sugar", "diabetic-friendly", "high-protein", "turkey"]
    },
    {
        "recipe_name": "Mediterranean Chickpea & Spinach Stew",
        "description": "Flavorful, soft chickpeas cooked in a light tomato broth with fresh spinach, garlic, and extra virgin olive oil.",
        "calories": 280, "protein_g": 11, "carbs_g": 38, "fat_g": 7, "type": "dinner",
        "tags": ["vegetarian", "soft-food", "low-sodium", "low-sugar", "diabetic-friendly", "chickpeas"]
    },
    {
        "recipe_name": "Lemon-Garlic Chicken Breast with Quinoa Mash",
        "description": "Tender poached chicken breast cutlets seasoned with lemon-garlic sauce, served over smooth quinoa mash.",
        "calories": 390, "protein_g": 36, "carbs_g": 30, "fat_g": 9, "type": "dinner",
        "tags": ["high-protein", "low-sodium", "low-sugar", "diabetic-friendly", "soft-food", "chicken"]
    },
    {
        "recipe_name": "Creamy Butternut Squash Risotto",
        "description": "Warm, creamy arborio rice cooked with butternut squash purée, baby spinach, and a sprinkle of parmesan cheese.",
        "calories": 330, "protein_g": 8, "carbs_g": 58, "fat_g": 6, "type": "dinner",
        "tags": ["soft-food", "vegetarian", "low-sodium", "risotto"]
    }
]

recipes_json_path = "recipes.json"
RECIPE_BANK = []

def load_recipes_from_json():
    global RECIPE_BANK
    if not os.path.exists(recipes_json_path):
        try:
            with open(recipes_json_path, 'w', encoding='utf-8') as f:
                json.dump(DEFAULT_RECIPES, f, indent=4, ensure_ascii=False)
            logger.info("Created default recipes.json file.")
        except Exception as e:
            logger.error(f"Failed to create default recipes.json: {e}")
            RECIPE_BANK = DEFAULT_RECIPES.copy()
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
        RECIPE_BANK = DEFAULT_RECIPES.copy()

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
        'mood_score': data.mood_score
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

    # Handle cases where the ML model predicted High Risk, but individual rule thresholds were not breached
    if is_high_risk and not anomalies:
        anomalies.append("🧠 **AI Model Pattern Alert**: Multivariate trend anomalies detected.")
        reasons.append(f"The ML model predicted high risk based on a combined pattern of vitals, age ({data.age}), mobility ({data.mobility_score}/10), sleep ({data.sleep_hours} hrs), and mood ({data.mood_score}/10).")
        actions.append("Perform a physical check-up. Review daily logs and monitor vital trends closely.")

    # 3. Dynamic Clinician Markdown Report Compile
    risk = "High" if is_high_risk else "Low"
    
    if is_high_risk:
        report_lines = [
            "### 🚨 URGENT: AI Clinical Health Alert: High Risk Detected",
            f"Risk Probability: **{confidence * 100:.0f}%**\n",
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
            f"- **Heart Rate**: {data.heart_rate} bpm (Normal)",
            f"- **Blood Pressure**: {data.systolic_bp}/{data.diastolic_bp} mmHg (Normal)",
            f"- **Blood Sugar**: {data.blood_sugar} mg/dL (Normal)",
            f"- **Body Temperature**: {temp_display} (Normal)",
            f"- **Medication Adherence**: All doses taken (0 missed)",
            "\n#### 📋 Clinical Recommendation:",
            "- Continue standard daily care routine and scheduled observations. No acute interventions required."
        ]
        
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

    # 4. Predict meal suggestions
    predicted_breakfast = model_ref['clf_breakfast'].predict(features_df)[0]
    predicted_lunch = model_ref['clf_lunch'].predict(features_df)[0]
    predicted_dinner = model_ref['clf_dinner'].predict(features_df)[0]

    # 5. Helper function to check allergen matching and perform safe fallback
    def contains_allergen(recipe_name, allergen_list):
        text = recipe_name.lower()
        for allergen in allergen_list:
            if allergen in text:
                return True
            if "nut" in allergen and ("almond" in text or "nut" in text or "chia" in text):
                return True
            if "seafood" in allergen and ("salmon" in text or "cod" in text or "fish" in text or "tuna" in text):
                return True
            if "milk" in allergen and ("cheese" in text or "yogurt" in text or "cream" in text or "milk" in text or "butter" in text):
                return True
        return False

    # lookup is already populated under the lock reference

    def get_safe_recipe(predicted_name, meal_type, allergen_list):
        if not contains_allergen(predicted_name, allergen_list):
            return predicted_name

        # Fallback: scan all known recipes in lookup database and pick first safe one
        all_recipes = sorted(list(lookup.keys()))
        for name in all_recipes:
            if not contains_allergen(name, allergen_list):
                return name
        
        # If absolutely no recipe is safe from the patient's active allergens
        return "Custom Dietary Blend (Dietitian Review Required)"

    final_breakfast = get_safe_recipe(predicted_breakfast, "breakfast", allergies)
    final_lunch = get_safe_recipe(predicted_lunch, "lunch", allergies)
    final_dinner = get_safe_recipe(predicted_dinner, "dinner", allergies)

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
    
    if has_unsafe_meal:
        notes_lines.append("> [!CAUTION]")
        notes_lines.append("> ⚠️ **CRITICAL ALERT: EXTREME ALLERGIES DETECTED**")
        notes_lines.append("> The resident's allergy and restriction profile is extremely restrictive. No pre-configured recipes in our database are 100% safe. **A dietitian or kitchen supervisor must customize this meal plan manually to ensure safety.**\n")

    notes_lines.append(f"* **Nutritional Intake Analysis:** Resident appetite is averaging **{data.avg_meals_eaten_percent:.1f}%** meals consumed over the last week.")
    
    if data.avg_meals_eaten_percent < 60:
        notes_lines.append("  * ⚠️ *Clinical Note:* Appetite is low. Dietary plan prioritizes soft-textured, nutrient-dense meals to ensure swallowing comfort and prevent weight loss.")
    else:
        notes_lines.append("  * *Clinical Note:* Appetite is stable. Continuing standard calorie-balanced plan.")

    notes_lines.append("\n* **BMI & Body Mass Index Analysis:**")
    if bmi < 18.5:
        notes_lines.append(f"  * ⚖️ **Underweight Alert (BMI: {bmi:.1f}):** Recommended high-protein, calorie-dense foods (e.g., nuts, seeds, avocado, whole grains) to support healthy weight gain and muscle preservation.")
    elif bmi >= 25.0:
        notes_lines.append(f"  * ⚖️ **Overweight/Obesity Alert (BMI: {bmi:.1f}):** Recommended portion control, low-calorie density, high-fiber foods, and reduced sugar/refined carbohydrates to manage weight and metabolic health.")
    else:
        notes_lines.append(f"  * ⚖️ **Healthy Weight (BMI: {bmi:.1f}):** Continuing balanced diet suitable for maintaining current stable weight.")

    notes_lines.append("\n* **Vital Trends & Medical History Assessment:**")
    if is_heart_disease:
        notes_lines.append("  * 🩺 Resident has recorded cardiovascular conditions (e.g. Heart Disease). Plan restricts high-cholesterol foods and prioritizes heart-healthy choices.")

    if is_hypertensive:
        notes_lines.append(f"  * 🩺 Average Systolic BP is elevated (**{data.recent_avg_systolic_bp:.1f} mmHg**). Recommended sodium-restricted, heart-healthy meals.")
    elif not is_heart_disease:
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

    notes_lines.append(f"\n* **Meal Breakdown:** The selected menu offers a total daily intake of approximately **{sum(m.calories for m in selected_meals)} kcal** containing **{sum(m.protein_g for m in selected_meals)}g protein**, which supports lean mass retention and cardiovascular health.")

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
            success = train_meal_recommender(augment=True)
            
        if not success:
            raise HTTPException(status_code=500, detail="Retraining failed. Check service logs.")
            
        # Reload the newly trained model into memory
        reload_meal_model()
        
        # Reload recipes from recipes.json to merge any active fields
        load_recipes_from_json()
        
        logger.info("Model retrained and reloaded successfully.")
        return {"status": "success", "message": "Meal recommendation model retrained and reloaded successfully on the fly."}
    except Exception as e:
        logger.error(f"Retraining endpoint failed: {e}")
        raise HTTPException(status_code=500, detail=f"Retraining failed: {str(e)}")
