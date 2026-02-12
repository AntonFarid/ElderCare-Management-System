from google import genai
from fastapi import FastAPI
from pydantic import BaseModel

GOOGLE_API_KEY = "AIzaSyCngBXjEM1lVSd80zVxsKsDz5wod_8XIas"
client = genai.Client(api_key=GOOGLE_API_KEY)

app = FastAPI(title="ElderCare AI Service")

class HealthData(BaseModel):
    elderly_name: str
    age: int
    health_metrics: str
    daily_activities: str

@app.post("/generate-report")
async def generate_ai_report(data: HealthData):
    try:
        prompt = f"""
        أنت المساعد الذكي في نظام ElderCare. 
        مهمتك صياغة تقرير يومي دافئ ومهني للأهل بناءً على البيانات التالية:
        اسم المسن: {data.elderly_name}
        العمر: {data.age}
        المؤشرات الصحية: {data.health_metrics}
        الأنشطة اليومية: {data.daily_activities}
        
        اكتب التقرير بالعربية الفصحى ليعرض على الـ Team Leader للمراجعة والاعتماد.
        """

        response = client.models.generate_content(
            model="gemini-2.0-flash-lite",
            contents=prompt
        )

        return {
            "status": "success",
            "AI_GeneratedSummary": response.text,
            "RawData_JSON": data
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.get("/")
def check():
    return {"message": "AI Service is linked to ElderCare System!"}