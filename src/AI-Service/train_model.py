import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.model_selection import train_test_split, cross_val_score, StratifiedKFold
from sklearn.preprocessing import LabelEncoder
from sklearn.impute import SimpleImputer
from sklearn.metrics import classification_report, accuracy_score, confusion_matrix, f1_score
from sklearn.utils.class_weight import compute_sample_weight
import joblib
import os
import json
import logging

# Configure standard Python logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("TrainModel")

# =====================================================================
# PART 1: Health Risk Model Training
# =====================================================================
def train_health_risk_model():
    dataset_path = "elderly_health_dataset_v2.xlsx"

    # Check if dataset already exists to avoid regenerating it on every run
    if not os.path.exists(dataset_path):
        logger.info(f"1. Generating a new health risk dataset with probabilistic labeling at {dataset_path}...")
        np.random.seed(42)
        num_records = 10000

        # Base vital data generation
        data = {
            'age': np.random.randint(65, 95, num_records),
            'heart_rate': np.random.normal(75, 12, num_records).astype(int),
            'systolic_bp': np.random.normal(130, 18, num_records).astype(int),
            'diastolic_bp': np.random.normal(80, 10, num_records).astype(int),
            'blood_sugar': np.random.normal(110, 30, num_records).astype(int),
            'body_temperature': np.round(np.random.normal(98.6, 0.8, num_records), 1),
            'mobility_score': np.random.randint(2, 10, num_records),
            'sleep_hours': np.round(np.random.normal(6.5, 1.5, num_records), 1),
            'missed_medications': np.random.choice([0, 1, 2, 3], num_records, p=[0.7, 0.15, 0.1, 0.05]),
            'meals_eaten_percent': np.random.choice([100, 75, 50, 25, 0], num_records, p=[0.6, 0.2, 0.1, 0.05, 0.05]),
            'mood_score': np.random.randint(3, 10, num_records),
            'oxygen_saturation': np.random.normal(98, 1.5, num_records).astype(int),
            'respiratory_rate': np.random.normal(16, 2.5, num_records).astype(int),
            'water_intake_ml': np.random.normal(1600, 400, num_records).astype(int),
            'pain_level': np.random.choice([0, 1, 2, 3, 4, 5], num_records, p=[0.6, 0.15, 0.1, 0.08, 0.05, 0.02])
        }

        df_health = pd.DataFrame(data)

        # Inject simulated emergency variations
        emergency_indices = np.random.choice(df_health.index, size=int(num_records * 0.15), replace=False)
        df_health.loc[emergency_indices, 'heart_rate'] = np.random.randint(110, 140, len(emergency_indices))
        df_health.loc[emergency_indices, 'systolic_bp'] = np.random.randint(160, 200, len(emergency_indices))
        df_health.loc[emergency_indices, 'missed_medications'] = np.random.randint(1, 4, len(emergency_indices))
        df_health.loc[emergency_indices, 'sleep_hours'] = np.random.uniform(2, 4, len(emergency_indices))
        df_health.loc[emergency_indices, 'oxygen_saturation'] = np.random.randint(85, 92, len(emergency_indices))
        df_health.loc[emergency_indices, 'respiratory_rate'] = np.random.randint(25, 35, len(emergency_indices))
        df_health.loc[emergency_indices, 'water_intake_ml'] = np.random.randint(200, 450, len(emergency_indices))
        df_health.loc[emergency_indices, 'pain_level'] = np.random.randint(7, 11, len(emergency_indices))

        # 2. Probabilistic Labeling function (Replacing Rule-Based Labeling)
        def generate_probabilistic_labels(df):
            # Calculate log-odds based on vital sign deviations
            hr_dev = np.maximum(0, df['heart_rate'] - 100) / 15.0 + np.maximum(0, 60 - df['heart_rate']) / 10.0
            sbp_dev = np.maximum(0, df['systolic_bp'] - 130) / 20.0 + np.maximum(0, 90 - df['systolic_bp']) / 15.0
            dbp_dev = np.maximum(0, df['diastolic_bp'] - 80) / 10.0 + np.maximum(0, 60 - df['diastolic_bp']) / 10.0
            bs_dev = np.maximum(0, df['blood_sugar'] - 120) / 30.0 + np.maximum(0, 70 - df['blood_sugar']) / 15.0
            temp_dev = np.maximum(0, df['body_temperature'] - 99.5) / 1.5 + np.maximum(0, 96.0 - df['body_temperature']) / 1.5
            age_factor = (df['age'] - 65) / 30.0
            mobility_factor = (10 - df['mobility_score']) / 5.0
            sleep_factor = np.maximum(0, 7.0 - df['sleep_hours']) / 2.0
            med_factor = df['missed_medications'] * 0.8
            meals_factor = (100 - df['meals_eaten_percent']) / 50.0
            mood_factor = (10 - df['mood_score']) / 5.0
            
            # New features contributions
            spo2_dev = np.maximum(0, 95 - df['oxygen_saturation']) / 5.0
            rr_dev = np.maximum(0, df['respiratory_rate'] - 20) / 5.0 + np.maximum(0, 12 - df['respiratory_rate']) / 3.0
            water_factor = np.maximum(0, 1000 - df['water_intake_ml']) / 500.0
            pain_factor = df['pain_level'] / 5.0
            
            # Combine linearly to get log-odds
            log_odds = (
                -3.2
                + 1.5 * hr_dev
                + 1.8 * sbp_dev
                + 1.2 * dbp_dev
                + 1.5 * bs_dev
                + 2.0 * temp_dev
                + 0.5 * age_factor
                + 0.6 * mobility_factor
                + 0.4 * sleep_factor
                + 1.5 * med_factor
                + 0.5 * meals_factor
                + 0.4 * mood_factor
                + 2.0 * spo2_dev
                + 1.0 * rr_dev
                + 0.8 * water_factor
                + 1.0 * pain_factor
            )
            prob = 1 / (1 + np.exp(-log_odds))
            return np.random.binomial(1, prob)

        df_health['is_high_risk'] = generate_probabilistic_labels(df_health)

        for col in ['heart_rate', 'systolic_bp', 'blood_sugar', 'body_temperature', 'sleep_hours', 'oxygen_saturation', 'respiratory_rate', 'water_intake_ml', 'pain_level']:
            mask = np.random.rand(num_records) < 0.03
            df_health.loc[mask, col] = np.nan

        df_health.to_excel(dataset_path, index=False)
        logger.info(f"Dataset generated with probabilistic labels and missing values at: {dataset_path}")
    else:
        logger.info(f"Dataset already exists at {dataset_path}, loading from file...")
        df_health = pd.read_excel(dataset_path)

    logger.info("2. Checking and handling missing values...")
    # Clip negative blood sugar values before imputation to ensure they don't skew the median calculation
    if 'blood_sugar' in df_health.columns:
        df_health['blood_sugar'] = df_health['blood_sugar'].clip(lower=20)
        
    health_features = [
        'age', 'heart_rate', 'systolic_bp', 'diastolic_bp', 'blood_sugar', 
        'body_temperature', 'mobility_score', 'sleep_hours', 'missed_medications', 
        'meals_eaten_percent', 'mood_score', 'oxygen_saturation', 'respiratory_rate',
        'water_intake_ml', 'pain_level'
    ]
    imputer = SimpleImputer(strategy='median')
    df_health[health_features] = imputer.fit_transform(df_health[health_features])

    logger.info("3. Cleaning non-physical outliers...")
    df_health['heart_rate'] = df_health['heart_rate'].clip(30, 220)
    df_health['systolic_bp'] = df_health['systolic_bp'].clip(50, 250)
    df_health['diastolic_bp'] = df_health['diastolic_bp'].clip(30, 150)
    df_health['blood_sugar'] = df_health['blood_sugar'].clip(20, 600)
    df_health['body_temperature'] = df_health['body_temperature'].clip(90.0, 110.0)
    df_health['oxygen_saturation'] = df_health['oxygen_saturation'].clip(20, 100)
    df_health['respiratory_rate'] = df_health['respiratory_rate'].clip(0, 100)
    df_health['water_intake_ml'] = df_health['water_intake_ml'].clip(0, 10000)
    df_health['pain_level'] = df_health['pain_level'].clip(0, 10)

    X_health = df_health[health_features]
    y_health = df_health['is_high_risk']

    X_train_h, X_test_h, y_train_h, y_test_h = train_test_split(
        X_health, y_health, test_size=0.2, random_state=42, stratify=y_health
    )

    models = {
        "Logistic Regression": LogisticRegression(class_weight='balanced', max_iter=3000, random_state=42),
        "Decision Tree": DecisionTreeClassifier(class_weight='balanced', max_depth=6, random_state=42),
        "Random Forest": RandomForestClassifier(class_weight='balanced', n_estimators=150, max_depth=10, random_state=42),
        "Gradient Boosting": GradientBoostingClassifier(random_state=42)
    }

    best_model = None
    best_model_name = ""
    best_f1 = -1
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)

    for name, model in models.items():
        logger.info(f"--- Model: {name} ---")
        
        # Address class imbalance in Gradient Boosting using compute_sample_weight
        if name == "Gradient Boosting":
            from sklearn.base import clone
            cv_scores = []
            for train_idx, val_idx in cv.split(X_train_h, y_train_h):
                X_tr, X_va = X_train_h.iloc[train_idx], X_train_h.iloc[val_idx]
                y_tr, y_va = y_train_h.iloc[train_idx], y_train_h.iloc[val_idx]
                sw_tr = compute_sample_weight(class_weight='balanced', y=y_tr)
                fold_model = clone(model)
                fold_model.fit(X_tr, y_tr, sample_weight=sw_tr)
                preds_va = fold_model.predict(X_va)
                cv_scores.append(f1_score(y_va, preds_va))
            
            logger.info(f"  5-Fold CV F1-Score: {np.mean(cv_scores):.4f} (+/- {np.std(cv_scores):.4f})")
            sample_weight = compute_sample_weight(class_weight='balanced', y=y_train_h)
            model.fit(X_train_h, y_train_h, sample_weight=sample_weight)
        else:
            cv_scores = cross_val_score(model, X_train_h, y_train_h, cv=cv, scoring='f1')
            logger.info(f"  5-Fold CV F1-Score: {np.mean(cv_scores):.4f} (+/- {np.std(cv_scores):.4f})")
            model.fit(X_train_h, y_train_h)
            
        preds = model.predict(X_test_h)
        test_f1 = f1_score(y_test_h, preds)
        test_acc = accuracy_score(y_test_h, preds)
        logger.info(f"  Test Accuracy: {test_acc:.4f}")
        logger.info(f"  Test F1-Score: {test_f1:.4f}")
        
        if test_f1 > best_f1:
            best_f1 = test_f1
            best_model = model
            best_model_name = name

    logger.info(f"Best Model Selected: {best_model_name} (Test F1: {best_f1:.4f})")

    feature_importances = {}
    if hasattr(best_model, 'feature_importances_'):
        importances = best_model.feature_importances_
        for col, imp in zip(health_features, importances):
            feature_importances[col] = float(imp)
    elif hasattr(best_model, 'coef_'):
        coefs = np.abs(best_model.coef_[0])
        coefs_sum = np.sum(coefs)
        if coefs_sum > 0:
            coefs = coefs / coefs_sum
        for col, imp in zip(health_features, coefs):
            feature_importances[col] = float(imp)

    with open("feature_importances.json", "w") as f:
        json.dump(feature_importances, f, indent=4)

    joblib.dump(best_model, "health_risk_model.pkl")
    joblib.dump(health_features, "model_features.pkl")
    logger.info("Health risk model artifacts saved successfully!")

# =====================================================================
# PART 2: Meal Recommender Model Training & Data Augmentation
# =====================================================================
def augment_dataset_with_new_recipes():
    meals_csv_path = "detailed_meals_macros_CLEANED.csv"
    recipes_json_path = "recipes.json"
    
    if not os.path.exists(recipes_json_path):
        logger.warning(f"Recipes file not found at {recipes_json_path}. Skipping augmentation.")
        return 0
        
    if not os.path.exists(meals_csv_path):
        logger.warning(f"Meals CSV not found at {meals_csv_path}. Skipping augmentation.")
        return 0

    with open(recipes_json_path, 'r', encoding='utf-8') as f:
        recipes = json.load(f)

    df_meals = pd.read_csv(meals_csv_path)

    existing_breakfasts = set(df_meals['Breakfast Suggestion'].str.strip().unique())
    existing_lunches = set(df_meals['Lunch Suggestion'].str.strip().unique())
    existing_dinners = set(df_meals['Dinner Suggestion'].str.strip().unique())

    new_recipes = []
    for r in recipes:
        name = r["recipe_name"].strip()
        rtype = r["type"].lower().strip()
        if rtype == "breakfast" and name not in existing_breakfasts:
            new_recipes.append(r)
        elif rtype == "lunch" and name not in existing_lunches:
            new_recipes.append(r)
        elif rtype == "dinner" and name not in existing_dinners:
            new_recipes.append(r)

    if not new_recipes:
        logger.info("No new recipes found for data augmentation.")
        return 0

    logger.info(f"Augmenting dataset: found {len(new_recipes)} new recipes to add.")
    new_rows = []
    np.random.seed(42)

    for r in new_recipes:
        name = r["recipe_name"].strip()
        rtype = r["type"].lower().strip()
        tags = [t.lower().strip() for t in r.get("tags", [])]
        
        logger.info(f"Generating 150 training samples for recipe: {name} ({rtype})")
        for _ in range(150):
            # Sample a random base row to preserve all other fields safely
            sampled_idx = np.random.choice(df_meals.index)
            base_row = df_meals.loc[sampled_idx].copy()
            
            # Replace target meal suggestion and its macros
            if rtype == "breakfast":
                base_row['Breakfast Suggestion'] = name
                base_row['Breakfast Calories'] = r["calories"]
                base_row['Breakfast Protein'] = r["protein_g"]
                base_row['Breakfast Carbohydrates'] = r["carbs_g"]
                base_row['Breakfast Fats'] = r["fat_g"]
            elif rtype == "lunch":
                base_row['Lunch Suggestion'] = name
                base_row['Lunch Calories'] = r["calories"]
                base_row['Lunch Protein'] = r["protein_g"]
                base_row['Lunch Carbohydrates'] = r["carbs_g"]
                base_row['Lunch Fats'] = r["fat_g"]
            elif rtype == "dinner":
                base_row['Dinner Suggestion'] = name
                base_row['Dinner Calories'] = r["calories"]
                base_row['Dinner Protein.1'] = r["protein_g"]
                base_row['Dinner Carbohydrates.1'] = r["carbs_g"]
                base_row['Dinner Fats'] = r["fat_g"]
                
            # Synthesize patient features matching recipe tags
            # Dietary Preference mapping
            if "vegan" in tags:
                base_row['Dietary Preference'] = "Vegan"
            elif "vegetarian" in tags:
                base_row['Dietary Preference'] = "Vegetarian"
            elif "pescatarian" in tags or any(t in tags for t in ["fish", "salmon", "cod", "tuna"]):
                base_row['Dietary Preference'] = "Pescatarian"
            else:
                if np.random.rand() < 0.8:
                    base_row['Dietary Preference'] = "Omnivore"
            
            # Disease mapping
            diseases = []
            if "diabetic-friendly" in tags or "low-sugar" in tags:
                diseases.append("Diabetes")
            if "low-sodium" in tags or "heart-healthy" in tags:
                diseases.append("Hypertension")
                diseases.append("Heart Disease")
            
            is_high_protein = "high-protein" in tags
            if is_high_protein:
                diseases.append("Weight Loss")
                # Lower weight/BMI
                height = np.random.randint(150, 180)
                bmi = np.random.uniform(15.0, 18.4)
                weight = int(bmi * ((height / 100) ** 2))
                base_row['Height'] = height
                base_row['Weight'] = weight
            else:
                if np.random.rand() < 0.7:
                    diseases.append("Weight Gain")
                    # Higher/normal BMI
                    height = np.random.randint(155, 185)
                    bmi = np.random.uniform(22.0, 32.0)
                    weight = int(bmi * ((height / 100) ** 2))
                    base_row['Height'] = height
                    base_row['Weight'] = weight
                else:
                    height = np.random.randint(150, 185)
                    weight = np.random.randint(55, 95)
                    base_row['Height'] = height
                    base_row['Weight'] = weight
            
            unique_diseases = []
            for d in diseases:
                if d not in unique_diseases:
                    unique_diseases.append(d)
            if not unique_diseases:
                unique_diseases.append("None")
            base_row['Disease'] = ", ".join(unique_diseases)
            
            # General attributes
            base_row['Ages'] = np.random.randint(65, 95)
            base_row['Gender'] = np.random.choice(["Male", "Female"])
            
            if "heart-healthy" in tags:
                base_row['Activity Level'] = np.random.choice(["Sedentary", "Lightly Active", "Moderately Active"])
            else:
                base_row['Activity Level'] = np.random.choice(['Moderately Active', 'Lightly Active', 'Sedentary', 'Very Active', 'Extremely Active'])
            
            new_rows.append(base_row)
            
    df_augmented = pd.concat([df_meals, pd.DataFrame(new_rows)], ignore_index=True)
    df_augmented.to_csv(meals_csv_path, index=False)
    logger.info(f"Appended {len(new_rows)} rows to {meals_csv_path}")
    return len(new_recipes)

def train_meal_recommender(augment=True):
    meals_csv_path = "detailed_meals_macros_CLEANED.csv"
    
    num_augmented = 0
    if augment:
        num_augmented = augment_dataset_with_new_recipes()
        
    model_exists = os.path.exists('meal_recommender.pkl')
    if augment and num_augmented == 0 and model_exists:
        logger.info("No new recipes found and trained model already exists. Skipping retraining to save CPU cycles.")
        return "skipped"
        
    if not os.path.exists(meals_csv_path):
        logger.warning(f"Meal dataset not found at {meals_csv_path}. Skipping meal recommender training.")
        return False
        
    logger.info(f"Loading meal dataset for training from {meals_csv_path}...")
    df_meals = pd.read_csv(meals_csv_path)
    
    # Clean missing values
    if 'Breakfast Carbohydrates' in df_meals.columns:
        df_meals['Breakfast Carbohydrates'] = df_meals['Breakfast Carbohydrates'].fillna(df_meals['Breakfast Carbohydrates'].median())

    # Pre-process Medical Conditions (Disease) column
    disease_list = ['diabetes', 'hypertension', 'heart disease', 'kidney disease', 'acne', 'weight gain', 'weight loss']
    for disease in disease_list:
        col_name = f"has_{disease.replace(' ', '_')}"
        df_meals[col_name] = df_meals['Disease'].str.lower().str.contains(disease).astype(int)

    # Encode categorical columns
    le_gender = LabelEncoder()
    df_meals['gender_encoded'] = le_gender.fit_transform(df_meals['Gender'])

    le_activity = LabelEncoder()
    df_meals['activity_encoded'] = le_activity.fit_transform(df_meals['Activity Level'])

    le_preference = LabelEncoder()
    df_meals['preference_encoded'] = le_preference.fit_transform(df_meals['Dietary Preference'])

    # Feature List
    meal_features = [
        'Ages', 'gender_encoded', 'Height', 'Weight', 'activity_encoded', 'preference_encoded',
        'has_diabetes', 'has_hypertension', 'has_heart_disease', 'has_kidney_disease',
        'has_acne', 'has_weight_gain', 'has_weight_loss'
    ]

    X_meals = df_meals[meal_features]
    y_breakfast = df_meals['Breakfast Suggestion'].str.strip()
    y_lunch = df_meals['Lunch Suggestion'].str.strip()
    y_dinner = df_meals['Dinner Suggestion'].str.strip()

    logger.info("Training Breakfast Classifier...")
    X_train_b, X_test_b, y_train_b, y_test_b = train_test_split(X_meals, y_breakfast, test_size=0.15, random_state=42)
    clf_breakfast = RandomForestClassifier(n_estimators=100, max_depth=12, random_state=42)
    clf_breakfast.fit(X_train_b, y_train_b)

    logger.info("Training Lunch Classifier...")
    X_train_l, X_test_l, y_train_l, y_test_l = train_test_split(X_meals, y_lunch, test_size=0.15, random_state=42)
    clf_lunch = RandomForestClassifier(n_estimators=100, max_depth=12, random_state=42)
    clf_lunch.fit(X_train_l, y_train_l)

    logger.info("Training Dinner Classifier...")
    X_train_d, X_test_d, y_train_d, y_test_d = train_test_split(X_meals, y_dinner, test_size=0.15, random_state=42)
    clf_dinner = RandomForestClassifier(n_estimators=100, max_depth=12, random_state=42)
    clf_dinner.fit(X_train_d, y_train_d)

    # Compile recipe lookup database for macro mappings (taking median values)
    recipe_lookup = {}

    def add_lookup_entries(df, name_col, cal_col, prot_col, carb_col, fat_col, meal_type):
        grouped = df.groupby(name_col)[[cal_col, prot_col, carb_col, fat_col]].median()
        for name, row in grouped.iterrows():
            clean_name = str(name).strip()
            recipe_lookup[clean_name] = {
                "calories": int(row[cal_col]),
                "protein": int(row[prot_col]),
                "carbs": int(row[carb_col]),
                "fat": int(row[fat_col]),
                "type": meal_type
            }

    add_lookup_entries(df_meals, 'Breakfast Suggestion', 'Breakfast Calories', 'Breakfast Protein', 'Breakfast Carbohydrates', 'Breakfast Fats', 'breakfast')
    add_lookup_entries(df_meals, 'Lunch Suggestion', 'Lunch Calories', 'Lunch Protein', 'Lunch Carbohydrates', 'Lunch Fats', 'lunch')
    add_lookup_entries(df_meals, 'Dinner Suggestion', 'Dinner Calories', 'Dinner Protein.1', 'Dinner Carbohydrates.1', 'Dinner Fats', 'dinner')

    # Also make sure recipes.json tags and description are merged into recipe_lookup if available
    recipes_json_path = "recipes.json"
    if os.path.exists(recipes_json_path):
        try:
            with open(recipes_json_path, 'r', encoding='utf-8') as f:
                recipes_list = json.load(f)
            for r in recipes_list:
                name_clean = r["recipe_name"].strip()
                if name_clean in recipe_lookup:
                    recipe_lookup[name_clean].update({
                        "description": r.get("description", ""),
                        "type": r.get("type", ""),
                        "tags": r.get("tags", [])
                    })
                else:
                    recipe_lookup[name_clean] = {
                        "calories": r["calories"],
                        "protein": r["protein_g"],
                        "carbs": r["carbs_g"],
                        "fat": r["fat_g"],
                        "description": r.get("description", ""),
                        "type": r.get("type", ""),
                        "tags": r.get("tags", [])
                    }
        except Exception as e:
            logger.error(f"Error reading recipes.json during model save: {e}")

    logger.info("Saving Meal Recommendation Classifier...")
    joblib.dump({
        'clf_breakfast': clf_breakfast,
        'clf_lunch': clf_lunch,
        'clf_dinner': clf_dinner,
        'features': meal_features,
        'le_gender': le_gender,
        'le_activity': le_activity,
        'le_preference': le_preference,
        'recipe_lookup': recipe_lookup
    }, 'meal_recommender.pkl')

    logger.info("Meal Recommender Model saved successfully!")
    return True

if __name__ == "__main__":
    train_health_risk_model()
    train_meal_recommender(augment=True)
