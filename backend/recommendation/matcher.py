from recommendation.encoder import UserFeatureEncoder

WEIGHTS = {
    "subject": 0.40,
    "learningStyle": 0.15,
    "skill": 0.10,
    "goals": 0.10,
    "schedule": 0.10,
    "commitment": 0.05,
    "communication": 0.05,
    "groupSize": 0.05,
}

class MatchingEngine:
    @staticmethod
    def calculate_compatibility(profile_a: dict, profile_b: dict) -> dict:
        """Calculates multi-factor compatibility score % between two user profiles."""
        
        # 1. Subject Match (40%)
        sub_score = UserFeatureEncoder.subject_similarity(
            profile_a.get("subjects", []), profile_b.get("subjects", [])
        )

        # 2. Learning Style (15%)
        style_a = profile_a.get("learningStyle", "Visual")
        style_b = profile_b.get("learningStyle", "Visual")
        style_score = 1.0 if style_a == style_b else 0.4

        # 3. Skill Level (10%)
        skill_score = UserFeatureEncoder.skill_similarity(
            profile_a.get("skillLevel", "Intermediate"), profile_b.get("skillLevel", "Intermediate")
        )

        # 4. Goals Match (10%)
        goal_score = UserFeatureEncoder.goals_similarity(
            profile_a.get("studyGoals", []), profile_b.get("studyGoals", [])
        )

        # 5. Schedule & Days (10%)
        sched_score = UserFeatureEncoder.schedule_similarity(
            profile_a.get("preferredStudyTime", "Evening"),
            profile_a.get("availabilityDays", []),
            profile_b.get("preferredStudyTime", "Evening"),
            profile_b.get("availabilityDays", []),
        )

        # 6. Commitment (5%)
        comm_score = UserFeatureEncoder.commitment_similarity(
            profile_a.get("commitmentLevel", "Moderate (4-8 hrs/wk)"),
            profile_b.get("commitmentLevel", "Moderate (4-8 hrs/wk)"),
        )

        # 7. Communication (5%)
        chat_score = UserFeatureEncoder.communication_similarity(
            profile_a.get("communicationPref", "Discord Chat"),
            profile_b.get("communicationPref", "Discord Chat"),
        )

        # 8. Group Size (5%)
        size_score = UserFeatureEncoder.group_size_similarity(
            profile_a.get("preferredGroupSize", 4), profile_b.get("preferredGroupSize", 4)
        )

        # Weighted final score
        weighted_score = (
            sub_score * WEIGHTS["subject"]
            + style_score * WEIGHTS["learningStyle"]
            + skill_score * WEIGHTS["skill"]
            + goal_score * WEIGHTS["goals"]
            + sched_score * WEIGHTS["schedule"]
            + comm_score * WEIGHTS["commitment"]
            + chat_score * WEIGHTS["communication"]
            + size_score * WEIGHTS["groupSize"]
        )

        compatibility_percentage = round(weighted_score * 100, 1)

        return {
            "score": compatibility_percentage,
            "subScores": {
                "subject": round(sub_score * 100, 1),
                "learningStyle": round(style_score * 100, 1),
                "skill": round(skill_score * 100, 1),
                "goals": round(goal_score * 100, 1),
                "schedule": round(sched_score * 100, 1),
                "commitment": round(comm_score * 100, 1),
                "communication": round(chat_score * 100, 1),
                "groupSize": round(size_score * 100, 1),
            }
        }
