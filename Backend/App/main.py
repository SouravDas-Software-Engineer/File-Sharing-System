import os
import random
from pathlib import Path
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from contextlib import asynccontextmanager
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv, find_dotenv


from Routes.user import check_email_exists, update_user_password, create_user, authenticate_user
from Routes.files import send_password_reset_email, send_welcome_email

load_dotenv(find_dotenv())

# Fetch the variables
MONGO_URL = os.getenv("MONGO_URL")
DATABASE_NAME = os.getenv("DATABASE_NAME")
if not MONGO_URL or not DATABASE_NAME:
    raise ValueError("CRITICAL ERROR: Could not find MONGO_URL or DATABASE_NAME. Check your .env file location and contents.")

@asynccontextmanager
async def lifespan(app: FastAPI):
    app.mongodb_client = AsyncIOMotorClient(MONGO_URL)
    app.db = app.mongodb_client[DATABASE_NAME]
    yield
    app.mongodb_client.close()

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Pydantic Models for incoming data ---
class LoginRequest(BaseModel):
    email: str
    password: str


class RegisterRequest(BaseModel):
    email: str
    password: str

class EmailRequest(BaseModel):
    email: str

class VerifyRequest(BaseModel):
    email: str
    otp: str

class ResetRequest(BaseModel):
    email: str
    otp: str
    new_password: str

# Add the login route 
@app.post("/login")
async def login(request: LoginRequest):
    is_authenticated = await authenticate_user(app.db, request.email, request.password)
    
    if not is_authenticated:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # 2. Removed the add_task line so no email is sent on login
    
    return {"message": "Login successful", "status": "success"}
#added signup route


@app.post("/register")
# 1. Look right here at the end of this line:
async def register(request: RegisterRequest, background_tasks: BackgroundTasks):
    
    success = await create_user(app.db, request.email, request.password)
    
    if not success:
        raise HTTPException(status_code=400, detail="Email is already registered")
        
    # 2. Now the spelling matches exactly what is in the parentheses above
    background_tasks.add_task(send_welcome_email, request.email)
        
    return {"message": "User created successfully", "status": "success"}

# added forgot passord route
# Temporary storage for OTPs
otp_storage = {}

@app.post("/forgot-password")
async def forgot_password(request: EmailRequest, background_tasks: BackgroundTasks):
    is_registered = await check_email_exists(app.db, request.email)
    
    if not is_registered:
        raise HTTPException(status_code=404, detail="User not found")
        
    otp = str(random.randint(100000, 999999))
    otp_storage[request.email] = otp
    
    background_tasks.add_task(send_password_reset_email, request.email, otp)
    
    return {"message": "OTP sent successfully"}

@app.post("/verify-otp")
async def verify_otp(request: VerifyRequest):
    stored_otp = otp_storage.get(request.email)
    
    if not stored_otp or stored_otp != request.otp:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")
        
    # We keep the OTP in storage for the final reset step
    return {"message": "OTP verified successfully"}

@app.post("/reset-password")
async def reset_password(request: ResetRequest):
    stored_otp = otp_storage.get(request.email)
    
    if not stored_otp or stored_otp != request.otp:
        raise HTTPException(status_code=400, detail="Invalid session or OTP")
        
    success = await update_user_password(app.db, request.email, request.new_password)
    
    if not success:
        raise HTTPException(status_code=500, detail="Failed to update password")
        
    # Clean up the OTP so it cannot be reused
    del otp_storage[request.email]
    
    return {"message": "Password changed successfully"}