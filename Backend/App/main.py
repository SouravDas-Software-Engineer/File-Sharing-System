import os
import random
import shutil
from contextlib import asynccontextmanager
from pathlib import Path

from dotenv import load_dotenv
from fastapi import BackgroundTasks, FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel

from Routes.files import (
    send_delete_account_otp,
    send_password_change_confirmation,
    send_password_reset_email,
    send_welcome_email,
)
from Routes.user import (
    authenticate_user,
    check_email_exists,
    create_user,
    delete_user_account,
    update_user_password,
    update_user_profile,
)

ENV_PATH = Path(__file__).with_name(".env")
load_dotenv(dotenv_path=ENV_PATH)

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

# Serve frontend assets so /Frontend/... paths resolve
# __file__ -> Backend/App/main.py, so go two levels up to project root
FRONTEND_DIR = Path(__file__).resolve().parents[2] / "Frontend"
if FRONTEND_DIR.exists():
    app.mount("/Frontend", StaticFiles(directory=FRONTEND_DIR, html=True), name="frontend")

# Health/root check
@app.get("/")
async def root():
    return {"message": "File Sharing API is running", "docs": "/docs", "redoc": "/redoc"}

# --- Pydantic Models for incoming data ---
class ChangePasswordRequest(BaseModel):
    email: str
    current_password: str
    new_password: str

class DeleteAccountRequest(BaseModel):
    email: str

class ConfirmDeleteRequest(BaseModel):
    email: str
    otp: str

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

# added signup route
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

# added forgot password route
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
@app.post("/change-password")
async def change_password(request: ChangePasswordRequest, background_tasks: BackgroundTasks):
    username = await authenticate_user(app.db, request.email, request.current_password)
    
    if not username:
        raise HTTPException(status_code=401, detail="Invalid current password")
        
    success = await update_user_password(app.db, request.email, request.new_password)
    
    if not success:
        raise HTTPException(status_code=500, detail="Failed to update password")
        
    background_tasks.add_task(send_password_change_confirmation, request.email)
    
    return {"message": "Password updated successfully"}

@app.post("/request-delete")
async def request_delete(request: DeleteAccountRequest, background_tasks: BackgroundTasks):
    is_registered = await check_email_exists(app.db, request.email)
    
    if not is_registered:
        raise HTTPException(status_code=404, detail="User not found")
        
    otp = str(random.randint(100000, 999999))
    # Using a prefix to separate it from password reset OTPs
    otp_storage[f"delete_{request.email}"] = otp
    
    background_tasks.add_task(send_delete_account_otp, request.email, otp)
    
    return {"message": "OTP sent for account deletion"}

@app.post("/confirm-delete")
async def confirm_delete(request: ConfirmDeleteRequest):
    storage_key = f"delete_{request.email}"
    stored_otp = otp_storage.get(storage_key)
    
    if not stored_otp or stored_otp != request.otp:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")
        
    success = await delete_user_account(app.db, request.email)
    
    if not success:
        raise HTTPException(status_code=500, detail="Failed to delete account")
        
    del otp_storage[storage_key]
    
    return {"message": "Account deleted successfully"}

os.makedirs("uploads/profiles", exist_ok=True)

@app.post("/update-profile")
async def update_profile(
    email: str = Form(...),
    username: str = Form(...),
    bio: str = Form(""),
    profile_pic: UploadFile = File(None)
):
    pic_url = None
    
    # Handle the image upload if one was provided
    if profile_pic and profile_pic.filename:
        # Create a safe filename using the email to prevent overwriting issues
        safe_email = email.replace("@", "_").replace(".", "_")
        file_extension = profile_pic.filename.split(".")[-1]
        file_path = f"uploads/profiles/{safe_email}.{file_extension}"
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(profile_pic.file, buffer)
            
        pic_url = f"/{file_path}" # This path can be served to the frontend later

    success = await update_user_profile(app.db, email, username, bio, pic_url)
    
    if not success:
        raise HTTPException(status_code=500, detail="Failed to update profile")
        
    return {
        "message": "Profile updated successfully", 
        "username": username,
        "bio": bio,
        "profile_pic_url": pic_url
    }
# main.py er upore import korun
from Core.Security import create_access_token

@app.post("/login")
async def login(request: LoginRequest):
    # authenticate_user ekhon username return korbe jodi pass match hoy
    username = await authenticate_user(app.db, request.email, request.password)
    
    if not username:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Token generate korun (Security-r jonno)
    access_token = create_access_token(data={"sub": request.email})
    
    return {
        "message": "Login successful", 
        "status": "success",
        "access_token": access_token,  # Frontend eita receive korbe
        "token_type": "bearer",
        "username": username
    }