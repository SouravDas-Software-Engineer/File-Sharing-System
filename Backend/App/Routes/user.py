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
async def authenticate_user(db, email: str, password: str) -> bool:
    user_document = await db.users.find_one({"email": email})
    
    if not user_document:
        return False
        
    if user_document.get("password") == password:
        # If this is an older user missing a username, give them one now
        if "username" not in user_document:
            new_username = f"User{random.randint(10000, 99999)}"
            await db.users.update_one(
                {"email": email}, 
                {"$set": {"username": new_username}}
            )
        return True
        
    return False