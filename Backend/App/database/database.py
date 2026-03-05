
from motor.motor_asyncio import AsyncIOMotorClient
#for loginpage api -start
MONGODB_URL = "mongodb://localhost:27017"  # Replace with your actual URL
client = AsyncIOMotorClient(MONGODB_URL)
db = client.auth_db
users_collection = db.get_collection("users")
#end

#hi