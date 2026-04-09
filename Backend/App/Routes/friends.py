from datetime import datetime, timezone, timedelta
from bson import ObjectId

def _now():
    return datetime.now(timezone.utc)

async def search_user_by_username(db, username: str, current_email: str):
    """Find a user by username and check existing friendship status."""
    user = await db.users.find_one({"username": username})
    if not user:
        return None
    
    if user["email"] == current_email:
        return {"username": user["username"], "email": user["email"], "status": "self"}

    # Check friendship status
    friendship = await db.friendships.find_one({
        "$or": [
            {"user1": current_email, "user2": user["email"]},
            {"user1": user["email"], "user2": current_email}
        ]
    })
    
    status = "none"
    if friendship:
        if friendship["status"] == "accepted":
            status = "accepted"
        elif friendship["user1"] == current_email:
            status = "outgoing"
        else:
            status = "incoming"
            
    return {
        "username": user["username"],
        "email": user["email"],
        "profile_pic": user.get("profile_pic_url"),
        "status": status
    }

async def send_friend_request(db, from_email: str, target_username: str):
    target_user = await db.users.find_one({"username": target_username})
    if not target_user:
        return False, "User not found"
    
    to_email = target_user["email"]
    if from_email == to_email:
        return False, "Cannot add yourself"

    # Check if exists
    existing = await db.friendships.find_one({
        "$or": [
            {"user1": from_email, "user2": to_email},
            {"user1": to_email, "user2": from_email}
        ]
    })
    if existing:
        return False, "Relationship already exists"

    await db.friendships.insert_one({
        "user1": from_email,
        "user2": to_email,
        "status": "pending",
        "created_at": _now()
    })
    
    # Notify target
    from_user = await db.users.find_one({"email": from_email})
    from_name = from_user.get("username", "Someone")
    from Routes.user import log_notification
    await log_notification(db, to_email, "friend", "New Friend Request", f"{from_name} wants to be your friend!")
    
    return True, "Request sent"

async def respond_to_friend_request(db, current_email: str, sender_email: str, action: str):
    if action == "accept":
        result = await db.friendships.update_one(
            {"user1": sender_email, "user2": current_email, "status": "pending"},
            {"$set": {"status": "accepted", "accepted_at": _now()}}
        )
        if result.modified_count:
            # Notify sender
            curr_user = await db.users.find_one({"email": current_email})
            from Routes.user import log_notification
            await log_notification(db, sender_email, "friend", "Request Accepted", f"{curr_user['username']} accepted your friend request!")
        return result.modified_count > 0
    else:
        result = await db.friendships.delete_one(
            {"user1": sender_email, "user2": current_email, "status": "pending"}
        )
        return result.deleted_count > 0

async def get_user_friendships(db, email: str):
    cursor = db.friendships.find({
        "$or": [{"user1": email}, {"user2": email}]
    })
    
    friends = {"accepted": [], "incoming": [], "outgoing": []}
    async for f in cursor:
        other_email = f["user2"] if f["user1"] == email else f["user1"]
        other_user = await db.users.find_one({"email": other_email})
        if not other_user: continue
        
        # Online status logic
        last_active = other_user.get("last_active")
        is_online = False
        if last_active:
            if not last_active.tzinfo:
                last_active = last_active.replace(tzinfo=timezone.utc)
            is_online = (_now() - last_active) < timedelta(minutes=5)

        data = {
            "username": other_user.get("username"),
            "email": other_email,
            "profile_pic": other_user.get("profile_pic_url"),
            "online": is_online
        }
        
        if f["status"] == "accepted":
            friends["accepted"].append(data)
        elif f["user2"] == email: # Incoming pending
            friends["incoming"].append(data)
        else: # Outgoing pending
            friends["outgoing"].append(data)
            
    return friends
