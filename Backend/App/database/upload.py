from pymongo import MongoClient
import gridfs
import os

def upload_file_to_mongodb(file_path: str, uri: str = "mongodb+srv://souravdas4939733_db_user:pfSnPuASPJBOT25Z@cluster0.tjwjfef.mongodb.net/?appName=Cluster0", db_name: str ="file_sharing_db"):
    """
    Upload a file to MongoDB using GridFS.
    
    Args:
        file_path: Path to the file to upload
        uri: MongoDB connection URI
        db_name: Name of the database to use
    
    Returns:
        file_id: The ObjectId of the uploaded file
    """
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"File not found: {file_path}")

    client = MongoClient(uri)
    db = client[db_name]
    fs = gridfs.GridFS(db)

    file_name = os.path.basename(file_path)

    with open(file_path, "rb") as f:
        file_id = fs.put(f, filename=file_name)

    print(f"File '{file_name}' uploaded successfully!")
    print(f"File ID: {file_id}")

    client.close()
    return file_id


if __name__ == "__main__":
    file_id = upload_file_to_mongodb("example.txt")