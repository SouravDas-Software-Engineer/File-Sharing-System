# Routes/user.py
import random

async def check_email_exists(db, email: str) -> bool:
    user_document = await db.users.find_one({"email": email})
    return user_document is not None

async def update_user_password(db, email: str, new_password: str) -> bool:
    result = await db.users.update_one(
        {"email": email},
        {"$set": {"password": new_password}}
    )
    return result.modified_count > 0

# Updated to accept a username
async def create_user(db, email: str, password: str, username: str = None) -> bool:
    existing_user = await db.users.find_one({"email": email})
    if existing_user:
        return False 
    
    # If no username is provided, create a random default
    if not username:
        username = f"User{random.randint(10000, 99999)}"
        
    user_data = {"email": email, "password": password, "username": username}
    result = await db.users.insert_one(user_data)
    
    return result.inserted_id is not None

# Updated to patch older users with a random username
# In user.py - update the authenticate_user function
async def authenticate_user(db, email: str, password: str):
    user_document = await db.users.find_one({"email": email})
    
    if not user_document:
        return None
        
    if user_document.get("password") == password:
        if "username" not in user_document:
            new_username = f"User{random.randint(10000, 99999)}"
            await db.users.update_one(
                {"email": email}, 
                {"$set": {"username": new_username}}
            )
            return new_username
        return user_document.get("username")
        
    return None
<<<<<<< HEAD
=======

#jeet
from fastapi import APIRouter, HTTPException
from database.database import db
from Core.Security import hash_password, verify_password, create_access_token

router = APIRouter()

@router.post("/register")
async def register(email: str, password: str):

    user = await db.users.find_one({"email": email})

    if user:
        raise HTTPException(status_code=400, detail="User already exists")

    hashed_pass = hash_password(password)

    await db.users.insert_one({
        "email": email,
        "password": hashed_pass
    })

    return {"message": "User registered"}


@router.post("/login")
async def login(email: str, password: str):

    user = await db.users.find_one({"email": email})

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if verify_password(password, user["password"]):

        token = create_access_token({"sub": email})

        return {
            "message": "Login success",
            "token": token
        }

    raise HTTPException(status_code=401, detail="Wrong password")
>>>>>>> edcd18397dcf5280c842d36c1c6f655c6e059543
