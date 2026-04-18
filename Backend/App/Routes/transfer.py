# Routes/transfer.py
import os
import uuid
import shutil
from datetime import datetime, timezone, timedelta


# ─── Constants ──────────────────────────────────────────────────────────────────
MAX_FILE_SIZE_MB = 100                      # Max single transfer: 100 MB
MAX_PENDING_QUOTA_MB = 500                  # Max total pending per sender: 500 MB
CHUNK_SIZE_MB = 5                           # Expected chunk size: 5 MB
TRANSFER_EXPIRY_DAYS = 2                    # Auto-delete unclaimed after 2 days
TRANSFERS_DIR = "uploads/transfers"


def _now():
    return datetime.now(timezone.utc)


# ─── Init Transfer ──────────────────────────────────────────────────────────────
async def init_transfer(
    db,
    sender_email: str,
    recipient_username: str,
    filename: str,
    file_size: int,
    total_chunks: int,
):
    """
    Initialize a new chunked file transfer.
    Returns (True, transfer_doc) on success or (False, error_message) on failure.
    """
    # Validate sender exists and is not guest
    sender = await db.users.find_one({"email": sender_email})
    if not sender:
        return False, "Sender not found"
    if sender.get("is_guest"):
        return False, "Guest users cannot send offline transfers. Use P2P instead."

    # Validate recipient exists by username
    recipient = await db.users.find_one({"username": recipient_username})
    if not recipient:
        return False, f"User '{recipient_username}' not found"
    if recipient.get("is_guest"):
        return False, "Cannot send to a guest user"
    if recipient["email"] == sender_email:
        return False, "Cannot send files to yourself"

    recipient_email = recipient["email"]

    # Check file size limit
    file_size_mb = file_size / (1024 * 1024)
    if file_size_mb > MAX_FILE_SIZE_MB:
        return False, f"File too large ({file_size_mb:.1f} MB). Maximum is {MAX_FILE_SIZE_MB} MB. Use P2P for larger files."

    # Check sender's pending quota
    pipeline = [
        {"$match": {"sender_email": sender_email, "status": {"$in": ["uploading", "pending"]}}},
        {"$group": {"_id": None, "total": {"$sum": "$file_size"}}},
    ]
    quota_result = await db.file_transfers.aggregate(pipeline).to_list(1)
    current_pending_mb = (quota_result[0]["total"] / (1024 * 1024)) if quota_result else 0

    if current_pending_mb + file_size_mb > MAX_PENDING_QUOTA_MB:
        return False, f"Pending transfer quota exceeded ({current_pending_mb:.0f}/{MAX_PENDING_QUOTA_MB} MB used). Wait for recipients to accept or decline."

    # Create transfer record
    transfer_id = uuid.uuid4().hex
    transfer_dir = os.path.join(TRANSFERS_DIR, transfer_id)
    os.makedirs(transfer_dir, exist_ok=True)

    doc = {
        "transfer_id": transfer_id,
        "sender_email": sender_email,
        "sender_username": sender.get("username", "Unknown"),
        "recipient_email": recipient_email,
        "recipient_username": recipient_username,
        "filename": filename,
        "file_size": file_size,
        "total_chunks": total_chunks,
        "chunks_received": 0,
        "status": "uploading",
        "transfer_dir": transfer_dir,
        "file_path": None,
        "created_at": _now(),
        "completed_at": None,
        "expires_at": _now() + timedelta(days=TRANSFER_EXPIRY_DAYS),
    }

    await db.file_transfers.insert_one(doc)
    return True, {"transfer_id": transfer_id, "total_chunks": total_chunks}


# ─── Save Chunk ─────────────────────────────────────────────────────────────────
async def save_chunk(db, transfer_id: str, sender_email: str, chunk_index: int, chunk_data: bytes):
    """
    Save a single chunk to disk.
    Returns (True, progress_info) or (False, error_message).
    """
    transfer = await db.file_transfers.find_one({
        "transfer_id": transfer_id,
        "sender_email": sender_email,
        "status": "uploading",
    })
    if not transfer:
        return False, "Transfer not found or not in uploading state"

    # Check for duplicate chunk
    chunk_path = os.path.join(transfer["transfer_dir"], f"chunk_{chunk_index}.part")
    if os.path.exists(chunk_path):
        return False, f"Chunk {chunk_index} already uploaded"

    # Save chunk to disk
    with open(chunk_path, "wb") as f:
        f.write(chunk_data)

    # Update chunk count
    await db.file_transfers.update_one(
        {"transfer_id": transfer_id},
        {"$inc": {"chunks_received": 1}},
    )

    updated = await db.file_transfers.find_one({"transfer_id": transfer_id})
    return True, {
        "chunk_index": chunk_index,
        "chunks_received": updated["chunks_received"],
        "total_chunks": updated["total_chunks"],
    }


# ─── Complete Transfer ──────────────────────────────────────────────────────────
async def complete_transfer(db, transfer_id: str, sender_email: str):
    """
    Reassemble chunks into the final file and mark transfer as pending.
    Returns (True, info) or (False, error_message).
    """
    transfer = await db.file_transfers.find_one({
        "transfer_id": transfer_id,
        "sender_email": sender_email,
        "status": "uploading",
    })
    if not transfer:
        return False, "Transfer not found or not in uploading state"

    # Verify all chunks received
    if transfer["chunks_received"] < transfer["total_chunks"]:
        return False, f"Missing chunks: received {transfer['chunks_received']}/{transfer['total_chunks']}"

    # Reassemble file
    transfer_dir = transfer["transfer_dir"]
    final_path = os.path.join(transfer_dir, transfer["filename"])

    with open(final_path, "wb") as outfile:
        for i in range(transfer["total_chunks"]):
            chunk_path = os.path.join(transfer_dir, f"chunk_{i}.part")
            if not os.path.exists(chunk_path):
                return False, f"Chunk {i} missing on disk"
            with open(chunk_path, "rb") as chunk_file:
                outfile.write(chunk_file.read())

    # Delete chunk files
    for i in range(transfer["total_chunks"]):
        chunk_path = os.path.join(transfer_dir, f"chunk_{i}.part")
        try:
            os.remove(chunk_path)
        except OSError:
            pass

    # Update transfer record
    await db.file_transfers.update_one(
        {"transfer_id": transfer_id},
        {"$set": {
            "status": "pending",
            "file_path": final_path,
            "completed_at": _now(),
        }},
    )

    # Notify recipient
    from Routes.user import log_notification, log_user_event
    sender_name = transfer.get("sender_username", "Someone")
    filename = transfer["filename"]
    size_mb = transfer["file_size"] / (1024 * 1024)
    size_str = f"{size_mb:.1f} MB" if size_mb >= 1 else f"{size_mb*1024:.0f} KB"

    await log_notification(
        db, transfer["recipient_email"], "transfer",
        "Incoming File",
        f"{sender_name} sent you '{filename}' ({size_str})"
    )

    # Log sender event
    await log_user_event(
        db, sender_email, "share",
        f"Sent {filename} to {transfer['recipient_username']}",
        f"{size_str} · Offline transfer",
        file_name=filename,
    )

    # Notify sender of successful send
    await log_notification(
        db, sender_email, "transfer",
        "File Sent Successfully",
        f"'{filename}' ({size_str}) sent to {transfer['recipient_username']}. Waiting for them to accept."
    )

    return True, {"message": "Transfer ready for recipient", "filename": filename}


# ─── Get Incoming Transfers ─────────────────────────────────────────────────────
async def get_incoming_transfers(db, recipient_email: str):
    """Return all pending transfers for this recipient."""
    cursor = db.file_transfers.find({
        "recipient_email": recipient_email,
        "status": "pending",
    }).sort("completed_at", -1)

    transfers = []
    async for t in cursor:
        size_mb = t["file_size"] / (1024 * 1024)
        size_str = f"{size_mb:.1f} MB" if size_mb >= 1 else f"{size_mb*1024:.0f} KB"

        from Routes.user import format_time_ago
        transfers.append({
            "id": t["transfer_id"],
            "sender_username": t.get("sender_username", "Unknown"),
            "filename": t["filename"],
            "file_size": t["file_size"],
            "size_str": size_str,
            "sent_at": format_time_ago(t.get("completed_at")),
            "expires_at": t.get("expires_at").isoformat() if t.get("expires_at") else None,
        })

    return transfers


# ─── Accept Transfer ────────────────────────────────────────────────────────────
async def accept_transfer(db, transfer_id: str, recipient_email: str):
    """
    Accept a transfer — returns file path for download.
    Returns (True, file_info) or (False, error_message).
    """
    transfer = await db.file_transfers.find_one({
        "transfer_id": transfer_id,
        "recipient_email": recipient_email,
        "status": "pending",
    })
    if not transfer:
        return False, "Transfer not found or already processed"

    file_path = transfer.get("file_path")
    if not file_path or not os.path.exists(file_path):
        # Mark as expired if file missing
        await db.file_transfers.update_one(
            {"transfer_id": transfer_id},
            {"$set": {"status": "expired"}},
        )
        return False, "File no longer available (expired)"

    # Mark as completed
    await db.file_transfers.update_one(
        {"transfer_id": transfer_id},
        {"$set": {"status": "completed", "accepted_at": _now()}},
    )

    # Update stats for both users
    await db.users.update_one(
        {"email": transfer["sender_email"]},
        {"$inc": {"files_sent": 1}},
    )
    await db.users.update_one(
        {"email": recipient_email},
        {"$inc": {"files_received": 1}},
    )

    # Log events
    from Routes.user import log_user_event, log_notification
    filename = transfer["filename"]
    recipient = await db.users.find_one({"email": recipient_email})
    recipient_name = recipient.get("username", "Someone") if recipient else "Someone"

    await log_user_event(
        db, recipient_email, "download",
        f"Received {filename}",
        f"From {transfer.get('sender_username', 'Unknown')} · Offline transfer",
        file_name=filename,
    )

    await log_notification(
        db, transfer["sender_email"], "transfer",
        "File Delivered",
        f"{recipient_name} accepted '{filename}'",
    )

    return True, {
        "file_path": file_path,
        "filename": filename,
        "file_size": transfer["file_size"],
    }


# ─── Decline Transfer ──────────────────────────────────────────────────────────
async def decline_transfer(db, transfer_id: str, recipient_email: str):
    """
    Decline a transfer — deletes the file.
    Returns (True, message) or (False, error_message).
    """
    transfer = await db.file_transfers.find_one({
        "transfer_id": transfer_id,
        "recipient_email": recipient_email,
        "status": "pending",
    })
    if not transfer:
        return False, "Transfer not found or already processed"

    # Delete file from disk
    transfer_dir = transfer.get("transfer_dir")
    if transfer_dir and os.path.exists(transfer_dir):
        shutil.rmtree(transfer_dir, ignore_errors=True)

    # Update status
    await db.file_transfers.update_one(
        {"transfer_id": transfer_id},
        {"$set": {"status": "declined"}},
    )

    # Notify sender
    from Routes.user import log_notification
    recipient = await db.users.find_one({"email": recipient_email})
    recipient_name = recipient.get("username", "Someone") if recipient else "Someone"

    await log_notification(
        db, transfer["sender_email"], "transfer",
        "Transfer Declined",
        f"{recipient_name} declined '{transfer['filename']}'",
    )

    return True, "Transfer declined"


# ─── Cleanup Expired Transfers ──────────────────────────────────────────────────
async def cleanup_expired_transfers(db):
    """Background task: delete transfers older than TRANSFER_EXPIRY_DAYS."""
    import asyncio

    while True:
        try:
            now = _now()
            expired_cursor = db.file_transfers.find({
                "status": {"$in": ["pending", "uploading"]},
                "expires_at": {"$lt": now},
            })

            deleted_count = 0
            async for transfer in expired_cursor:
                # Remove files from disk
                transfer_dir = transfer.get("transfer_dir")
                if transfer_dir and os.path.exists(transfer_dir):
                    shutil.rmtree(transfer_dir, ignore_errors=True)

                await db.file_transfers.update_one(
                    {"_id": transfer["_id"]},
                    {"$set": {"status": "expired"}},
                )
                deleted_count += 1

            if deleted_count > 0:
                print(f"[Transfer Cleanup] Expired {deleted_count} transfer(s).")

        except asyncio.CancelledError:
            break
        except Exception as e:
            print(f"[Transfer Cleanup] Error: {e}")

        await asyncio.sleep(3600)  # Check every hour
