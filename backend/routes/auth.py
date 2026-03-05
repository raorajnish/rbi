from fastapi import APIRouter, HTTPException, Depends, status, Request
from motor.motor_asyncio import AsyncIOMotorDatabase
from schemas import UserRegisterRequest, UserLoginRequest, TokenResponse, UserResponse
from auth import hash_password, verify_password, create_access_token, decode_token
from database import get_database
from bson import ObjectId
from datetime import datetime, timezone

router = APIRouter(prefix="/api/users", tags=["users"])

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


def serialize_user(user: dict) -> dict:
    """Convert MongoDB user doc to JSON-serializable dict"""
    user["_id"] = str(user["_id"])
    for field in ["created_at", "updated_at"]:
        if field in user and hasattr(user[field], "isoformat"):
            user[field] = user[field].isoformat()
    return user


@router.post("/register/", response_model=dict)
async def register(request: UserRegisterRequest, db: AsyncIOMotorDatabase = Depends(get_db)):
    """Register a new organization with user account"""

    users_collection = db.users

    existing_user = await users_collection.find_one({"username": request.username})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already exists"
        )

    existing_email = await users_collection.find_one({"email": request.email})
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    user_doc = {
        "username": request.username,
        "email": request.email,
        "password": hash_password(request.password),
        "company_name": request.company_name,
        "organization_type": request.organization_type,
        "cin_number": request.cin_number,
        "gstin": request.gstin,
        "head_office_location": request.head_office_location,
        "role": "admin",
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }

    result = await users_collection.insert_one(user_doc)

    return {
        "status": "success",
        "message": "Registration successful",
        "user_id": str(result.inserted_id)
    }


@router.post("/login/", response_model=TokenResponse)
async def login(request: UserLoginRequest, db: AsyncIOMotorDatabase = Depends(get_db)):
    """Login with username and password"""

    users_collection = db.users
    user = await users_collection.find_one({"username": request.username})

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )

    if not verify_password(request.password, user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )

    token_data = {
        "sub": user["username"],
        "username": user["username"],
        "email": user["email"],
        "company_name": user["company_name"],
        "role": user["role"]
    }

    access_token = create_access_token(data=token_data)

    return TokenResponse(
        access=access_token,
        user={
            "username": user["username"],
            "email": user["email"],
            "company_name": user["company_name"],
            "role": user["role"]
        }
    )


@router.get("/profile/", response_model=dict)
async def get_profile(http_request: Request, db: AsyncIOMotorDatabase = Depends(get_db)):
    """Get user profile — reads JWT from Authorization: Bearer <token> header"""

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
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    return serialize_user(user)


@router.put("/profile/", response_model=dict)
async def update_profile(http_request: Request, db: AsyncIOMotorDatabase = Depends(get_db)):
    """Update user profile — reads JWT from Authorization: Bearer <token> header"""

    token = extract_token(http_request)
    payload = decode_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )

    username = payload.get("username")
    users_collection = db.users

    request_body = await http_request.json()

    update_data = {"updated_at": datetime.now(timezone.utc)}

    allowed_fields = ["company_name", "organization_type", "cin_number", "gstin", "head_office_location"]
    for field in allowed_fields:
        if field in request_body and request_body[field]:
            update_data[field] = request_body[field]

    result = await users_collection.update_one(
        {"username": username},
        {"$set": update_data}
    )

    if result.matched_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    user = await users_collection.find_one({"username": username}, {"password": 0})
    return {
        "status": "success",
        "message": "Profile updated successfully",
        "user": serialize_user(user)
    }
