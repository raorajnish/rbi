from fastapi import APIRouter, HTTPException, Depends, status, Request
from motor.motor_asyncio import AsyncIOMotorDatabase
from database import get_database
from auth import decode_token
from services.rbi_service import process_new_notifications_for_user

router = APIRouter(prefix="/api/regulations", tags=["regulations"])

async def get_db() -> AsyncIOMotorDatabase:
    return get_database()

def extract_token(request: Request) -> str:
    """Extract Bearer token from Authorization header"""
    auth_header = request.headers.get("Authorization") or request.headers.get("authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    return auth_header.split(" ", 1)[1]

@router.get("/", response_model=dict)
async def get_regulations(http_request: Request, db: AsyncIOMotorDatabase = Depends(get_db)):
    """
    1. Authenticates user
    2. Runs the RBI crawler & Groq insights integration via rbi_service (fetches new ones)
    3. Returns all saved regulations (with AI insights) from MongoDB
    """
    token = extract_token(http_request)
    payload = decode_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )

    username = payload.get("username")
    users_collection = db.users

    user = await users_collection.find_one({"username": username}, {"password": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # This function triggers the crawler scripts, filters, hits Groq, and updates MongoDB
    updated_notifications = await process_new_notifications_for_user(user, db)

    return {
        "status": "success",
        "organization_type": user.get("organization_type"),
        "total_notifications": len(updated_notifications),
        "notifications": updated_notifications
    }
