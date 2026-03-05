from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime

# Request/Response Models
class UserRegisterRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=6)
    company_name: str
    organization_type: str
    cin_number: str
    gstin: str
    head_office_location: str

class UserLoginRequest(BaseModel):
    username: str
    password: str

class TokenResponse(BaseModel):
    access: str
    token_type: str = "bearer"
    user: dict

class UserResponse(BaseModel):
    username: str
    email: str
    company_name: str
    organization_type: str
    role: str = "admin"
    
class ProfileUpdateRequest(BaseModel):
    company_name: Optional[str] = None
    organization_type: Optional[str] = None
    cin_number: Optional[str] = None
    gstin: Optional[str] = None
    head_office_location: Optional[str] = None

class ProfileResponse(BaseModel):
    id: str = Field(alias="_id")
    username: str
    email: str
    company_name: str
    organization_type: str
    cin_number: str
    gstin: str
    head_office_location: str
    role: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        populate_by_name = True
