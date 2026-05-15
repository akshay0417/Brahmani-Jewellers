from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel
from datetime import datetime
import os
from typing import List, Optional

app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB Connection (Placeholder - same env logic)
MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
client = AsyncIOMotorClient(MONGODB_URI, serverSelectionTimeoutMS=2000)
db = client.brahmani_jewellers

class Rate(BaseModel):
    gold22K: float
    gold24K: float
    silver: float
    lastUpdated: Optional[datetime] = None

class GalleryItem(BaseModel):
    imageUrl: str
    category: str

@app.get("/api/rates")
async def get_rates():
    try:
        rate = await db.rates.find_one(sort=[("lastUpdated", -1)])
        if rate:
            rate["_id"] = str(rate["_id"])
            return rate
    except Exception as e:
        print(f"MongoDB error: {e}")
    return {"gold22K": 62500, "gold24K": 68200, "silver": 740, "lastUpdated": datetime.now()}

@app.post("/api/rates")
async def update_rates(rate: Rate):
    try:
        rate_dict = rate.model_dump() if hasattr(rate, "model_dump") else rate.dict()
        rate_dict["lastUpdated"] = datetime.now()
        await db.rates.insert_one(rate_dict)
        return {"message": "Rates updated successfully"}
    except Exception as e:
        print(f"MongoDB error: {e}")
        return {"message": "Rates simulated update successfully (DB Offline)"}

@app.get("/api/gallery", response_model=List[GalleryItem])
async def get_gallery():
    items = []
    try:
        cursor = db.gallery.find().sort("createdAt", -1)
        async for document in cursor:
            items.append(GalleryItem(imageUrl=document["imageUrl"], category=document["category"]))
    except Exception as e:
        print(f"MongoDB error: {e}")
    
    # Fallback dummy data if empty or disconnected
    if not items:
        return [
            {"imageUrl": "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338", "category": "gold"},
            {"imageUrl": "https://images.unsplash.com/photo-1610660233042-498c4714659b", "category": "silver"},
        ]
    return items

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)
