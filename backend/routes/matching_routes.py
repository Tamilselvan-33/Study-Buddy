from flask import Blueprint, request
from database import get_db
from utils.validation import success_response, error_response, token_required
from recommendation.matcher import MatchingEngine
from recommendation.explainer import MatchExplainer

matching_bp = Blueprint("matching", __name__, url_prefix="/api/matching")

@matching_bp.route("/recommendations", methods=["GET"])
@token_required
def get_recommendations():
    db = get_db()
    current_user = db.users.find_one({"_id": request.user_id})
    if not current_user:
        return error_response(code="NOT_FOUND", message="Authenticated user profile not found.", status_code=404)

    current_profile = current_user.get("profile", {})

    # Query Parameters
    subject_filter = request.args.get("subject", "").strip()
    min_score = float(request.args.get("min_score", 0))
    skill_filter = request.args.get("skill_level", "").strip()
    search_query = request.args.get("search", "").strip().lower()
    sort_by = request.args.get("sort_by", "compatibility").strip()

    all_users = db.users.find({})
    recommendations = []

    for user in all_users:
        if user["_id"] == request.user_id:
            continue
        
        target_profile = user.get("profile", {})
        if not target_profile or not target_profile.get("name"):
            continue

        # Filter by Search Query (Name, College, Bio)
        if search_query:
            text_corpus = f"{target_profile.get('name', '')} {target_profile.get('college', '')} {target_profile.get('department', '')} {target_profile.get('bio', '')}".lower()
            if search_query not in text_corpus:
                continue

        # Filter by Subject
        if subject_filter:
            user_subs = [s.lower() for s in target_profile.get("subjects", [])]
            if subject_filter.lower() not in user_subs:
                continue

        # Filter by Skill Level
        if skill_filter and target_profile.get("skillLevel") != skill_filter:
            continue

        # Calculate ML Compatibility Matrix
        match_result = MatchingEngine.calculate_compatibility(current_profile, target_profile)
        score = match_result["score"]

        if score < min_score:
            continue

        # Generate Explainable AI reasoning
        explanation = MatchExplainer.generate_explanation(current_profile, target_profile, match_result["subScores"])

        recommendations.append({
            "userId": user["_id"],
            "user": {
                "id": user["_id"],
                "email": user["email"],
                "isProfileComplete": user.get("is_profile_complete", False),
                "profile": target_profile,
                "createdAt": user.get("created_at")
            },
            "compatibilityScore": score,
            "matchReasons": explanation["matchReasons"],
            "strengths": explanation["strengths"],
            "potentialConflicts": explanation["potentialConflicts"],
            "subjectScore": match_result["subScores"]["subject"],
            "learningStyleScore": match_result["subScores"]["learningStyle"],
            "skillScore": match_result["subScores"]["skill"],
            "scheduleScore": match_result["subScores"]["schedule"]
        })

    # Sort Recommendations
    if sort_by == "compatibility":
        recommendations.sort(key=lambda x: x["compatibilityScore"], reverse=True)
    elif sort_by == "name":
        recommendations.sort(key=lambda x: x["user"]["profile"].get("name", ""))
    elif sort_by == "skill":
        recommendations.sort(key=lambda x: x["skillScore"], reverse=True)

    return success_response(data={"recommendations": recommendations, "totalMatches": len(recommendations)})

@matching_bp.route("/explain/<target_user_id>", methods=["GET"])
@token_required
def explain_match(target_user_id):
    db = get_db()
    current_user = db.users.find_one({"_id": request.user_id})
    target_user = db.users.find_one({"_id": target_user_id})

    if not current_user or not target_user:
        return error_response(code="NOT_FOUND", message="Target study partner not found.", status_code=404)

    current_profile = current_user.get("profile", {})
    target_profile = target_user.get("profile", {})

    match_result = MatchingEngine.calculate_compatibility(current_profile, target_profile)
    explanation = MatchExplainer.generate_explanation(current_profile, target_profile, match_result["subScores"])

    return success_response(data={
        "targetUser": {
            "id": target_user["_id"],
            "profile": target_profile
        },
        "compatibilityScore": match_result["score"],
        "subScores": match_result["subScores"],
        "explanation": explanation
    })
