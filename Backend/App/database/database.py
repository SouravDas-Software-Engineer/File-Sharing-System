# from pymongo import MongoClient
# import os
# # MongoDB connection
# MONGO_URL = os.getenv("MONGO_URL")

# client = MongoClient(MONGO_URL)

# # Database name
# db = client["file_sharing_app"]

<<<<<<< HEAD
# # Collections
# files_collection = db["files"]
# users_collection = db["users"]


from motor.motor_asyncio import AsyncIOMotorClient

MONGO_URL = "mongodb://localhost:27017"

client = AsyncIOMotorClient(MONGO_URL)

db = client.myapp
=======
# Collections
files_collection = db["files"]
users_collection = db["users"]
friendships_collection = db["friendships"]
>>>>>>> dev
