import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.model_selection import train_test_split, cross_val_score, StratifiedKFold
from sklearn.preprocessing import LabelEncoder
from sklearn.impute import SimpleImputer
from sklearn.metrics import classification_report, accuracy_score, confusion_matrix, f1_score
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
dataset_path = "elderly_health_dataset_v2.xlsx"

# Check if dataset already exists to avoid regenerating it on every run
if not os.path.exists(dataset_path):
    logger.info(f"1. Generating a new health risk dataset with probabilistic labeling at {dataset_path}...")
    np.random.seed(42)
    num_records = 3000

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
        'mood_score': np.random.randint(3, 10, num_records)
    }

    df_health = pd.DataFrame(data)

    # Inject simulated emergency variations
    emergency_indices = np.random.choice(df_health.index, size=int(num_records * 0.15), replace=False)
    df_health.loc[emergency_indices, 'heart_rate'] = np.random.randint(110, 140, len(emergency_indices))
    df_health.loc[emergency_indices, 'systolic_bp'] = np.random.randint(160, 200, len(emergency_indices))
    df_health.loc[emergency_indices, 'missed_medications'] = np.random.randint(1, 4, len(emergency_indices))
    df_health.loc[emergency_indices, 'sleep_hours'] = np.random.uniform(2, 4, len(emergency_indices))

    # 2. Probabilistic Labeling function (Replacing Rule-Based Labeling)
    def generate_probabilistic_labels(df):
        # Calculate log-odds based on vital sign deviations
        # Heart rate: normal is 60-100 bpm. Deviations from 75 bpm are penalized.
        hr_dev = np.abs(df['heart_rate'] - 75) / 15.0
        
        # Blood pressure: normal is 120/80. Systolic > 130 or < 90 is risky.
        sbp_dev = np.maximum(0, df['systolic_bp'] - 130) / 20.0 + np.maximum(0, 90 - df['systolic_bp']) / 15.0
        dbp_dev = np.maximum(0, df['diastolic_bp'] - 80) / 10.0 + np.maximum(0, 60 - df['diastolic_bp']) / 10.0
        
        # Blood sugar: normal is 80-120. Deviations from 100 mg/dL.
        bs_dev = np.maximum(0, df['blood_sugar'] - 120) / 30.0 + np.maximum(0, 70 - df['blood_sugar']) / 15.0
        
        # Temperature: normal is 98.6°F. Deviations from 98.6°F.
        temp_dev = np.abs(df['body_temperature'] - 98.6) / 1.5
        
        # Vulnerability/Behavioral factors
        age_factor = (df['age'] - 65) / 30.0
        mobility_factor = (10 - df['mobility_score']) / 5.0
        sleep_factor = np.maximum(0, 7.0 - df['sleep_hours']) / 2.0
        med_factor = df['missed_medications'] * 0.8
        meals_factor = (100 - df['meals_eaten_percent']) / 50.0
        mood_factor = (10 - df['mood_score']) / 5.0
        
        # Combine linearly to get log-odds
        log_odds = (
            -3.2  # Baseline log-odds (represents low baseline risk)
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
        )
        
        # Sigmoid function for probability
        prob = 1 / (1 + np.exp(-log_odds))
        
        # Bernoulli trial (binomial with n=1) to assign High Risk label (1) or Low Risk (0)
        # This introduces realistic clinical noise into training
        return np.random.binomial(1, prob)

    df_health['is_high_risk'] = generate_probabilistic_labels(df_health)

    # Introduce random missing values (approx 3%) to show Imputer capability
    for col in ['heart_rate', 'systolic_bp', 'blood_sugar', 'body_temperature', 'sleep_hours']:
        mask = np.random.rand(num_records) < 0.03
        df_health.loc[mask, col] = np.nan

    df_health.to_excel(dataset_path, index=False)
    logger.info(f"Dataset generated with probabilistic labels and missing values at: {dataset_path}")
else:
    logger.info(f"Dataset already exists at {dataset_path}, loading from file...")
    df_health = pd.read_excel(dataset_path)

# 3. Handling Missing Values using SimpleImputer (strategy='median')
logger.info("2. Checking and handling missing values...")
logger.info(f"Missing values count before imputation:\n{df_health.isnull().sum()}")

health_features = [
    'age', 'heart_rate', 'systolic_bp', 'diastolic_bp', 'blood_sugar', 
    'body_temperature', 'mobility_score', 'sleep_hours', 'missed_medications', 
    'meals_eaten_percent', 'mood_score'
]

imputer = SimpleImputer(strategy='median')
df_health[health_features] = imputer.fit_transform(df_health[health_features])

logger.info(f"Missing values count after imputation:\n{df_health.isnull().sum()}")

# 4. Handling Outliers (Clean impossible readings, keep real medical extremes)
logger.info("3. Cleaning non-physical outliers...")
df_health['heart_rate'] = df_health['heart_rate'].clip(30, 220)
df_health['systolic_bp'] = df_health['systolic_bp'].clip(50, 250)
df_health['diastolic_bp'] = df_health['diastolic_bp'].clip(30, 150)
df_health['blood_sugar'] = df_health['blood_sugar'].clip(20, 600)
df_health['body_temperature'] = df_health['body_temperature'].clip(90.0, 110.0)

# 5. Stratified Splitting and Class Balance Check
logger.info("4. Checking class balance for target 'is_high_risk':")
logger.info(f"\n{df_health['is_high_risk'].value_counts()}")
logger.info(f"\n{df_health['is_high_risk'].value_counts(normalize=True)}")

X_health = df_health[health_features]
y_health = df_health['is_high_risk']

X_train_h, X_test_h, y_train_h, y_test_h = train_test_split(
    X_health, y_health, test_size=0.2, random_state=42, stratify=y_health
)

# 6. Model Training and Comparison using Cross Validation
logger.info("5. Training and comparing multiple ML models (Stratified 5-Fold CV)...")
models = {
    "Logistic Regression": LogisticRegression(class_weight='balanced', max_iter=1000, random_state=42),
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
    cv_scores = cross_val_score(model, X_train_h, y_train_h, cv=cv, scoring='f1')
    logger.info(f"  5-Fold CV F1-Score: {np.mean(cv_scores):.4f} (+/- {np.std(cv_scores):.4f})")
    
    # Train
    model.fit(X_train_h, y_train_h)
    preds = model.predict(X_test_h)
    
    # Evaluate
    test_f1 = f1_score(y_test_h, preds)
    test_acc = accuracy_score(y_test_h, preds)
    logger.info(f"  Test Accuracy: {test_acc:.4f}")
    logger.info(f"  Test F1-Score: {test_f1:.4f}")
    logger.info(f"  Confusion Matrix:\n{confusion_matrix(y_test_h, preds)}")
    logger.info(f"  Classification Report:\n{classification_report(y_test_h, preds, zero_division=0)}")
    
    # Select the model with best test F1-Score (focused on correctly identifying High Risk)
    if test_f1 > best_f1:
        best_f1 = test_f1
        best_model = model
        best_model_name = name

logger.info(f"Best Model Selected: {best_model_name} (Test F1: {best_f1:.4f})")

# 7. Feature Importance Extraction
logger.info(f"6. Extracting Feature Importances for {best_model_name}...")
feature_importances = {}
if hasattr(best_model, 'feature_importances_'):
    importances = best_model.feature_importances_
    for col, imp in zip(health_features, importances):
        feature_importances[col] = float(imp)
elif hasattr(best_model, 'coef_'):
    # Proxy importance for linear models using normalized coefficients
    coefs = np.abs(best_model.coef_[0])
    coefs_sum = np.sum(coefs)
    if coefs_sum > 0:
        coefs = coefs / coefs_sum
    for col, imp in zip(health_features, coefs):
        feature_importances[col] = float(imp)

# Sort and log
sorted_importances = sorted(feature_importances.items(), key=lambda x: x[1], reverse=True)
logger.info("Feature Importances:")
for col, val in sorted_importances:
    logger.info(f"  {col:<20}: {val * 100:.2f}%")

# Save feature importances to JSON file
with open("feature_importances.json", "w") as f:
    json.dump(feature_importances, f, indent=4)
logger.info("Feature importances exported to feature_importances.json")

# 8. Saving model artifacts
logger.info("7. Saving model artifacts to disk...")
joblib.dump(best_model, "health_risk_model.pkl")
joblib.dump(health_features, "model_features.pkl")
logger.info("Health risk model artifacts saved successfully!")

# =====================================================================
# PART 2: Meal Recommender Model Training
# =====================================================================
meals_csv_path = "detailed_meals_macros_CLEANED.csv"

if os.path.exists(meals_csv_path):
    logger.info(f"Loading meal dataset from {meals_csv_path}...")
    df_meals = pd.read_csv(meals_csv_path)
    logger.info(f"Loaded {len(df_meals)} rows for meal training.")

    # Clean missing values
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

    logger.info("Evaluating Breakfast Classifier...")
    X_train, X_test, y_train, y_test = train_test_split(X_meals, y_breakfast, test_size=0.2, random_state=42)
    clf_temp_b = RandomForestClassifier(n_estimators=100, max_depth=12, random_state=42)
    clf_temp_b.fit(X_train, y_train)
    preds_b = clf_temp_b.predict(X_test)
    logger.info(f"Breakfast Classifier Accuracy: {accuracy_score(y_test, preds_b):.4f}")
    logger.info(f"Breakfast Classifier Report:\n{classification_report(y_test, preds_b, zero_division=0)}")
    logger.info(f"Breakfast Classifier Confusion Matrix:\n{confusion_matrix(y_test, preds_b)}")
    logger.info("-" * 50)

    logger.info("Evaluating Lunch Classifier...")
    X_train, X_test, y_train, y_test = train_test_split(X_meals, y_lunch, test_size=0.2, random_state=42)
    clf_temp_l = RandomForestClassifier(n_estimators=100, max_depth=12, random_state=42)
    clf_temp_l.fit(X_train, y_train)
    preds_l = clf_temp_l.predict(X_test)
    logger.info(f"Lunch Classifier Accuracy: {accuracy_score(y_test, preds_l):.4f}")
    logger.info(f"Lunch Classifier Report:\n{classification_report(y_test, preds_l, zero_division=0)}")
    logger.info(f"Lunch Classifier Confusion Matrix:\n{confusion_matrix(y_test, preds_l)}")
    logger.info("-" * 50)

    logger.info("Evaluating Dinner Classifier...")
    X_train, X_test, y_train, y_test = train_test_split(X_meals, y_dinner, test_size=0.2, random_state=42)
    clf_temp_d = RandomForestClassifier(n_estimators=100, max_depth=12, random_state=42)
    clf_temp_d.fit(X_train, y_train)
    preds_d = clf_temp_d.predict(X_test)
    logger.info(f"Dinner Classifier Accuracy: {accuracy_score(y_test, preds_d):.4f}")
    logger.info(f"Dinner Classifier Report:\n{classification_report(y_test, preds_d, zero_division=0)}")
    logger.info(f"Dinner Classifier Confusion Matrix:\n{confusion_matrix(y_test, preds_d)}")
    logger.info("-" * 50)

    logger.info("Training Final Production Models (Hold-out validation split)...")
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

    def add_lookup_entries(df, name_col, cal_col, prot_col, carb_col, fat_col):
        grouped = df.groupby(name_col)[[cal_col, prot_col, carb_col, fat_col]].median()
        for name, row in grouped.iterrows():
            clean_name = str(name).strip()
            recipe_lookup[clean_name] = {
                "calories": int(row[cal_col]),
                "protein": int(row[prot_col]),
                "carbs": int(row[carb_col]),
                "fat": int(row[fat_col])
            }

    add_lookup_entries(df_meals, 'Breakfast Suggestion', 'Breakfast Calories', 'Breakfast Protein', 'Breakfast Carbohydrates', 'Breakfast Fats')
    add_lookup_entries(df_meals, 'Lunch Suggestion', 'Lunch Calories', 'Lunch Protein', 'Lunch Carbohydrates', 'Lunch Fats')
    add_lookup_entries(df_meals, 'Dinner Suggestion', 'Dinner Calories', 'Dinner Protein.1', 'Dinner Carbohydrates.1', 'Dinner Fats')

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
else:
    logger.warning(f"Meal dataset not found at {meals_csv_path}. Skipping meal recommender training.")
