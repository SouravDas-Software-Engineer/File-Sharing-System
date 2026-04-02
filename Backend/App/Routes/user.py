# Routes/user.py
import random
# hash_password function ta import kore nin
from Core.Security import verify_and_upgrade_password, hash_password 

async def check_email_exists(db, email: str) -> bool:
    user_document = await db.users.find_one({"email": email})
    return user_document is not None

async def update_user_password(db, email: str, new_password: str) -> bool:
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
    
    if not user_document:
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
        
    return user_document.get("username")

async def delete_user_account(db, email: str) -> bool:
    result = await db.users.delete_one({"email": email})
    return result.deleted_count > 0

async def update_user_profile(db, email: str, username: str, bio: str, profile_pic_url: str = None) -> bool:
    update_data = {
        "username": username,
        "bio": bio
    }
    
    if profile_pic_url:
        update_data["profile_pic_url"] = profile_pic_url
        
    result = await db.users.update_one(
        {"email": email},
        {"$set": update_data}
    )
    return result.modified_count > 0 or result.matched_count > 0