
from database import files_collection
from datetime import datetime

def create_file(file_name, file_size, file_type, uploaded_user, file_path):

    file_data = {
        "file_name": file_name,
        "file_size": file_size,
        "file_type": file_type,
        "uploaded_user": uploaded_user,
        "upload_date": datetime.now(),
        "file_path": file_path,
        "access_permission": "private",
        "download_count": 0
    }

    result = files_collection.insert_one(file_data)

    return str(result.inserted_id)


def get_all_files():
    return list(files_collection.find())


def get_file_by_name(name):
    return files_collection.find_one({"file_name": name})


def increase_download_count(name):

    files_collection.update_one(
        {"file_name": name},
        {"$inc": {"download_count": 1}}
    )


def delete_file(name):

    files_collection.delete_one({"file_name": name})