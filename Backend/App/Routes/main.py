from fastapi import FastAPI, Depends, HTTPException 
from pydantic import BaseModel
app = FastAPI()

 #For login page -start
@app.get("/test/{userid}")
async def test(userid = str,query: int= 1):
    return {"user_is": userid}