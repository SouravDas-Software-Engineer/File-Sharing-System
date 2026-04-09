# Routes/user.py
import random
<<<<<<< HEAD
# hash_password function ta import kore nin
from Core.Security import verify_and_upgrade_password, hash_password 
=======
import uuid
from datetime import datetime, timezone, timedelta


# ─────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────

def _now() -> datetime:
    return datetime.now(timezone.utc)


def format_time_ago(dt: datetime) -> str:
    if not dt:
        return ""
    if not dt.tzinfo:
        dt = dt.replace(tzinfo=timezone.utc)
    diff = _now() - dt
    s = diff.total_seconds()
    if s < 60:
        return "Just now"
    if s < 3600:
        return f"{int(s/60)} min ago"
    if s < 86400:
        return f"{int(s/3600)} hr ago"
    if s < 172800:
        return "Yesterday"
    return f"{int(s/86400)} days ago"


def _get_file_type(filename: str) -> str:
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    mapping = {
        "pdf": "pdf", "doc": "doc", "docx": "doc", "txt": "text",
        "jpg": "image", "jpeg": "image", "png": "image", "gif": "image", "webp": "image",
        "mp4": "video", "mov": "video", "avi": "video", "mkv": "video",
        "mp3": "audio", "wav": "audio",
        "zip": "archive", "rar": "archive", "7z": "archive",
        "js": "code", "py": "code", "html": "code", "css": "code", "json": "code",
        "xls": "spreadsheet", "xlsx": "spreadsheet", "csv": "spreadsheet",
        "ppt": "slides", "pptx": "slides",
    }
    return mapping.get(ext, "file")


# ─────────────────────────────────────────────────────────
# User management
# ─────────────────────────────────────────────────────────
>>>>>>> dev

async def check_email_exists(db, email: str) -> bool:
    return await db.users.find_one({"email": email}) is not None


async def update_user_password(db, email: str, new_password: str) -> bool:
<<<<<<< HEAD
    # IMPORTANT: Password hash kore save korun
    hashed_pwd = hash_password(new_password)
    result = await db.users.update_one(
        {"email": email},
        {"$set": {"password": hashed_pwd}}
    )
    return result.modified_count > 0

async def create_user(db, email: str, password: str, username: str = None) -> bool:
    existing_user = await db.users.find_one({"email": email})
    if existing_user:
        return False 
    
    if not username:
        username = f"User{random.randint(10000, 99999)}"
    
    # IMPORTANT: Ekhanei password hash kore felun
    hashed_pwd = hash_password(password)
    
    user_data = {
        "email": email, 
        "password": hashed_pwd, # Plain password noy, hash save hobe
        "username": username
    }
    result = await db.users.insert_one(user_data)
    
    return result.inserted_id is not None

# authenticate_user function-ta thik ache, 
# karun eta apnar Core.Security er logic follow korche.
async def authenticate_user(db, email: str, password: str):
    user_document = await db.users.find_one({"email": email})
=======
    from Core.Security import hash_password
    hashed_password = hash_password(new_password)
    result = await db.users.update_one(
        {"email": email},
        {"$set": {"password": hashed_password}}
    )
    return result.modified_count > 0


async def create_user(db, email: str, password: str, username: str = None) -> bool | str:
    from Core.Security import hash_password
    if await db.users.find_one({"email": email}):
        return False
    if username and await db.users.find_one({"username": username}):
        return "Username already taken"
    if not username:
        username = f"User{random.randint(10000, 99999)}"
        
    hashed_password = hash_password(password)
    result = await db.users.insert_one({
        "email": email,
        "password": hashed_password,
        "username": username,
        "bio": "",
        "profile_pic_url": None,
        "joined_date": _now().strftime("%B %Y"),
        "total_files": 0,
        "files_sent": 0,
        "files_received": 0,
        "storage_used_mb": 0.0,
    })
    # Log signup event
    if result.inserted_id:
        await log_user_event(db, email, "login", "Account created", "Welcome to FileShare!")
    return result.inserted_id is not None

async def create_guest_user(db) -> dict:
    import uuid
    import random
>>>>>>> dev
    
    # Generate unique guest username
    while True:
        num = random.randint(10000, 99999)
        username = f"Guest_{num}"
        if not await db.users.find_one({"username": username}):
            break
            
    guest_email = f"guest_{uuid.uuid4().hex[:8]}@guest.local"
    
    doc = {
        "email": guest_email,
        "password": "", # No password for guests
        "username": username,
        "bio": "I am a guest user.",
        "profile_pic_url": None,
        "joined_date": _now().strftime("%B %Y"),
        "total_files": 0,
        "files_sent": 0,
        "files_received": 0,
        "storage_used_mb": 0.0,
        "is_guest": True,
        "last_active": _now()
    }
    await db.users.insert_one(doc)
    return doc


async def authenticate_user(db, email: str, password: str):
    from Core.Security import verify_password
    doc = await db.users.find_one({"email": email})
    if not doc:
        return None

    stored_password = user_document.get("password")
    if not stored_password:
        return None

    is_valid = await verify_and_upgrade_password(
        db, email, password, stored_password
    )
    
    if not is_valid:
        return None

    # Username patching logic
    if "username" not in user_document:
        new_username = f"User{random.randint(10000, 99999)}"
        await db.users.update_one(
            {"email": email},
            {"$set": {"username": new_username}}
        )
        return new_username
        
<<<<<<< HEAD
    return user_document.get("username")
=======
    db_password = doc.get("password")
    if not db_password or not verify_password(password, db_password):
        return None

    updates = {}
    if "username" not in doc:
        updates["username"] = f"User{random.randint(10000, 99999)}"
    if "joined_date" not in doc:
        updates["joined_date"] = _now().strftime("%B %Y")
    if updates:
        await db.users.update_one({"email": email}, {"$set": updates})

    # Log login event
    await log_user_event(db, email, "login", "Signed in", "New session started")
    # Update last_active
    await db.users.update_one({"email": email}, {"$set": {"last_active": _now()}})
    return doc.get("username") or updates.get("username")

>>>>>>> dev

async def delete_user_account(db, email: str) -> bool:
    result = await db.users.delete_one({"email": email})
    return result.deleted_count > 0

<<<<<<< HEAD
async def update_user_profile(db, email: str, username: str, bio: str, profile_pic_url: str = None) -> bool:
    update_data = {
        "username": username,
        "bio": bio
    }
    
=======

async def update_user_profile(
    db, email: str, username: str, bio: str, profile_pic_url: str = None
) -> bool | str:
    # Check if guest
    user = await db.users.find_one({"email": email})
    if not user:
        return False
    if user.get("is_guest") or "@guest.local" in email:
        return "Guests cannot modify their profile."

    # Check if username is taken by another user
    existing = await db.users.find_one({"username": username})
    if existing and existing["email"] != email:
        return "Username already taken"
        
    update_data = {"username": username, "bio": bio}
>>>>>>> dev
    if profile_pic_url:
        update_data["profile_pic_url"] = profile_pic_url
    result = await db.users.update_one({"email": email}, {"$set": update_data})
    if result.matched_count:
        await log_user_event(db, email, "system", "Profile updated", "Profile info was changed")
    return result.modified_count > 0 or result.matched_count > 0


async def get_user_profile(db, email: str) -> dict | None:
    doc = await db.users.find_one({"email": email})
    if not doc:
        return None
    if "joined_date" not in doc:
        joined = _now().strftime("%B %Y")
        await db.users.update_one({"email": email}, {"$set": {"joined_date": joined}})
        doc["joined_date"] = joined
    # Sync last_active on profile fetch
    await db.users.update_one({"email": email}, {"$set": {"last_active": _now()}})
    
    return {
        "username":        doc.get("username", ""),
        "email":           doc.get("email", ""),
        "bio":             doc.get("bio", ""),
        "profile_pic_url": doc.get("profile_pic_url", None),
        "joined_date":     doc.get("joined_date", ""),
        "total_files":     doc.get("total_files", 0),
        "files_sent":      doc.get("files_sent", 0),
        "files_received":  doc.get("files_received", 0),
        "storage_used_mb": doc.get("storage_used_mb", 0.0),
        "is_guest":        doc.get("is_guest", False),
    }


# ─────────────────────────────────────────────────────────
# File management
# ─────────────────────────────────────────────────────────

async def save_user_file(
    db, email: str, original_name: str, stored_name: str,
    size_mb: float, file_path: str
) -> str:
    """Inserts a file record and updates user stats. Returns the new file id."""
    file_type = _get_file_type(original_name)
    result = await db.user_files.insert_one({
        "email":         email,
        "original_name": original_name,
        "stored_name":   stored_name,
        "file_path":     file_path,
        "size_mb":       round(size_mb, 3),
        "file_type":     file_type,
        "uploaded_at":   _now(),
        "download_count": 0,
        "share_token":   None,
    })
    if result.inserted_id:
        await db.users.update_one(
            {"email": email},
            {"$inc": {"total_files": 1, "storage_used_mb": size_mb}}
        )
        size_str = f"{size_mb*1024:.0f} KB" if size_mb < 1 else f"{size_mb:.1f} MB"
        await log_user_event(
            db, email, "upload",
            f"Uploaded {original_name}",
            f"{size_str} · {file_type.capitalize()}",
            file_name=original_name
        )
    return str(result.inserted_id) if result.inserted_id else None


async def get_user_files(db, email: str) -> list:
    cursor = db.user_files.find({"email": email}).sort("uploaded_at", -1)
    files = []
    async for f in cursor:
        size_mb = f.get("size_mb", 0)
        size_str = f"{size_mb*1024:.0f} KB" if size_mb < 1 else f"{size_mb:.2f} MB"
        files.append({
            "id":             str(f["_id"]),
            "name":           f.get("original_name", ""),
            "size":           size_str,
            "size_mb":        size_mb,
            "type":           f.get("file_type", "file"),
            "uploaded_at":    f["uploaded_at"].strftime("%d %b %Y") if f.get("uploaded_at") else "",
            "download_count": f.get("download_count", 0),
            "share_token":    f.get("share_token"),
        })
    return files


# ─────────────────────────────────────────────────────────
# Event / Activity log
# ─────────────────────────────────────────────────────────

async def log_user_event(
    db, email: str,
    event_type: str,   # upload | share | download | login | delete | system
    title: str,
    description: str,
    file_name: str = ""
) -> None:
    await db.user_events.insert_one({
        "email":       email,
        "type":        event_type,
        "title":       title,
        "description": description,
        "file_name":   file_name,
        "timestamp":   _now(),
    })


async def log_notification(
    db, email: str, n_type: str, title: str, message: str
) -> None:
    await db.notifications.insert_one({
        "email":   email,
        "type":    n_type,
        "title":   title,
        "message": message,
        "is_read": False,
        "timestamp": _now(),
    })


async def get_user_events(db, email: str, limit: int = 20) -> list:
    cursor = db.user_events.find({"email": email}).sort("timestamp", -1).limit(limit)
    events = []
    async for e in cursor:
        events.append({
            "type":        e.get("type", "system"),
            "title":       e.get("title", ""),
            "description": e.get("description", ""),
            "file_name":   e.get("file_name", ""),
            "time":        format_time_ago(e.get("timestamp")),
        })
    return events


async def get_user_activity_chart(db, email: str) -> dict:
    """Returns 7-day send & receive counts (Sun→Sat) for the activity chart."""
    day_labels = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"]
    send_data    = {d: 0 for d in day_labels}
    receive_data = {d: 0 for d in day_labels}

    now = _now()
    for i in range(6, -1, -1):
        day = now - timedelta(days=i)
        day_start = day.replace(hour=0, minute=0, second=0, microsecond=0)
        day_end   = day.replace(hour=23, minute=59, second=59, microsecond=999999)
        key = day_labels[day.isoweekday() % 7]   # Mon=1→1, Sun=0→0

        send_data[key] = await db.user_events.count_documents({
            "email": email, "type": "share",
            "timestamp": {"$gte": day_start, "$lte": day_end}
        })
        receive_data[key] = await db.user_events.count_documents({
            "email": email, "type": "download",
            "timestamp": {"$gte": day_start, "$lte": day_end}
        })

    return {"days": day_labels, "send": send_data, "receive": receive_data}


async def clear_user_events(db, email: str) -> bool:
    """Delete all activity events for a user."""
    result = await db.user_events.delete_many({"email": email})
    return result.deleted_count >= 0