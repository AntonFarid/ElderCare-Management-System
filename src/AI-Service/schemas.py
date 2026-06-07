from pydantic import BaseModel
from typing import List, Optional

class HealthDataInput(BaseModel):
    elderly_id: int
    age: Optional[int] = 75
    heart_rate: Optional[int] = 75
    systolic_bp: Optional[int] = 120
    diastolic_bp: Optional[int] = 80
    blood_sugar: Optional[int] = 100
    body_temperature: Optional[float] = 98.6
    mobility_score: Optional[int] = 5  # 1 (bedridden) to 10 (fully independent)
    sleep_hours: Optional[float] = 7.0
    missed_medications: Optional[int] = 0
    meals_eaten_percent: Optional[int] = 100
    mood_score: Optional[int] = 5  # 1 (severely depressed) to 10 (excellent)
    
class PredictionOutput(BaseModel):
    elderly_id: int
    risk_level: str
    confidence_score: float
    recommendation: str
    
class FallDetectionInput(BaseModel):
    camera_id: str
    frame_data: str 
    # Optional bounding box coordinates for CV aspect ratio check
    x_min: Optional[float] = 100.0
    y_min: Optional[float] = 100.0
    x_max: Optional[float] = 200.0
    y_max: Optional[float] = 300.0

class FallDetectionOutput(BaseModel):
    fall_detected: bool
    confidence_score: float
    alert_message: str

class DietRecommendationInput(BaseModel):
    elderly_id: int
    age: int
    gender: Optional[str] = "Female"
    medical_conditions: Optional[str] = ""
    allergies: Optional[str] = ""
    dietary_restrictions: Optional[str] = ""
    avg_meals_eaten_percent: Optional[float] = 100.0
    recent_avg_blood_sugar: Optional[float] = 100.0
    recent_avg_systolic_bp: Optional[float] = 120.0
    # Optional weight and height for BMI calculation
    weight: Optional[float] = 70.0
    height: Optional[float] = 165.0

class MealItem(BaseModel):
    recipe_name: str
    description: str
    calories: int
    protein_g: int
    carbs_g: int
    fat_g: int
    type: str

class DietRecommendationOutput(BaseModel):
    elderly_id: int
    meals: List[MealItem]
    dietitian_notes: str
