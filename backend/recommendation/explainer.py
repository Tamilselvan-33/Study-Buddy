class MatchExplainer:
    @staticmethod
    def generate_explanation(profile_a: dict, profile_b: dict, sub_scores: dict) -> dict:
        """Generates transparent match reasons, key strengths, and potential conflicts."""
        reasons = []
        strengths = []
        conflicts = []

        # 1. Subjects Analysis
        subs_a = set(profile_a.get("subjects", []))
        subs_b = set(profile_b.get("subjects", []))
        shared_subs = list(subs_a.intersection(subs_b))

        if shared_subs:
            reasons.append(f"Both studying {', '.join(shared_subs[:3])}")
            strengths.append(f"Strong overlap in {len(shared_subs)} target subject(s)")
        else:
            conflicts.append("No direct subject overlap, but complementary skill sets")

        # 2. Learning Style & Personality
        style_a = profile_a.get("learningStyle", "Visual")
        style_b = profile_b.get("learningStyle", "Visual")
        if style_a == style_b:
            reasons.append(f"Matching {style_a} learning style")
            strengths.append(f"Aligned {style_a} study workflow and materials preference")
        else:
            reasons.append(f"Complementary styles ({style_a} + {style_b})")

        # 3. Schedule & Timings
        time_a = profile_a.get("preferredStudyTime", "Evening")
        time_b = profile_b.get("preferredStudyTime", "Evening")
        days_a = set(profile_a.get("availabilityDays", []))
        days_b = set(profile_b.get("availabilityDays", []))
        shared_days = list(days_a.intersection(days_b))

        if time_a == time_b or time_a == "Flexible" or time_b == "Flexible":
            reasons.append(f"Compatible preferred study time ({time_a})")
        else:
            conflicts.append(f"Timing difference: {time_a} vs {time_b}")

        if shared_days:
            strengths.append(f"Overlapping availability on {', '.join(shared_days[:3])}")
        else:
            conflicts.append("Limited overlapping days of availability")

        # 4. Commitment Level
        comm_a = profile_a.get("commitmentLevel", "Moderate (4-8 hrs/wk)")
        comm_b = profile_b.get("commitmentLevel", "Moderate (4-8 hrs/wk)")
        if comm_a == comm_b:
            reasons.append("Identical weekly commitment expectations")
        else:
            conflicts.append(f"Differing commitment levels: {comm_a} vs {comm_b}")

        # Fallback default if lists are brief
        if not reasons:
            reasons.append("General academic compatibility and flexible schedule")
        if not strengths:
            strengths.append("Goal-driven study motivation")

        return {
            "matchReasons": reasons,
            "strengths": strengths,
            "potentialConflicts": conflicts if conflicts else ["Minor schedule adjustments may be required"]
        }
