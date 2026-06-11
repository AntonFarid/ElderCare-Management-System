import joblib
import pandas as pd
import numpy as np

# Load model data
model_ref = joblib.load("meal_recommender.pkl")
clf_breakfast = model_ref['clf_breakfast']
clf_lunch = model_ref['clf_lunch']
clf_dinner = model_ref['clf_dinner']
features = model_ref['features']

# Mock features for resident ID 4: Heart Disease, Hypertension, etc.
# age: 72, female, Heart Disease (has_heart_disease=1), Low Sodium (has_hypertension=1)
gender_encoded = model_ref['le_gender'].transform(["Male"])[0]
preference_encoded = model_ref['le_preference'].transform(["Omnivore"])[0]
activity_encoded = model_ref['le_activity'].transform(["Lightly Active"])[0]

input_features = {
    'Ages': 72,
    'gender_encoded': gender_encoded,
    'Height': 175.0,
    'Weight': 95.0,
    'activity_encoded': activity_encoded,
    'preference_encoded': preference_encoded,
    'has_diabetes': 0,
    'has_hypertension': 1, # low sodium diet
    'has_heart_disease': 1, # heart disease
    'has_kidney_disease': 0,
    'has_acne': 0,
    'has_weight_gain': 1,
    'has_weight_loss': 0
}

df_input = pd.DataFrame([input_features], columns=features)

def print_top_classes(clf, name):
    probs = clf.predict_proba(df_input)[0]
    class_probs = list(zip(clf.classes_, probs))
    class_probs.sort(key=lambda x: x[1], reverse=True)
    print(f"\n--- Top 5 probabilities for {name} ---")
    for rname, p in class_probs[:10]:
        print(f"  {rname}: {p:.4f}")

print_top_classes(clf_breakfast, "Breakfast")
print_top_classes(clf_lunch, "Lunch")
print_top_classes(clf_dinner, "Dinner")
