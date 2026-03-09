from pymongo import MongoClient
import os
# MongoDB connection
MONGO_URL = os.getenv("MONGO_URL")

client = MongoClient(MONGO_URL)

# Database name
db = client["file_sharing_app"]

# Collections
files_collection = db["files"]
users_collection = db["users"]