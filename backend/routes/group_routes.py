import uuid
from datetime import datetime
from flask import Blueprint, request
from database import get_db
from utils.validation import success_response, error_response, token_required

group_bp = Blueprint("groups", __name__, url_prefix="/api/groups")


def _serialize_group(group: dict) -> dict:
    """Return a clean group dict safe for JSON serialization."""
    return {
        "id": group.get("_id"),
        "name": group.get("name", ""),
        "description": group.get("description", ""),
        "subject": group.get("subject", ""),
        "leaderId": group.get("leader_id", ""),
        "maxMembers": group.get("max_members", 6),
        "members": group.get("members", []),
        "isTemporary": group.get("is_temporary", False),
        "meetingTime": group.get("meeting_time"),
        "charter": group.get("charter"),
        "healthScore": group.get("health_score", 100),
        "createdAt": group.get("created_at", ""),
    }


# ──────────────────────────────────────────────────────────────────────────────
# GROUP CRUD
# ──────────────────────────────────────────────────────────────────────────────

@group_bp.route("", methods=["GET"])
@token_required
def list_groups():
    """Return all groups the authenticated user belongs to."""
    db = get_db()
    user_id = request.user_id

    raw_groups = list(db.groups.find({"members.userId": user_id}))
    groups = [_serialize_group(g) for g in raw_groups]

    return success_response(data={"groups": groups}, message=f"Found {len(groups)} group(s).")


@group_bp.route("/explore", methods=["GET"])
@token_required
def explore_groups():
    """Return public groups for discovery (limit 50)."""
    db = get_db()
    subject = request.args.get("subject", "").strip()
    query = {}
    if subject:
        query["subject"] = {"$regex": subject, "$options": "i"}

    raw_groups = list(db.groups.find(query))[:50]
    # Attach member count but hide internal data
    result = []
    for g in raw_groups:
        s = _serialize_group(g)
        s["memberCount"] = len(s["members"])
        result.append(s)

    return success_response(data={"groups": result})


@group_bp.route("", methods=["POST"])
@token_required
def create_group():
    """Create a new study group. The creator becomes Leader."""
    data = request.get_json() or {}
    name = data.get("name", "").strip()
    description = data.get("description", "").strip()
    subject = data.get("subject", "").strip()
    max_members = int(data.get("maxMembers", 6))
    is_temporary = bool(data.get("isTemporary", False))
    meeting_time = data.get("meetingTime", "").strip() or None
    charter = data.get("charter")  # {"objective": str, "expectations": [str]}

    if not name:
        return error_response("VALIDATION_ERROR", "Group name is required.", status_code=400)
    if not subject:
        return error_response("VALIDATION_ERROR", "Subject is required.", status_code=400)
    if max_members < 2 or max_members > 20:
        return error_response("VALIDATION_ERROR", "maxMembers must be between 2 and 20.", status_code=400)

    db = get_db()
    user_id = request.user_id

    # Fetch creator profile for member record
    creator = db.users.find_one({"_id": user_id})
    if not creator:
        return error_response("NOT_FOUND", "User not found.", status_code=404)

    creator_profile = creator.get("profile", {})
    group_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()

    member_record = {
        "userId": user_id,
        "name": creator_profile.get("name", creator.get("email", "Unknown")),
        "email": creator.get("email", ""),
        "avatarUrl": creator_profile.get(
            "avatarUrl",
            f"https://api.dicebear.com/7.x/avataaars/svg?seed={user_id}"
        ),
        "role": "Leader",
        "joinedAt": now,
    }

    new_group = {
        "_id": group_id,
        "name": name,
        "description": description,
        "subject": subject,
        "leader_id": user_id,
        "max_members": max_members,
        "members": [member_record],
        "is_temporary": is_temporary,
        "meeting_time": meeting_time,
        "charter": charter,
        "health_score": 100,
        "created_at": now,
    }

    db.groups.insert_one(new_group)
    return success_response(
        data={"group": _serialize_group(new_group)},
        message="Study group created successfully.",
        status_code=201
    )


@group_bp.route("/<group_id>", methods=["GET"])
@token_required
def get_group(group_id: str):
    db = get_db()
    group = db.groups.find_one({"_id": group_id})
    if not group:
        return error_response("NOT_FOUND", "Group not found.", status_code=404)

    return success_response(data={"group": _serialize_group(group)})


@group_bp.route("/<group_id>", methods=["PUT"])
@token_required
def update_group(group_id: str):
    """Update group metadata. Only the leader may do this."""
    db = get_db()
    user_id = request.user_id
    group = db.groups.find_one({"_id": group_id})

    if not group:
        return error_response("NOT_FOUND", "Group not found.", status_code=404)
    if group.get("leader_id") != user_id:
        return error_response("FORBIDDEN", "Only the group leader can update this group.", status_code=403)

    data = request.get_json() or {}
    allowed_fields = {
        "name": "name",
        "description": "description",
        "subject": "subject",
        "maxMembers": "max_members",
        "meetingTime": "meeting_time",
        "charter": "charter",
        "isTemporary": "is_temporary",
    }

    updates: dict = {}
    for client_key, db_key in allowed_fields.items():
        if client_key in data:
            updates[db_key] = data[client_key]

    if not updates:
        return error_response("VALIDATION_ERROR", "No valid fields provided for update.", status_code=400)

    db.groups.update_one({"_id": group_id}, {"$set": updates})
    updated = db.groups.find_one({"_id": group_id})
    return success_response(data={"group": _serialize_group(updated)}, message="Group updated successfully.")


@group_bp.route("/<group_id>", methods=["DELETE"])
@token_required
def delete_group(group_id: str):
    """Delete a group and all associated data. Leader only."""
    db = get_db()
    user_id = request.user_id
    group = db.groups.find_one({"_id": group_id})

    if not group:
        return error_response("NOT_FOUND", "Group not found.", status_code=404)
    if group.get("leader_id") != user_id:
        return error_response("FORBIDDEN", "Only the group leader can delete this group.", status_code=403)

    db.groups.delete_one({"_id": group_id})
    # Cascade delete sub-collections
    db.group_tasks.delete_many({"group_id": group_id})
    db.group_resources.delete_many({"group_id": group_id})
    db.group_messages.delete_many({"group_id": group_id})

    return success_response(message="Group and all associated data deleted successfully.")


# ──────────────────────────────────────────────────────────────────────────────
# MEMBERSHIP
# ──────────────────────────────────────────────────────────────────────────────

@group_bp.route("/<group_id>/join", methods=["POST"])
@token_required
def join_group(group_id: str):
    db = get_db()
    user_id = request.user_id
    group = db.groups.find_one({"_id": group_id})

    if not group:
        return error_response("NOT_FOUND", "Group not found.", status_code=404)

    members = group.get("members", [])
    if any(m["userId"] == user_id for m in members):
        return error_response("CONFLICT", "You are already a member of this group.", status_code=409)
    if len(members) >= group.get("max_members", 6):
        return error_response("CONFLICT", "This group is at full capacity.", status_code=409)

    user = db.users.find_one({"_id": user_id})
    if not user:
        return error_response("NOT_FOUND", "User not found.", status_code=404)

    profile = user.get("profile", {})
    now = datetime.utcnow().isoformat()
    new_member = {
        "userId": user_id,
        "name": profile.get("name", user.get("email", "Unknown")),
        "email": user.get("email", ""),
        "avatarUrl": profile.get(
            "avatarUrl",
            f"https://api.dicebear.com/7.x/avataaars/svg?seed={user_id}"
        ),
        "role": "Member",
        "joinedAt": now,
    }

    db.groups.update_one({"_id": group_id}, {"$push": {"members": new_member}})
    return success_response(data={"member": new_member}, message="Successfully joined the group.", status_code=201)


@group_bp.route("/<group_id>/leave", methods=["POST"])
@token_required
def leave_group(group_id: str):
    db = get_db()
    user_id = request.user_id
    group = db.groups.find_one({"_id": group_id})

    if not group:
        return error_response("NOT_FOUND", "Group not found.", status_code=404)
    if group.get("leader_id") == user_id:
        return error_response(
            "CONFLICT",
            "As leader you must transfer leadership or delete the group before leaving.",
            status_code=409
        )

    db.groups.update_one({"_id": group_id}, {"$pull": {"members": {"userId": user_id}}})
    return success_response(message="You have left the group.")


@group_bp.route("/<group_id>/members/<member_id>", methods=["DELETE"])
@token_required
def remove_member(group_id: str, member_id: str):
    """Leader kicks a member from the group."""
    db = get_db()
    user_id = request.user_id
    group = db.groups.find_one({"_id": group_id})

    if not group:
        return error_response("NOT_FOUND", "Group not found.", status_code=404)
    if group.get("leader_id") != user_id:
        return error_response("FORBIDDEN", "Only the leader can remove members.", status_code=403)
    if member_id == user_id:
        return error_response("CONFLICT", "The leader cannot remove themselves.", status_code=409)

    db.groups.update_one({"_id": group_id}, {"$pull": {"members": {"userId": member_id}}})
    return success_response(message="Member removed from group.")


# ──────────────────────────────────────────────────────────────────────────────
# TASKS
# ──────────────────────────────────────────────────────────────────────────────

@group_bp.route("/<group_id>/tasks", methods=["GET"])
@token_required
def list_tasks(group_id: str):
    db = get_db()
    # Verify membership
    group = db.groups.find_one({"_id": group_id})
    if not group:
        return error_response("NOT_FOUND", "Group not found.", status_code=404)

    tasks = list(db.group_tasks.find({"group_id": group_id}))
    result = [
        {
            "id": t["_id"],
            "groupId": t["group_id"],
            "title": t["title"],
            "assignedTo": t.get("assigned_to"),
            "dueDate": t.get("due_date"),
            "completed": t.get("completed", False),
            "createdAt": t.get("created_at", ""),
        }
        for t in tasks
    ]
    return success_response(data={"tasks": result})


@group_bp.route("/<group_id>/tasks", methods=["POST"])
@token_required
def create_task(group_id: str):
    db = get_db()
    group = db.groups.find_one({"_id": group_id})
    if not group:
        return error_response("NOT_FOUND", "Group not found.", status_code=404)

    # Verify requester is a member
    user_id = request.user_id
    if not any(m["userId"] == user_id for m in group.get("members", [])):
        return error_response("FORBIDDEN", "You must be a group member to create tasks.", status_code=403)

    data = request.get_json() or {}
    title = data.get("title", "").strip()
    if not title:
        return error_response("VALIDATION_ERROR", "Task title is required.", status_code=400)

    task_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()
    new_task = {
        "_id": task_id,
        "group_id": group_id,
        "title": title,
        "assigned_to": data.get("assignedTo"),
        "due_date": data.get("dueDate"),
        "completed": False,
        "created_at": now,
    }
    db.group_tasks.insert_one(new_task)

    return success_response(
        data={
            "task": {
                "id": task_id,
                "groupId": group_id,
                "title": title,
                "assignedTo": new_task["assigned_to"],
                "dueDate": new_task["due_date"],
                "completed": False,
                "createdAt": now,
            }
        },
        message="Task created.",
        status_code=201
    )


@group_bp.route("/<group_id>/tasks/<task_id>", methods=["PATCH"])
@token_required
def update_task(group_id: str, task_id: str):
    db = get_db()
    task = db.group_tasks.find_one({"_id": task_id, "group_id": group_id})
    if not task:
        return error_response("NOT_FOUND", "Task not found.", status_code=404)

    data = request.get_json() or {}
    updates: dict = {}
    if "completed" in data:
        updates["completed"] = bool(data["completed"])
    if "title" in data and data["title"].strip():
        updates["title"] = data["title"].strip()
    if "dueDate" in data:
        updates["due_date"] = data["dueDate"]
    if "assignedTo" in data:
        updates["assigned_to"] = data["assignedTo"]

    if updates:
        db.group_tasks.update_one({"_id": task_id}, {"$set": updates})

    updated = db.group_tasks.find_one({"_id": task_id})
    return success_response(
        data={
            "task": {
                "id": updated["_id"],
                "groupId": updated["group_id"],
                "title": updated["title"],
                "assignedTo": updated.get("assigned_to"),
                "dueDate": updated.get("due_date"),
                "completed": updated.get("completed", False),
                "createdAt": updated.get("created_at", ""),
            }
        },
        message="Task updated."
    )


@group_bp.route("/<group_id>/tasks/<task_id>", methods=["DELETE"])
@token_required
def delete_task(group_id: str, task_id: str):
    db = get_db()
    task = db.group_tasks.find_one({"_id": task_id, "group_id": group_id})
    if not task:
        return error_response("NOT_FOUND", "Task not found.", status_code=404)

    db.group_tasks.delete_one({"_id": task_id})
    return success_response(message="Task deleted.")


# ──────────────────────────────────────────────────────────────────────────────
# RESOURCES
# ──────────────────────────────────────────────────────────────────────────────

@group_bp.route("/<group_id>/resources", methods=["GET"])
@token_required
def list_resources(group_id: str):
    db = get_db()
    group = db.groups.find_one({"_id": group_id})
    if not group:
        return error_response("NOT_FOUND", "Group not found.", status_code=404)

    resources = list(db.group_resources.find({"group_id": group_id}))
    result = [
        {
            "id": r["_id"],
            "groupId": r["group_id"],
            "title": r["title"],
            "url": r["url"],
            "category": r.get("category", "General"),
            "sharedBy": r.get("shared_by", ""),
            "createdAt": r.get("created_at", ""),
        }
        for r in resources
    ]
    return success_response(data={"resources": result})


@group_bp.route("/<group_id>/resources", methods=["POST"])
@token_required
def create_resource(group_id: str):
    db = get_db()
    group = db.groups.find_one({"_id": group_id})
    if not group:
        return error_response("NOT_FOUND", "Group not found.", status_code=404)

    user_id = request.user_id
    if not any(m["userId"] == user_id for m in group.get("members", [])):
        return error_response("FORBIDDEN", "You must be a group member to share resources.", status_code=403)

    data = request.get_json() or {}
    title = data.get("title", "").strip()
    url = data.get("url", "").strip()
    category = data.get("category", "General").strip()

    if not title:
        return error_response("VALIDATION_ERROR", "Resource title is required.", status_code=400)
    if not url or not (url.startswith("http://") or url.startswith("https://")):
        return error_response("VALIDATION_ERROR", "A valid URL (http/https) is required.", status_code=400)

    # Get sharer name
    user = db.users.find_one({"_id": user_id})
    sharer_name = user.get("profile", {}).get("name", user.get("email", "Unknown")) if user else "Unknown"

    resource_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()
    new_resource = {
        "_id": resource_id,
        "group_id": group_id,
        "title": title,
        "url": url,
        "category": category,
        "shared_by": sharer_name,
        "created_at": now,
    }
    db.group_resources.insert_one(new_resource)

    return success_response(
        data={
            "resource": {
                "id": resource_id,
                "groupId": group_id,
                "title": title,
                "url": url,
                "category": category,
                "sharedBy": sharer_name,
                "createdAt": now,
            }
        },
        message="Resource shared successfully.",
        status_code=201
    )


@group_bp.route("/<group_id>/resources/<resource_id>", methods=["DELETE"])
@token_required
def delete_resource(group_id: str, resource_id: str):
    db = get_db()
    resource = db.group_resources.find_one({"_id": resource_id, "group_id": group_id})
    if not resource:
        return error_response("NOT_FOUND", "Resource not found.", status_code=404)

    db.group_resources.delete_one({"_id": resource_id})
    return success_response(message="Resource removed.")


# ──────────────────────────────────────────────────────────────────────────────
# MESSAGES (simple group chat – persisted, paginated)
# ──────────────────────────────────────────────────────────────────────────────

@group_bp.route("/<group_id>/messages", methods=["GET"])
@token_required
def list_messages(group_id: str):
    db = get_db()
    group = db.groups.find_one({"_id": group_id})
    if not group:
        return error_response("NOT_FOUND", "Group not found.", status_code=404)

    limit = min(int(request.args.get("limit", 50)), 200)
    messages = list(db.group_messages.find({"group_id": group_id}))
    # Sort by timestamp desc then return last N
    messages.sort(key=lambda m: m.get("timestamp", ""), reverse=False)
    messages = messages[-limit:]

    result = [
        {
            "id": m["_id"],
            "groupId": m["group_id"],
            "senderId": m["sender_id"],
            "senderName": m["sender_name"],
            "content": m["content"],
            "timestamp": m["timestamp"],
        }
        for m in messages
    ]
    return success_response(data={"messages": result})


@group_bp.route("/<group_id>/messages", methods=["POST"])
@token_required
def send_message(group_id: str):
    db = get_db()
    group = db.groups.find_one({"_id": group_id})
    if not group:
        return error_response("NOT_FOUND", "Group not found.", status_code=404)

    user_id = request.user_id
    if not any(m["userId"] == user_id for m in group.get("members", [])):
        return error_response("FORBIDDEN", "Only group members can send messages.", status_code=403)

    data = request.get_json() or {}
    content = data.get("content", "").strip()
    if not content:
        return error_response("VALIDATION_ERROR", "Message content cannot be empty.", status_code=400)
    if len(content) > 2000:
        return error_response("VALIDATION_ERROR", "Message exceeds 2000 character limit.", status_code=400)

    user = db.users.find_one({"_id": user_id})
    sender_name = user.get("profile", {}).get("name", user.get("email", "Unknown")) if user else "Unknown"

    msg_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()
    new_msg = {
        "_id": msg_id,
        "group_id": group_id,
        "sender_id": user_id,
        "sender_name": sender_name,
        "content": content,
        "timestamp": now,
    }
    db.group_messages.insert_one(new_msg)

    return success_response(
        data={
            "message": {
                "id": msg_id,
                "groupId": group_id,
                "senderId": user_id,
                "senderName": sender_name,
                "content": content,
                "timestamp": now,
            }
        },
        message="Message sent.",
        status_code=201
    )
