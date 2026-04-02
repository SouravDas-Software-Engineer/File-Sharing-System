from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import HTTPException, status

# JWT CONFIG (Real project e eita .env theke asa uchit)
SECRET_KEY = "supersecretkey" 
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# PASSWORD HASHING SETUP
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# 1. HASH PASSWORD (Register/Reset somoy use hobe)
def hash_password(password: str) -> str:
    return pwd_context.hash(password)

# 2. CHECK IF VALUE LOOKS LIKE A HASH
def is_password_hash(value: str) -> bool:
    return pwd_context.identify(value) is not None

# 3. VERIFY PASSWORD (Login somoy use hobe)
def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

# 4. VERIFY AND UPGRADE (Legacy plain passwords handle korar jonno)
async def verify_and_upgrade_password(db, email: str, plain_password: str, stored_password: str) -> bool:
    if is_password_hash(stored_password):
        if not verify_password(plain_password, stored_password):
            return False
        if pwd_context.needs_update(stored_password):
            new_hash = hash_password(plain_password)
            await db.users.update_one({"email": email}, {"$set": {"password": new_hash}})
        return True

    # Jodi plain text thake database e (Old users)
    if stored_password == plain_password:
        new_hash = hash_password(plain_password)
        await db.users.update_one({"email": email}, {"$set": {"password": new_hash}})
        return True
    return False

# 5. CREATE JWT TOKEN
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta if expires_delta else timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)