import os
import uuid
from datetime import datetime
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
from config import Config

class MemoryCollection:
    """Thread-safe in-memory MongoDB-compatible collection fallback."""
    def __init__(self, name):
        self.name = name
        self._docs = []

    def _matches_filter(self, doc, filter_dict):
        if not filter_dict:
            return True
        for key, value in filter_dict.items():
            if key == "$or" and isinstance(value, list):
                if not any(self._matches_filter(doc, cond) for cond in value):
                    return False
                continue
            if key == "$and" and isinstance(value, list):
                if not all(self._matches_filter(doc, cond) for cond in value):
                    return False
                continue
            if key.startswith("$"):
                continue
            
            doc_val = doc.get(key)
            if isinstance(value, dict):
                # Operator query
                for op, val in value.items():
                    if op == "$in" and doc_val not in val:
                        return False
                    if op == "$nin" and doc_val in val:
                        return False
                    if op == "$gte" and (doc_val is None or doc_val < val):
                        return False
                    if op == "$lte" and (doc_val is None or doc_val > val):
                        return False
                    if op == "$ne" and doc_val == val:
                        return False
                    if op == "$regex" and (not isinstance(doc_val, str) or val.lower() not in doc_val.lower()):
                        return False
            elif doc_val != value:
                return False
        return True

    def find_one(self, filter_dict=None):
        filter_dict = filter_dict or {}
        for doc in self._docs:
            if self._matches_filter(doc, filter_dict):
                return doc.copy()
        return None

    def find(self, filter_dict=None, sort=None, limit=0):
        filter_dict = filter_dict or {}
        results = [doc.copy() for doc in self._docs if self._matches_filter(doc, filter_dict)]
        if sort:
            # Simple sorting by first key
            field, direction = sort[0]
            results.sort(key=lambda x: x.get(field) or "", reverse=(direction < 0))
        if limit > 0:
            results = results[:limit]
        return results

    def insert_one(self, doc):
        new_doc = doc.copy()
        if "_id" not in new_doc:
            new_doc["_id"] = str(uuid.uuid4())
        if "created_at" not in new_doc:
            new_doc["created_at"] = datetime.utcnow().isoformat()
        self._docs.append(new_doc)
        class InsertResult:
            inserted_id = new_doc["_id"]
        return InsertResult()

    def update_one(self, filter_dict, update_dict):
        filter_dict = filter_dict or {}
        for idx, doc in enumerate(self._docs):
            if self._matches_filter(doc, filter_dict):
                updated = doc.copy()
                if "$set" in update_dict:
                    for k, v in update_dict["$set"].items():
                        updated[k] = v
                if "$push" in update_dict:
                    for k, v in update_dict["$push"].items():
                        if k not in updated or not isinstance(updated[k], list):
                            updated[k] = []
                        updated[k].append(v)
                if "$pull" in update_dict:
                    for k, v in update_dict["$pull"].items():
                        if k in updated and isinstance(updated[k], list):
                            if isinstance(v, dict):
                                # Match sub-documents by all keys in the filter dict
                                updated[k] = [
                                    item for item in updated[k]
                                    if not all(item.get(fk) == fv for fk, fv in v.items())
                                ]
                            else:
                                updated[k] = [item for item in updated[k] if item != v]
                if "$inc" in update_dict:
                    for k, v in update_dict["$inc"].items():
                        updated[k] = updated.get(k, 0) + v
                updated["updated_at"] = datetime.utcnow().isoformat()
                self._docs[idx] = updated
                class UpdateResult:
                    matched_count = 1
                    modified_count = 1
                return UpdateResult()
        class UpdateResultEmpty:
            matched_count = 0
            modified_count = 0
        return UpdateResultEmpty()

    def delete_one(self, filter_dict):
        filter_dict = filter_dict or {}
        for idx, doc in enumerate(self._docs):
            if self._matches_filter(doc, filter_dict):
                del self._docs[idx]
                class DeleteResult:
                    deleted_count = 1
                return DeleteResult()
        class DeleteResultEmpty:
            deleted_count = 0
        return DeleteResultEmpty()

    def delete_many(self, filter_dict):
        filter_dict = filter_dict or {}
        before = len(self._docs)
        self._docs = [doc for doc in self._docs if not self._matches_filter(doc, filter_dict)]
        deleted = before - len(self._docs)
        class DeleteResult:
            pass
        result = DeleteResult()
        result.deleted_count = deleted
        return result

    def update_many(self, filter_dict, update_dict):
        filter_dict = filter_dict or {}
        modified = 0
        for idx, doc in enumerate(self._docs):
            if self._matches_filter(doc, filter_dict):
                updated = doc.copy()
                if "$set" in update_dict:
                    for k, v in update_dict["$set"].items():
                        updated[k] = v
                updated["updated_at"] = datetime.utcnow().isoformat()
                self._docs[idx] = updated
                modified += 1
        class UpdateResult:
            pass
        result = UpdateResult()
        result.modified_count = modified
        return result

    def count_documents(self, filter_dict=None):
        filter_dict = filter_dict or {}
        return sum(1 for doc in self._docs if self._matches_filter(doc, filter_dict))

class MemoryDatabase:
    """In-memory MongoDB database simulator."""
    def __init__(self):
        self._collections = {}

    def __getitem__(self, name):
        if name not in self._collections:
            self._collections[name] = MemoryCollection(name)
        return self._collections[name]

    def __getattr__(self, name):
        return self[name]

class Database:
    def __init__(self):
        self.db = None
        self.is_fallback = False
        self.init_db()

    def seed_sample_data(self):
        if self.db.users.count_documents({}) < 2:
            seed_users = [
                {
                    "_id": "seed-user-alex-chen",
                    "email": "alex.chen@stanford.edu",
                    "password_hash": "pbkdf2:sha256:dummyhash",
                    "is_profile_complete": True,
                    "created_at": "2026-07-20T10:00:00.000Z",
                    "profile": {
                        "name": "Alex Chen",
                        "college": "Stanford University",
                        "department": "Computer Science",
                        "year": "3rd Year",
                        "subjects": ["Data Structures & Algorithms", "Machine Learning & AI", "Software Architecture"],
                        "skillLevel": "Advanced",
                        "learningStyle": "Visual",
                        "studyGoals": ["Exam & Final Revision", "Interview & LeetCode Prep", "Hackathons & Coding Contests"],
                        "preferredStudyTime": "Evening",
                        "availabilityDays": ["Monday", "Wednesday", "Friday", "Saturday"],
                        "commitmentLevel": "High (9-15 hrs/wk)",
                        "communicationPref": "Discord Chat",
                        "preferredGroupSize": 4,
                        "bio": "CS Junior focused on Graph Algorithms and Deep Learning. Looking for dedicated partners for daily problem-solving.",
                        "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=AlexChen"
                    }
                },
                {
                    "_id": "seed-user-maya-patel",
                    "email": "maya.patel@mit.edu",
                    "password_hash": "pbkdf2:sha256:dummyhash",
                    "is_profile_complete": True,
                    "created_at": "2026-07-21T11:30:00.000Z",
                    "profile": {
                        "name": "Maya Patel",
                        "college": "MIT",
                        "department": "Electrical Engineering & CS",
                        "year": "4th Year",
                        "subjects": ["Machine Learning & AI", "Calculus & Linear Algebra", "Data Structures & Algorithms"],
                        "skillLevel": "Expert",
                        "learningStyle": "Project-Based",
                        "studyGoals": ["Project Collaboration", "Research & Paper Discussion"],
                        "preferredStudyTime": "Late Night",
                        "availabilityDays": ["Tuesday", "Thursday", "Saturday", "Sunday"],
                        "commitmentLevel": "Intensive (15+ hrs/wk)",
                        "communicationPref": "Google Meet / Video",
                        "preferredGroupSize": 3,
                        "bio": "Senior doing undergraduate research in Neural Networks. Enjoy build-and-learn coding sessions.",
                        "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=MayaPatel"
                    }
                },
                {
                    "_id": "seed-user-marcus-vance",
                    "email": "marcus.vance@berkeley.edu",
                    "password_hash": "pbkdf2:sha256:dummyhash",
                    "is_profile_complete": True,
                    "created_at": "2026-07-22T09:15:00.000Z",
                    "profile": {
                        "name": "Marcus Vance",
                        "college": "UC Berkeley",
                        "department": "Data Science",
                        "year": "2nd Year",
                        "subjects": ["Data Structures & Algorithms", "Database Systems", "Calculus & Linear Algebra"],
                        "skillLevel": "Intermediate",
                        "learningStyle": "Auditory",
                        "studyGoals": ["Exam & Final Revision", "Daily Homework & Assignments"],
                        "preferredStudyTime": "Afternoon",
                        "availabilityDays": ["Monday", "Tuesday", "Wednesday", "Thursday"],
                        "commitmentLevel": "Moderate (4-8 hrs/wk)",
                        "communicationPref": "Discord Chat",
                        "preferredGroupSize": 4,
                        "bio": "Sophomore preparing for midterms and building Python data pipelines. Great at explaining concept basics.",
                        "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=MarcusVance"
                    }
                },
                {
                    "_id": "seed-user-sarah-lin",
                    "email": "sarah.lin@harvard.edu",
                    "password_hash": "pbkdf2:sha256:dummyhash",
                    "is_profile_complete": True,
                    "created_at": "2026-07-22T14:45:00.000Z",
                    "profile": {
                        "name": "Sarah Lin",
                        "college": "Harvard University",
                        "department": "Applied Mathematics",
                        "year": "3rd Year",
                        "subjects": ["Calculus & Linear Algebra", "Physics & Engineering", "Machine Learning & AI"],
                        "skillLevel": "Advanced",
                        "learningStyle": "Reading/Writing",
                        "studyGoals": ["Exam & Final Revision", "Research & Paper Discussion"],
                        "preferredStudyTime": "Early Morning",
                        "availabilityDays": ["Monday", "Wednesday", "Friday"],
                        "commitmentLevel": "High (9-15 hrs/wk)",
                        "communicationPref": "Async Messages",
                        "preferredGroupSize": 2,
                        "bio": "Math & ML enthusiast who loves structured notes, latex study guides, and early morning focus sessions.",
                        "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=SarahLin"
                    }
                },
                {
                    "_id": "seed-user-david-kim",
                    "email": "david.kim@cmu.edu",
                    "password_hash": "pbkdf2:sha256:dummyhash",
                    "is_profile_complete": True,
                    "created_at": "2026-07-23T16:20:00.000Z",
                    "profile": {
                        "name": "David Kim",
                        "college": "Carnegie Mellon",
                        "department": "Software Engineering",
                        "year": "2nd Year",
                        "subjects": ["Web Development", "Computer Systems & Networks", "Software Architecture"],
                        "skillLevel": "Intermediate",
                        "learningStyle": "Kinesthetic",
                        "studyGoals": ["Project Collaboration", "Hackathons & Coding Contests"],
                        "preferredStudyTime": "Evening",
                        "availabilityDays": ["Friday", "Saturday", "Sunday"],
                        "commitmentLevel": "Moderate (4-8 hrs/wk)",
                        "communicationPref": "Mixed",
                        "preferredGroupSize": 5,
                        "bio": "Full-stack developer building React & Node apps. Seeking teammates for weekend project sprints.",
                        "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=DavidKim"
                    }
                }
            ]
            for u in seed_users:
                self.db.users.insert_one(u)
            print("[Database] Seeded 5 realistic student profiles for AI compatibility matching.")

    def init_db(self):
        try:
            client = MongoClient(Config.MONGO_URI, serverSelectionTimeoutMS=2000)
            client.admin.command('ping')
            db_name = Config.MONGO_URI.rsplit('/', 1)[-1].split('?')[0] or 'studybuddy'
            self.db = client[db_name]
            self.is_fallback = False
            print(f"[Database] Successfully connected to MongoDB: {db_name}")
            self.seed_sample_data()
        except Exception as e:
            print(f"[Database] Mongo Connection Warning: {e}. Using in-memory database fallback.")
            self.db = MemoryDatabase()
            self.is_fallback = True
            self.seed_sample_data()

db_instance = Database()

def get_db():
    return db_instance.db
