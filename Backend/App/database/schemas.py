def file_schema(file) -> dict:
    return {
        "id": str(file["_id"]),
        "file_name": file["file_name"],
        "file_size": file["file_size"],
        "file_type": file["file_type"],
        "uploaded_user": file["uploaded_user"],
        "upload_date": file["upload_date"],
        "file_path": file["file_path"],
        "access_permission": file["access_permission"],
        "download_count": file["download_count"]
    }


def files_schema(files) -> list:
    return [file_schema(file) for file in files]