
from model import create_file, get_all_files


create_file(
    "notes.pdf",
    "2MB",
    "pdf",
    "Ayan Paul",
    "/uploads/notes.pdf"
)


files = get_all_files()

for f in files:
    print(f)