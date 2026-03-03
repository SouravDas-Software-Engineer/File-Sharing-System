from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()

# Allow your frontend to communicate with this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_methods=["*"],
    allow_headers=["*"],
)

class LoginRequest(BaseModel):
    email: str
    password: str

@app.post("/login")
async def login(request: LoginRequest):
    # This is a placeholder for your actual database logic
    # In a real app, you would check request.email against MongoDB
    if request.email == "admin@example.com" and request.password == "password123":
        return {"message": "Login Successful", "status": "success"}
    
    raise HTTPException(status_code=401, detail="Invalid email or password")