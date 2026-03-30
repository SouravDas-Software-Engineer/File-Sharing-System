import os
import uuid
import shutil
import random
from pathlib import Path
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, BackgroundTasks, File, UploadFile, Form, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorClient
from Core.Config import MONGO_URL, DATABASE_NAME

from Routes.user import (
    check_email_exists,
    update_user_password,
    create_user,
    authenticate_user,
    delete_user_account,
    update_user_profile,
    get_user_profile,
    save_user_file,
    get_user_files,
    log_user_event,
    get_user_events,
    get_user_activity_chart,
)
from Routes.files import (
    send_password_reset_email,
    send_welcome_email,
    send_password_change_confirmation,
    send_delete_account_otp,
)

# ─── Ensure upload directories exist ───────────────────────────────────────────
os.makedirs("uploads/profiles", exist_ok=True)
os.makedirs("uploads/files",    exist_ok=True)


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.mongodb_client = AsyncIOMotorClient(MONGO_URL)
    app.db = app.mongodb_client[DATABASE_NAME]
    
    # ─── Migration: Hash existing plaintext passwords ──────────────────────────
    from Core.Security import is_hashed, hash_password
    users_cursor = app.db.users.find({})
    async for user in users_cursor:
        pwd = user.get("password")
        if pwd and not is_hashed(pwd):
            hashed = hash_password(pwd)
            await app.db.users.update_one(
                {"_id": user["_id"]},
                {"$set": {"password": hashed}}
            )
            
    yield
    app.mongodb_client.close()


app = FastAPI(lifespan=lifespan)

# ─── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Serve uploaded files as static assets ─────────────────────────────────────
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")


# ─────────────────────────────────────────────────────────
# Pydantic Models
# ─────────────────────────────────────────────────────────
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
    username: str = None
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


# ─────────────────────────────────────────────────────────
# Auth routes
# ─────────────────────────────────────────────────────────

@app.post("/login")
async def login(request: LoginRequest):
    username = await authenticate_user(app.db, request.email, request.password)
    if not username:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    profile = await get_user_profile(app.db, request.email) or {}
    return {
        "message":          "Login successful",
        "status":           "success",
        "username":         username,
        "bio":              profile.get("bio", ""),
        "profile_pic_url":  profile.get("profile_pic_url", None),
        "joined_date":      profile.get("joined_date", ""),
        "total_files":      profile.get("total_files", 0),
        "files_sent":       profile.get("files_sent", 0),
        "files_received":   profile.get("files_received", 0),
        "storage_used_mb":  profile.get("storage_used_mb", 0.0),
    }


@app.post("/register")
async def register(request: RegisterRequest, background_tasks: BackgroundTasks):
    success = await create_user(app.db, request.email, request.password, request.username)
    if not success:
        raise HTTPException(status_code=400, detail="Email is already registered.")
    background_tasks.add_task(send_welcome_email, request.email)
    return {"message": "User created successfully", "status": "success"}


otp_storage = {}

@app.post("/forgot-password")
async def forgot_password(request: EmailRequest, background_tasks: BackgroundTasks):
    if not await check_email_exists(app.db, request.email):
        raise HTTPException(status_code=404, detail="User not found")
    otp = str(random.randint(100000, 999999))
    otp_storage[request.email] = otp
    background_tasks.add_task(send_password_reset_email, request.email, otp)
    return {"message": "OTP sent successfully"}


@app.post("/verify-otp")
async def verify_otp(request: VerifyRequest):
    if otp_storage.get(request.email) != request.otp:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")
    return {"message": "OTP verified successfully"}


@app.post("/reset-password")
async def reset_password(request: ResetRequest):
    if otp_storage.get(request.email) != request.otp:
        raise HTTPException(status_code=400, detail="Invalid session or OTP")
    if not await update_user_password(app.db, request.email, request.new_password):
        raise HTTPException(status_code=500, detail="Failed to update password")
    del otp_storage[request.email]
    return {"message": "Password changed successfully"}


@app.post("/change-password")
async def change_password(request: ChangePasswordRequest, background_tasks: BackgroundTasks):
    if not await authenticate_user(app.db, request.email, request.current_password):
        raise HTTPException(status_code=401, detail="Invalid current password")
    if not await update_user_password(app.db, request.email, request.new_password):
        raise HTTPException(status_code=500, detail="Failed to update password")
    background_tasks.add_task(send_password_change_confirmation, request.email)
    return {"message": "Password updated successfully"}


@app.post("/request-delete")
async def request_delete(request: DeleteAccountRequest, background_tasks: BackgroundTasks):
    if not await check_email_exists(app.db, request.email):
        raise HTTPException(status_code=404, detail="User not found")
    otp = str(random.randint(100000, 999999))
    otp_storage[f"delete_{request.email}"] = otp
    background_tasks.add_task(send_delete_account_otp, request.email, otp)
    return {"message": "OTP sent for account deletion"}


@app.post("/confirm-delete")
async def confirm_delete(request: ConfirmDeleteRequest):
    key = f"delete_{request.email}"
    if otp_storage.get(key) != request.otp:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")
    if not await delete_user_account(app.db, request.email):
        raise HTTPException(status_code=500, detail="Failed to delete account")
    del otp_storage[key]
    return {"message": "Account deleted successfully"}


# ─────────────────────────────────────────────────────────
# Profile routes
# ─────────────────────────────────────────────────────────

@app.get("/profile")
async def get_profile(email: str):
    profile = await get_user_profile(app.db, email)
    if not profile:
        raise HTTPException(status_code=404, detail="User not found")
    return profile


@app.post("/update-profile")
async def update_profile(
    email:       str        = Form(...),
    username:    str        = Form(...),
    bio:         str        = Form(""),
    profile_pic: UploadFile = File(None),
):
    pic_url = None
    if profile_pic and profile_pic.filename:
        safe_email = email.replace("@", "_").replace(".", "_")
        ext        = profile_pic.filename.rsplit(".", 1)[-1]
        file_path  = f"uploads/profiles/{safe_email}.{ext}"
        with open(file_path, "wb") as buf:
            shutil.copyfileobj(profile_pic.file, buf)
        pic_url = f"/{file_path}"

    if not await update_user_profile(app.db, email, username, bio, pic_url):
        raise HTTPException(status_code=500, detail="Failed to update profile")

    return {"message": "Profile updated", "username": username, "bio": bio, "profile_pic_url": pic_url}


# ─────────────────────────────────────────────────────────
# File routes
# ─────────────────────────────────────────────────────────

@app.post("/upload")
async def upload_files(
    email: str = Form(...),
    files: list[UploadFile] = File(...),
):
    """Upload one or more files for a user."""
    results = []
    for f in files:
        content   = await f.read()
        size_mb   = len(content) / (1024 * 1024)
        ext       = f.filename.rsplit(".", 1)[-1] if "." in f.filename else "bin"
        stored    = f"{uuid.uuid4().hex}.{ext}"
        file_path = f"uploads/files/{stored}"

        with open(file_path, "wb") as buf:
            buf.write(content)

        file_id = await save_user_file(
            app.db, email,
            original_name=f.filename,
            stored_name=stored,
            size_mb=size_mb,
            file_path=file_path,
        )
        results.append({"id": file_id, "name": f.filename, "size_mb": round(size_mb, 3)})

    return {"message": f"Uploaded {len(results)} file(s)", "files": results, "status": "success"}


@app.get("/files")
async def list_files(email: str):
    """Return all files for a user."""
    files = await get_user_files(app.db, email)
    return {"files": files, "total": len(files)}


@app.delete("/files/{file_id}")
async def delete_file(file_id: str, email: str = Query(...)):
    """Delete a file record (and the physical file if present)."""
    from bson import ObjectId
    try:
        oid = ObjectId(file_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid file id")

    doc = await app.db.user_files.find_one({"_id": oid, "email": email})
    if not doc:
        raise HTTPException(status_code=404, detail="File not found")

    # Remove physical file
    try:
        os.remove(doc["file_path"])
    except FileNotFoundError:
        pass

    await app.db.user_files.delete_one({"_id": oid})
    await app.db.users.update_one(
        {"email": email},
        {"$inc": {"total_files": -1, "storage_used_mb": -doc.get("size_mb", 0)}}
    )
    await log_user_event(
        app.db, email, "delete",
        f"Deleted {doc.get('original_name', 'file')}",
        "File permanently removed",
        file_name=doc.get("original_name", "")
    )
    return {"message": "File deleted"}


@app.post("/track/{event_type}/{file_id}")
async def track_event(event_type: str, file_id: str, email: str = Query(None)):
    """Track share or download events to increment user file statistics."""
    from bson import ObjectId
    try:
        oid = ObjectId(file_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid file id")
        
    doc = await app.db.user_files.find_one({"_id": oid})
    if not doc:
        raise HTTPException(status_code=404, detail="File not found")
        
    file_name = doc.get("original_name", "a file")
    owner_email = doc.get("email")
    
    if event_type == "share":
        if email:
            await app.db.users.update_one({"email": email}, {"$inc": {"files_sent": 1}})
            await log_user_event(app.db, email, "share", f"Shared {file_name}", "Generated share link", file_name=file_name)
    elif event_type == "download":
        await app.db.user_files.update_one({"_id": oid}, {"$inc": {"download_count": 1}})
        
        if email:
            await app.db.users.update_one({"email": email}, {"$inc": {"files_received": 1}})
            await log_user_event(app.db, email, "download", f"Downloaded {file_name}", "File saved to device", file_name=file_name)
            
        # Send a notification to the file OWNER if someone else (or anonymous) downloaded it
        if owner_email and owner_email != email:
            from Routes.user import log_notification
            downloader = "A user" if email else "Someone"
            await log_notification(app.db, owner_email, "download", "File Downloaded", f"{downloader} downloaded '{file_name}'")
    else:
        raise HTTPException(status_code=400, detail="Invalid event type: must be share or download")
        
    return {"message": "Event tracked"}


# ─────────────────────────────────────────────────────────
# Activity and Notification routes
# ─────────────────────────────────────────────────────────

@app.get("/public/file/{file_id}")
async def get_public_file(file_id: str):
    """Get file metadata for the public download page."""
    from bson import ObjectId
    try:
        oid = ObjectId(file_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid file id")
        
    doc = await app.db.user_files.find_one({"_id": oid})
    if not doc:
        raise HTTPException(status_code=404, detail="File not found")
        
    owner_email = doc.get("email")
    owner_username = "Unknown User"
    if owner_email:
        owner_doc = await app.db.users.find_one({"email": owner_email})
        if owner_doc:
            owner_username = owner_doc.get("username", "Unknown User")
            
    return {
        "filename": doc.get("original_name", "Unknown File"),
        "size_mb": doc.get("size_mb", 0.0),
        "type": doc.get("file_type", "file"),
        "uploaded_at": doc.get("uploaded_at").strftime("%B %d, %Y") if doc.get("uploaded_at") else "",
        "uploader": owner_username
    }


@app.get("/notifications")
async def get_notifications(email: str = Query(...)):
    """Fetch unread notifications for a user."""
    from Routes.user import format_time_ago
    cursor = app.db.notifications.find({"email": email, "is_read": False}).sort("timestamp", -1).limit(20)
    notifs = []
    async for n in cursor:
        notifs.append({
            "id": str(n["_id"]),
            "type": n.get("type", "system"),
            "title": n.get("title", ""),
            "message": n.get("message", ""),
            "time": format_time_ago(n.get("timestamp"))
        })
    return {"notifications": notifs}


@app.put("/notifications/read")
async def mark_notifications_read(email: str = Query(...)):
    """Mark all unread notifications as read."""
    await app.db.notifications.update_many(
        {"email": email, "is_read": False},
        {"$set": {"is_read": True}}
    )
    return {"message": "Notifications cleared"}


@app.get("/activity")
async def get_activity(email: str):
    """Returns recent event feed + 7-day chart data."""
    events = await get_user_events(app.db, email, limit=20)
    chart  = await get_user_activity_chart(app.db, email)
    return {"events": events, "chart": chart}