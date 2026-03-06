from pymongo import MongoClient

# MongoDB connection
MONGO_URL = "mongodb://localhost:27017/"

client = MongoClient(MONGO_URL)

# Database name
db = client["file_sharing_app"]

# Collections
files_collection = db["files"]
users_collection = db["users"]