import numpy as np
import pandas as pd
from sklearn.preprocessing import OneHotEncoder, MinMaxScaler

SKILL_MAP = {"Beginner": 0.0, "Intermediate": 0.33, "Advanced": 0.67, "Expert": 1.0}
COMMITMENT_MAP = {
    "Low (1-3 hrs/wk)": 0.25,
    "Moderate (4-8 hrs/wk)": 0.50,
    "High (9-15 hrs/wk)": 0.75,
    "Intensive (15+ hrs/wk)": 1.0,
}

class UserFeatureEncoder:
    """Encodes user profiles into normalized feature vectors and calculates pairwise similarities."""

    @staticmethod
    def subject_similarity(subjects_a, subjects_b):
        set_a, set_b = set(subjects_a or []), set(subjects_b or [])
        if not set_a or not set_b:
            return 0.0
        intersection = len(set_a.intersection(set_b))
        union = len(set_a.union(set_b))
        return intersection / union if union > 0 else 0.0

    @staticmethod
    def goals_similarity(goals_a, goals_b):
        set_a, set_b = set(goals_a or []), set(goals_b or [])
        if not set_a or not set_b:
            return 0.0
        intersection = len(set_a.intersection(set_b))
        union = len(set_a.union(set_b))
        return intersection / union if union > 0 else 0.0

    @staticmethod
    def schedule_similarity(time_a, days_a, time_b, days_b):
        # Time similarity
        time_score = 1.0 if time_a == time_b or time_a == "Flexible" or time_b == "Flexible" else 0.3
        # Days similarity
        set_a, set_b = set(days_a or []), set(days_b or [])
        day_score = len(set_a.intersection(set_b)) / max(1, len(set_a.union(set_b))) if set_a and set_b else 0.5
        return 0.6 * time_score + 0.4 * day_score

    @staticmethod
    def skill_similarity(skill_a, skill_b):
        val_a = SKILL_MAP.get(skill_a, 0.33)
        val_b = SKILL_MAP.get(skill_b, 0.33)
        # Skill similarity is highest when skills are close or complementary (within 1 step)
        diff = abs(val_a - val_b)
        return max(0.0, 1.0 - (diff * 0.8))

    @staticmethod
    def commitment_similarity(comm_a, comm_b):
        val_a = COMMITMENT_MAP.get(comm_a, 0.5)
        val_b = COMMITMENT_MAP.get(comm_b, 0.5)
        return max(0.0, 1.0 - abs(val_a - val_b))

    @staticmethod
    def communication_similarity(pref_a, pref_b):
        if pref_a == pref_b or pref_a == "Mixed" or pref_b == "Mixed":
            return 1.0
        return 0.4

    @staticmethod
    def group_size_similarity(size_a, size_b):
        size_a = int(size_a or 4)
        size_b = int(size_b or 4)
        diff = abs(size_a - size_b)
        return max(0.0, 1.0 - (diff / 6.0))
