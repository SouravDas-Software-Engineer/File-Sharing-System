
from model import create_file, get_all_files

# Insert test file
create_file(
    "notes.pdf",
    "2MB",
    "pdf",
    "Ayan Paul",
    "/uploads/notes.pdf"
)

# Show all files
files = get_all_files()

for f in files:
    print(f)