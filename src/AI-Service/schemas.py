from pydantic import BaseModel, Field
from typing import List, Optional

class HealthDataInput(BaseModel):
    # Required clinical parameters
    elderly_id: int = Field(..., description="ID of the resident")
    age: int = Field(..., ge=18, le=120, description="Age in years")
    heart_rate: int = Field(..., ge=20, le=300, description="Heart rate in bpm")
    systolic_bp: int = Field(..., ge=50, le=300, description="Systolic BP in mmHg")
    diastolic_bp: int = Field(..., ge=30, le=200, description="Diastolic BP in mmHg")
    blood_sugar: int = Field(..., ge=20, le=700, description="Blood sugar mg/dL")
    body_temperature: float = Field(..., ge=30.0, le=115.0, description="Temp in °F or °C (Celsius supported via auto-normalization)")
    
    # Optional parameters with safe clinical defaults
    mobility_score: Optional[int] = Field(5, ge=1, le=10, description="1 (bedridden) to 10 (independent)")
    sleep_hours: Optional[float] = Field(7.0, ge=0.0, le=24.0, description="Hours slept")
    missed_medications: Optional[int] = Field(0, ge=0, le=10, description="Number of missed doses")
    meals_eaten_percent: Optional[int] = Field(100, ge=0, le=100, description="Percentage of meals eaten")
    mood_score: Optional[int] = Field(5, ge=1, le=10, description="1 (poor) to 10 (excellent)")
    oxygen_saturation: Optional[int] = Field(98, ge=20, le=100, description="Oxygen Saturation in %")
    respiratory_rate: Optional[int] = Field(16, ge=0, le=100, description="Respiratory Rate in breaths/min")
    water_intake_ml: Optional[int] = Field(1500, ge=0, le=10000, description="Daily water intake in ml")
    pain_level: Optional[int] = Field(0, ge=0, le=10, description="Pain score 0 (no pain) to 10 (worst pain)")
    
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
    calories: int = Field(..., ge=0)
    protein_g: int = Field(..., ge=0)
    carbs_g: int = Field(..., ge=0)
    fat_g: int = Field(..., ge=0)
    type: str

class DietRecommendationOutput(BaseModel):
    elderly_id: int
    meals: List[MealItem]
    dietitian_notes: str

class RecipeInput(BaseModel):
    recipe_name: str
    description: str
    calories: int = Field(..., ge=0)
    protein_g: int = Field(..., ge=0)
    carbs_g: int = Field(..., ge=0)
    fat_g: int = Field(..., ge=0)
    type: str = Field(..., description="breakfast, lunch, or dinner")
    tags: List[str] = Field(default=[])
