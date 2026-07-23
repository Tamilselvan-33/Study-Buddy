import uuid
from datetime import datetime
from flask import Blueprint, request
from database import get_db
from utils.validation import success_response, error_response, token_required

invite_bp = Blueprint("invitations", __name__, url_prefix="/api/invitations")


# ──────────────────────────────────────────────────────────────────────────────
# SEND INVITE
# POST /api/invitations
# Body: { groupId, inviteeId }
# ──────────────────────────────────────────────────────────────────────────────

@invite_bp.route("", methods=["POST"])
@token_required
def send_invite():
    """Group leader or member invites another user to a group."""
    db = get_db()
    user_id = request.user_id
    data = request.get_json() or {}

    group_id = data.get("groupId", "").strip()
    invitee_id = data.get("inviteeId", "").strip()

    if not group_id or not invitee_id:
        return error_response("VALIDATION_ERROR", "groupId and inviteeId are required.", status_code=400)

    if invitee_id == user_id:
        return error_response("VALIDATION_ERROR", "You cannot invite yourself.", status_code=400)

    # Verify group exists
    group = db.groups.find_one({"_id": group_id})
    if not group:
        return error_response("NOT_FOUND", "Group not found.", status_code=404)

    # Sender must be a member
    if not any(m["userId"] == user_id for m in group.get("members", [])):
        return error_response("FORBIDDEN", "Only group members can send invitations.", status_code=403)

    # Invitee must exist
    invitee = db.users.find_one({"_id": invitee_id})
    if not invitee:
        return error_response("NOT_FOUND", "The user you are inviting does not exist.", status_code=404)

    # Invitee must not already be a member
    if any(m["userId"] == invitee_id for m in group.get("members", [])):
        return error_response("CONFLICT", "This user is already a member of the group.", status_code=409)

    # No duplicate pending invite
    existing = db.invitations.find_one({
        "group_id": group_id,
        "invitee_id": invitee_id,
        "status": "pending"
    })
    if existing:
        return error_response("CONFLICT", "A pending invitation already exists for this user.", status_code=409)

    # Build invite record
    sender = db.users.find_one({"_id": user_id})
    sender_name = sender.get("profile", {}).get("name", sender.get("email", "Someone")) if sender else "Someone"

    invite_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()
    invite_doc = {
        "_id": invite_id,
        "group_id": group_id,
        "group_name": group.get("name", ""),
        "group_subject": group.get("subject", ""),
        "inviter_id": user_id,
        "inviter_name": sender_name,
        "invitee_id": invitee_id,
        "status": "pending",   # pending | accepted | declined
        "created_at": now,
    }
    db.invitations.insert_one(invite_doc)

    return success_response(
        data={"invitationId": invite_id},
        message=f"Invitation sent to {invitee.get('profile', {}).get('name', invitee.get('email'))}.",
        status_code=201
    )


# ──────────────────────────────────────────────────────────────────────────────
# GET MY INVITATIONS INBOX
# GET /api/invitations  (returns pending invites for current user)
# ──────────────────────────────────────────────────────────────────────────────

@invite_bp.route("", methods=["GET"])
@token_required
def list_invitations():
    """Return all invitations (pending + history) for the authenticated user."""
    db = get_db()
    user_id = request.user_id
    status_filter = request.args.get("status", "")  # pending / accepted / declined / (empty = all)

    query = {"invitee_id": user_id}
    if status_filter in ("pending", "accepted", "declined"):
        query["status"] = status_filter

    raw = list(db.invitations.find(query))
    raw.sort(key=lambda i: i.get("created_at", ""), reverse=True)

    result = [
        {
            "id": i["_id"],
            "groupId": i["group_id"],
            "groupName": i["group_name"],
            "groupSubject": i.get("group_subject", ""),
            "inviterName": i["inviter_name"],
            "status": i["status"],
            "createdAt": i["created_at"],
        }
        for i in raw
    ]
    return success_response(data={"invitations": result})


# ──────────────────────────────────────────────────────────────────────────────
# RESPOND TO INVITE
# PATCH /api/invitations/<invite_id>
# Body: { action: "accept" | "decline" }
# ──────────────────────────────────────────────────────────────────────────────

@invite_bp.route("/<invite_id>", methods=["PATCH"])
@token_required
def respond_to_invite(invite_id: str):
    """Accept or decline an invitation."""
    db = get_db()
    user_id = request.user_id

    invite = db.invitations.find_one({"_id": invite_id})
    if not invite:
        return error_response("NOT_FOUND", "Invitation not found.", status_code=404)
    if invite["invitee_id"] != user_id:
        return error_response("FORBIDDEN", "This invitation is not for you.", status_code=403)
    if invite["status"] != "pending":
        return error_response("CONFLICT", "This invitation has already been responded to.", status_code=409)

    data = request.get_json() or {}
    action = data.get("action", "").strip()
    if action not in ("accept", "decline"):
        return error_response("VALIDATION_ERROR", "action must be 'accept' or 'decline'.", status_code=400)

    new_status = "accepted" if action == "accept" else "declined"
    db.invitations.update_one({"_id": invite_id}, {"$set": {"status": new_status}})

    if action == "accept":
        group_id = invite["group_id"]
        group = db.groups.find_one({"_id": group_id})
        if not group:
            return error_response("NOT_FOUND", "The group no longer exists.", status_code=404)

        # Check not already member (race condition guard)
        if any(m["userId"] == user_id for m in group.get("members", [])):
            return success_response(message="You are already a member of this group.")

        # Check capacity
        if len(group.get("members", [])) >= group.get("max_members", 6):
            return error_response("CONFLICT", "The group is now at full capacity.", status_code=409)

        user = db.users.find_one({"_id": user_id})
        profile = user.get("profile", {}) if user else {}
        now = datetime.utcnow().isoformat()
        new_member = {
            "userId": user_id,
            "name": profile.get("name", user.get("email", "Unknown")) if user else "Unknown",
            "email": user.get("email", "") if user else "",
            "avatarUrl": profile.get("avatarUrl", f"https://api.dicebear.com/7.x/avataaars/svg?seed={user_id}"),
            "role": "Member",
            "joinedAt": now,
        }
        db.groups.update_one({"_id": group_id}, {"$push": {"members": new_member}})
        return success_response(message=f"You have joined {invite['group_name']}!")

    return success_response(message="Invitation declined.")


# ──────────────────────────────────────────────────────────────────────────────
# PENDING COUNT  (for navbar badge)
# GET /api/invitations/count
# ──────────────────────────────────────────────────────────────────────────────

@invite_bp.route("/count", methods=["GET"])
@token_required
def pending_count():
    """Return the count of pending invitations for the current user."""
    db = get_db()
    user_id = request.user_id
    count = db.invitations.count_documents({"invitee_id": user_id, "status": "pending"})
    return success_response(data={"count": count})
