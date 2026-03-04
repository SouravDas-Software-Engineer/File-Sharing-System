# Routes/user.py

async def check_email_exists(db, email: str) -> bool:
    user_document = await db.users.find_one({"email": email})
    return user_document is not None

async def update_user_password(db, email: str, new_password: str) -> bool:
    result = await db.users.update_one(
        {"email": email},
        {"$set": {"password": new_password}}
    )
    return result.modified_count > 0

# Add this new function
async def create_user(db, email: str, password: str) -> bool:
    existing_user = await db.users.find_one({"email": email})
    if existing_user:
        return False 
    
    user_data = {"email": email, "password": password}
    result = await db.users.insert_one(user_data)
    
    return result.inserted_id is not None

# Login
async def authenticate_user(db, email: str, password: str) -> bool:
    user_document = await db.users.find_one({"email": email})
    
    # If no user is found with that email
    if not user_document:
        return False
    # Check if the passwords match 
    # Note: In a real app, you would use a hashing library like passlib to verify this!
    return user_document.get("password") == password