import uuid
from datetime import datetime, timedelta
from flask import Blueprint, request
from database import get_db
from utils.validation import success_response, error_response, token_required

progress_bp = Blueprint("progress", __name__, url_prefix="/api/progress")


def _iso_to_date(iso: str) -> str:
    """Extract YYYY-MM-DD from an ISO datetime string."""
    return iso[:10] if iso else ""


# ──────────────────────────────────────────────────────────────────────────────
# STUDY SESSIONS
# ──────────────────────────────────────────────────────────────────────────────

@progress_bp.route("/sessions", methods=["GET"])
@token_required
def list_sessions():
    db = get_db()
    user_id = request.user_id
    sessions = list(db.study_sessions.find({"user_id": user_id}))
    result = [
        {
            "id": s["_id"],
            "groupId": s.get("group_id"),
            "title": s["title"],
            "durationMinutes": s["duration_minutes"],
            "date": s["date"],
            "topicsCovered": s.get("topics_covered", []),
            "notes": s.get("notes"),
        }
        for s in sessions
    ]
    return success_response(data={"sessions": result})


@progress_bp.route("/sessions", methods=["POST"])
@token_required
def log_session():
    data = request.get_json() or {}
    title = data.get("title", "").strip()
    duration = int(data.get("durationMinutes", 0))
    date_str = data.get("date", datetime.utcnow().date().isoformat())
    topics = data.get("topicsCovered", [])
    notes = data.get("notes", "").strip() or None
    group_id = data.get("groupId")

    if not title:
        return error_response("VALIDATION_ERROR", "Session title is required.", status_code=400)
    if duration <= 0:
        return error_response("VALIDATION_ERROR", "Duration must be a positive number of minutes.", status_code=400)
    if duration > 1440:
        return error_response("VALIDATION_ERROR", "Duration cannot exceed 1440 minutes (24 hours).", status_code=400)

    db = get_db()
    session_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()
    new_session = {
        "_id": session_id,
        "user_id": request.user_id,
        "group_id": group_id,
        "title": title,
        "duration_minutes": duration,
        "date": date_str,
        "topics_covered": topics if isinstance(topics, list) else [],
        "notes": notes,
        "created_at": now,
    }
    db.study_sessions.insert_one(new_session)

    return success_response(
        data={
            "session": {
                "id": session_id,
                "groupId": group_id,
                "title": title,
                "durationMinutes": duration,
                "date": date_str,
                "topicsCovered": new_session["topics_covered"],
                "notes": notes,
            }
        },
        message="Study session logged successfully.",
        status_code=201
    )


@progress_bp.route("/sessions/<session_id>", methods=["DELETE"])
@token_required
def delete_session(session_id: str):
    db = get_db()
    session = db.study_sessions.find_one({"_id": session_id, "user_id": request.user_id})
    if not session:
        return error_response("NOT_FOUND", "Session not found.", status_code=404)
    db.study_sessions.delete_one({"_id": session_id})
    return success_response(message="Session deleted.")


# ──────────────────────────────────────────────────────────────────────────────
# PROGRESS METRICS (computed from sessions)
# ──────────────────────────────────────────────────────────────────────────────

@progress_bp.route("/metrics", methods=["GET"])
@token_required
def get_metrics():
    db = get_db()
    user_id = request.user_id
    sessions = list(db.study_sessions.find({"user_id": user_id}))

    # Total hours & sessions
    total_minutes = sum(s.get("duration_minutes", 0) for s in sessions)
    total_hours = round(total_minutes / 60, 1)
    sessions_completed = len(sessions)

    # Weekly goal hours from user profile
    user = db.users.find_one({"_id": user_id})
    profile = user.get("profile", {}) if user else {}
    commitment = profile.get("commitmentLevel", "Moderate (4-8 hrs/wk)")
    # Parse weekly goal from commitment string
    weekly_goal = 6  # default moderate
    if "1-3" in commitment:
        weekly_goal = 2
    elif "4-8" in commitment:
        weekly_goal = 6
    elif "9-15" in commitment:
        weekly_goal = 12
    elif "15+" in commitment:
        weekly_goal = 18

    # Contribution map (last 12 weeks = 84 days)
    today = datetime.utcnow().date()
    start_date = today - timedelta(days=83)
    contribution_map = {}
    for s in sessions:
        d = s.get("date", "")[:10]
        if d >= start_date.isoformat():
            contribution_map[d] = contribution_map.get(d, 0) + round(s.get("duration_minutes", 0) / 60, 2)

    # Build full 84-day list (0 for missing)
    contribution_list = []
    for i in range(84):
        day = (start_date + timedelta(days=i)).isoformat()
        contribution_list.append({"date": day, "hours": contribution_map.get(day, 0)})

    # Current streak
    streak = 0
    check_date = today
    while True:
        if check_date.isoformat() in contribution_map:
            streak += 1
            check_date -= timedelta(days=1)
        else:
            break

    # Completed tasks count (across all groups user is in)
    user_groups = list(db.groups.find({"members.userId": user_id}))
    group_ids = [g["_id"] for g in user_groups]
    completed_tasks = 0
    for gid in group_ids:
        completed_tasks += db.group_tasks.count_documents({"group_id": gid, "completed": True})

    return success_response(
        data={
            "metrics": {
                "totalHoursStudied": total_hours,
                "sessionsCompleted": sessions_completed,
                "currentStreakDays": streak,
                "weeklyGoalHours": weekly_goal,
                "completedTasksCount": completed_tasks,
                "contributionMap": contribution_list,
            }
        }
    )


# ──────────────────────────────────────────────────────────────────────────────
# AI HEURISTICS (rule-based utilities)
# ──────────────────────────────────────────────────────────────────────────────

@progress_bp.route("/heuristics/inactive-groups", methods=["GET"])
@token_required
def detect_inactive_groups():
    """Return groups where there has been no message activity in 7+ days."""
    db = get_db()
    user_id = request.user_id
    user_groups = list(db.groups.find({"members.userId": user_id}))
    cutoff = (datetime.utcnow() - timedelta(days=7)).isoformat()

    inactive = []
    for group in user_groups:
        gid = group["_id"]
        # Find most recent message
        messages = list(db.group_messages.find({"group_id": gid}))
        if messages:
            latest = max(m.get("timestamp", "") for m in messages)
            if latest < cutoff:
                inactive.append({
                    "groupId": gid,
                    "groupName": group.get("name", ""),
                    "lastActivityDaysAgo": (datetime.utcnow() - datetime.fromisoformat(latest)).days,
                    "suggestion": "Re-engage by sharing a resource or scheduling the next session."
                })
        else:
            # Never had messages – treat as inactive since creation
            created = group.get("created_at", "")
            if created < cutoff:
                inactive.append({
                    "groupId": gid,
                    "groupName": group.get("name", ""),
                    "lastActivityDaysAgo": None,
                    "suggestion": "This group has never had a conversation. Break the ice!"
                })

    return success_response(data={"inactiveGroups": inactive})


@progress_bp.route("/heuristics/schedule", methods=["GET"])
@token_required
def suggest_schedule():
    """Return personalized optimal study time blocks based on user profile."""
    db = get_db()
    user_id = request.user_id
    user = db.users.find_one({"_id": user_id})
    profile = user.get("profile", {}) if user else {}

    preferred_time = profile.get("preferredStudyTime", "Evening")
    availability = profile.get("availabilityDays", ["Monday", "Wednesday", "Friday"])
    commitment = profile.get("commitmentLevel", "Moderate (4-8 hrs/wk)")

    # Map preferred time to hour blocks
    time_blocks = {
        "Early Morning": ("05:00", "07:00"),
        "Afternoon": ("13:00", "15:00"),
        "Evening": ("18:00", "21:00"),
        "Late Night": ("21:00", "00:00"),
        "Flexible": ("10:00", "12:00"),
    }
    start, end = time_blocks.get(preferred_time, ("18:00", "21:00"))

    # Sessions per week from commitment
    sessions_per_week = {
        "Low (1-3 hrs/wk)": 2,
        "Moderate (4-8 hrs/wk)": 3,
        "High (9-15 hrs/wk)": 4,
        "Intensive (15+ hrs/wk)": 5,
    }.get(commitment, 3)

    # Choose days from availability
    recommended_days = availability[:sessions_per_week]

    schedule = [
        {
            "day": day,
            "startTime": start,
            "endTime": end,
            "recommendation": f"Optimal focus block for {preferred_time.lower()} learner."
        }
        for day in recommended_days
    ]

    return success_response(
        data={
            "schedule": schedule,
            "rationale": f"Based on your {preferred_time.lower()} preference and {commitment} commitment."
        }
    )


@progress_bp.route("/heuristics/goals", methods=["GET"])
@token_required
def generate_goals():
    """Generate smart study goals based on the user's profile and study history."""
    db = get_db()
    user_id = request.user_id
    user = db.users.find_one({"_id": user_id})
    profile = user.get("profile", {}) if user else {}

    subjects = profile.get("subjects", [])
    skill_level = profile.get("skillLevel", "Intermediate")
    existing_goals = profile.get("studyGoals", [])
    commitment = profile.get("commitmentLevel", "Moderate (4-8 hrs/wk)")

    # Compute avg weekly hours from sessions (last 4 weeks)
    cutoff = (datetime.utcnow() - timedelta(days=28)).isoformat()[:10]
    sessions = list(db.study_sessions.find({"user_id": user_id}))
    recent_mins = sum(
        s.get("duration_minutes", 0) for s in sessions if s.get("date", "") >= cutoff
    )
    avg_weekly_hours = round(recent_mins / 60 / 4, 1)

    # Generate suggestions
    suggestions = []

    if subjects:
        suggestions.append({
            "goal": f"Master {subjects[0]} fundamentals in 4 weeks",
            "rationale": "Focused depth beats breadth for retention.",
            "priority": "High"
        })

    if skill_level in ("Beginner", "Intermediate"):
        suggestions.append({
            "goal": "Complete 2 practice problems daily",
            "rationale": "Daily deliberate practice accelerates skill progression.",
            "priority": "High"
        })
    else:
        suggestions.append({
            "goal": "Contribute to one open-source project this month",
            "rationale": "Advanced learners grow fastest through application.",
            "priority": "Medium"
        })

    if avg_weekly_hours < 4:
        suggestions.append({
            "goal": "Increase weekly study time to 6+ hours",
            "rationale": f"Your recent average is {avg_weekly_hours}h/week. More consistency leads to better outcomes.",
            "priority": "Medium"
        })

    if "Interview & LeetCode Prep" in existing_goals or "Exam & Final Revision" in existing_goals:
        suggestions.append({
            "goal": "Solve one timed mock exam per week",
            "rationale": "Simulated pressure builds exam-day performance.",
            "priority": "High"
        })

    suggestions.append({
        "goal": "Join or form one new study group this week",
        "rationale": "Collaborative learning increases retention by 75%.",
        "priority": "Low"
    })

    return success_response(data={"suggestions": suggestions, "averageWeeklyHours": avg_weekly_hours})
