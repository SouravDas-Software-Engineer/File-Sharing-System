import os
from dotenv import load_dotenv, find_dotenv

load_dotenv(find_dotenv())

MONGO_URL = os.getenv("MONGO_URL")
DATABASE_NAME = os.getenv("DATABASE_NAME")

if not MONGO_URL or not DATABASE_NAME:
    raise ValueError("CRITICAL: Could not find MONGO_URL or DATABASE_NAME in .env")
