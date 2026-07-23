from flask import Blueprint, request
from database import get_db
from utils.validation import success_response, error_response, token_required

user_bp = Blueprint("users", __name__, url_prefix="/api/users")

VALID_SKILL_LEVELS = ["Beginner", "Intermediate", "Advanced", "Expert"]
VALID_LEARNING_STYLES = ["Visual", "Auditory", "Reading/Writing", "Kinesthetic", "Project-Based"]
VALID_STUDY_TIMES = ["Early Morning", "Afternoon", "Evening", "Late Night", "Flexible"]
VALID_COMMITMENT_LEVELS = ["Low (1-3 hrs/wk)", "Moderate (4-8 hrs/wk)", "High (9-15 hrs/wk)", "Intensive (15+ hrs/wk)"]
VALID_COMMUNICATION_PREFS = ["Discord Chat", "Google Meet / Video", "In-Person", "Async Messages", "Mixed"]

@user_bp.route("/profile", methods=["GET"])
@token_required
def get_profile():
    db = get_db()
    user = db.users.find_one({"_id": request.user_id})
    if not user:
        return error_response(code="NOT_FOUND", message="User not found.", status_code=404)
    
    return success_response(data={"profile": user.get("profile", {}), "isProfileComplete": user.get("is_profile_complete", False)})

@user_bp.route("/profile", methods=["PUT"])
@token_required
def update_profile():
    data = request.get_json() or {}
    
    name = data.get("name", "").strip()
    college = data.get("college", "").strip()
    department = data.get("department", "").strip()
    year = data.get("year", "1st Year").strip()
    subjects = data.get("subjects", [])
    skill_level = data.get("skillLevel", "Intermediate")
    learning_style = data.get("learningStyle", "Visual")
    study_goals = data.get("studyGoals", [])
    preferred_study_time = data.get("preferredStudyTime", "Evening")
    availability_days = data.get("availabilityDays", [])
    commitment_level = data.get("commitmentLevel", "Moderate (4-8 hrs/wk)")
    communication_pref = data.get("communicationPref", "Discord Chat")
    preferred_group_size = int(data.get("preferredGroupSize", 4))
    bio = data.get("bio", "").strip()
    avatar_url = data.get("avatarUrl", f"https://api.dicebear.com/7.x/avataaars/svg?seed={request.user_id[:6]}")

    if not name:
        return error_response(code="VALIDATION_ERROR", message="Name is required.", status_code=400)
    if not isinstance(subjects, list) or len(subjects) == 0:
        return error_response(code="VALIDATION_ERROR", message="Please select at least one subject.", status_code=400)

    updated_profile = {
        "name": name,
        "college": college,
        "department": department,
        "year": year,
        "subjects": subjects,
        "skillLevel": skill_level if skill_level in VALID_SKILL_LEVELS else "Intermediate",
        "learningStyle": learning_style if learning_style in VALID_LEARNING_STYLES else "Visual",
        "studyGoals": study_goals if isinstance(study_goals, list) else [],
        "preferredStudyTime": preferred_study_time if preferred_study_time in VALID_STUDY_TIMES else "Evening",
        "availabilityDays": availability_days if isinstance(availability_days, list) else [],
        "commitmentLevel": commitment_level if commitment_level in VALID_COMMITMENT_LEVELS else "Moderate (4-8 hrs/wk)",
        "communicationPref": communication_pref if communication_pref in VALID_COMMUNICATION_PREFS else "Discord Chat",
        "preferredGroupSize": max(2, min(8, preferred_group_size)),
        "bio": bio,
        "avatarUrl": avatar_url,
    }

    db = get_db()
    db.users.update_one(
        {"_id": request.user_id},
        {"$set": {"profile": updated_profile, "is_profile_complete": True}}
    )

    user = db.users.find_one({"_id": request.user_id})
    user_data = {
        "id": user["_id"],
        "email": user["email"],
        "isProfileComplete": True,
        "createdAt": user.get("created_at"),
        "profile": updated_profile
    }

    return success_response(data={"user": user_data}, message="Profile updated successfully!")

@user_bp.route("/<user_id>", methods=["GET"])
@token_required
def get_user_by_id(user_id):
    db = get_db()
    user = db.users.find_one({"_id": user_id})
    if not user:
        return error_response(code="NOT_FOUND", message="User profile not found.", status_code=404)
    
    public_profile = {
        "id": user["_id"],
        "email": user["email"],
        "isProfileComplete": user.get("is_profile_complete", False),
        "profile": user.get("profile", {})
    }
    return success_response(data={"user": public_profile})
