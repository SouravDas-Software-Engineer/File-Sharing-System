
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr
from database.database import users_collection
#login api -start
app = FastAPI()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

class UserSchema(BaseModel):
    username: str
    email: EmailStr
    password: str

@app.post("/signup")
async def signup(user: UserSchema):
    # Check if user already exists
    existing_user = await users_collection.find_one({"username": user.username})
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    # Hash password and save
    user_dict = user.model_dump()
    user_dict["password"] = get_password_hash(user.password)
    await users_collection.insert_one(user_dict)
    return {"message": "User created successfully"}
#login api -end