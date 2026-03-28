import os
import random
from pathlib import Path
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import BackgroundTasks, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
<<<<<<< HEAD
from pydantic import BaseModel

ENV_PATH = Path(__file__).with_name(".env")
load_dotenv(dotenv_path=ENV_PATH)
=======
from dotenv import load_dotenv, find_dotenv
#jeet
from Core.Security import hash_password, verify_password, create_access_token
from database.database import db
from Routes.user import router as user_router
>>>>>>> edcd18397dcf5280c842d36c1c6f655c6e059543

from Routes.files import send_password_reset_email, send_welcome_email
from Routes.user import (
    authenticate_user,
    check_email_exists,
    create_user,
    update_user_password,
)

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
app.include_router(user_router)

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
    username: str = None # Set to None by default so it's optional
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
    username = await authenticate_user(app.db, request.email, request.password)
    
    if not username:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    return {
        "message": "Login successful", 
        "status": "success",
        "username": username # Sending the username back
    }

#added signup route
@app.post("/register")
async def register(request: RegisterRequest, background_tasks: BackgroundTasks):
    # Pass the username to the database function
    success = await create_user(app.db, request.email, request.password, request.username)
    
    if not success:
        raise HTTPException(
            status_code=400, 
            detail="Email is already registered. Please login or use forgot password."
        )
        
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
        
   
    del otp_storage[request.email]
    
    return {"message": "Password changed successfully"}
