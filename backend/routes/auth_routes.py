import uuid
from datetime import datetime
from flask import Blueprint, request
from database import get_db
from utils.security import hash_password, verify_password, create_jwt_token
from utils.validation import success_response, error_response, token_required

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")

@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json() or {}
    email = data.get("email", "").strip().lower()
    password = data.get("password", "").strip()
    name = data.get("name", "").strip()

    if not email or "@" not in email:
        return error_response(code="VALIDATION_ERROR", message="Please provide a valid email address.", status_code=400)
    if not password or len(password) < 6:
        return error_response(code="VALIDATION_ERROR", message="Password must be at least 6 characters long.", status_code=400)
    if not name:
        return error_response(code="VALIDATION_ERROR", message="Name is required.", status_code=400)

    db = get_db()
    existing_user = db.users.find_one({"email": email})
    if existing_user:
        return error_response(code="VALIDATION_ERROR", message="An account with this email already exists.", status_code=400)

    user_id = str(uuid.uuid4())
    password_hash = hash_password(password)
    new_user = {
        "_id": user_id,
        "email": email,
        "password_hash": password_hash,
        "is_profile_complete": False,
        "created_at": datetime.utcnow().isoformat(),
        "profile": {
            "name": name,
            "college": "",
            "department": "",
            "year": "1st Year",
            "subjects": [],
            "skillLevel": "Intermediate",
            "learningStyle": "Visual",
            "studyGoals": [],
            "preferredStudyTime": "Evening",
            "availabilityDays": ["Monday", "Wednesday", "Friday"],
            "commitmentLevel": "Moderate (4-8 hrs/wk)",
            "communicationPref": "Discord Chat",
            "preferredGroupSize": 4,
            "bio": "",
            "avatarUrl": f"https://api.dicebear.com/7.x/avataaars/svg?seed={name.replace(' ', '')}"
        }
    }

    db.users.insert_one(new_user)
    token = create_jwt_token(user_id, email)

    user_data = {
        "id": user_id,
        "email": email,
        "isProfileComplete": False,
        "createdAt": new_user["created_at"],
        "profile": new_user["profile"]
    }

    return success_response(
        data={"token": token, "user": user_data},
        message="Registration successful! Welcome to StudyBuddy.",
        status_code=201
    )

@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    email = data.get("email", "").strip().lower()
    password = data.get("password", "").strip()

    if not email or not password:
        return error_response(code="VALIDATION_ERROR", message="Email and password are required.", status_code=400)

    db = get_db()
    user = db.users.find_one({"email": email})
    if not user:
        return error_response(code="AUTH_ERROR", message="Invalid email or password.", status_code=401)

    if not verify_password(password, user.get("password_hash", "")):
        return error_response(code="AUTH_ERROR", message="Invalid email or password.", status_code=401)

    token = create_jwt_token(user["_id"], user["email"])
    user_data = {
        "id": user["_id"],
        "email": user["email"],
        "isProfileComplete": user.get("is_profile_complete", False),
        "createdAt": user.get("created_at"),
        "profile": user.get("profile", {})
    }

    return success_response(
        data={"token": token, "user": user_data},
        message="Login successful."
    )

@auth_bp.route("/me", methods=["GET"])
@token_required
def get_current_user():
    db = get_db()
    user = db.users.find_one({"_id": request.user_id})
    if not user:
        return error_response(code="NOT_FOUND", message="User account not found.", status_code=404)

    user_data = {
        "id": user["_id"],
        "email": user["email"],
        "isProfileComplete": user.get("is_profile_complete", False),
        "createdAt": user.get("created_at"),
        "profile": user.get("profile", {})
    }

    return success_response(data={"user": user_data})

@auth_bp.route("/logout", methods=["POST"])
def logout():
    return success_response(message="Logged out successfully.")
