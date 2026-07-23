# StudyBuddy

**AI-Powered Collaborative Study Group Finder**

Find the right people. Study smarter. Succeed together.

---

## Overview

StudyBuddy is an AI-powered collaborative learning platform that helps students discover highly compatible study partners based on **how they learn**, not just **what they study**.

Instead of matching users solely by subject or course, StudyBuddy uses a **multi-factor compatibility engine** (built with scikit-learn) to analyze study habits, learning styles, availability, commitment levels, goals, and collaboration preferences to surface the most productive study matches.

Every recommendation is accompanied by an **explainable match breakdown**, making the matching process transparent and trustworthy.

---

## Problem Statement

Finding an effective study partner is surprisingly difficult.

Most existing platforms match students only by:

- Subject
- Course
- College

However, successful study groups depend on much more than shared subjects.

Students often have different:

- Study schedules
- Learning styles
- Communication preferences
- Commitment levels
- Academic goals

Because of these differences, many study groups become inactive, unproductive, or dissolve within days.

---

## Solution

StudyBuddy intelligently matches students based on 8 weighted compatibility factors.

Each learner creates a personalized study profile containing:

- Subjects (Weight: 40%)
- Learning Style (Weight: 15%)
- Skill Level (Weight: 10%)
- Study Goals (Weight: 10%)
- Preferred Study Time & Weekly Availability (Weight: 10%)
- Commitment Level (Weight: 5%)
- Communication Preference (Weight: 5%)
- Preferred Group Size (Weight: 5%)

The engine computes a weighted compatibility percentage between every pair of users and returns ranked recommendations with per-factor sub-scores and a human-readable explanation.

---

## Key Features

### Explainable Compatibility Matching

Instead of simply saying two students match, StudyBuddy explains **why** using per-factor breakdown cards.

Example:

```
Compatibility Score: 94%

Subject Overlap       → 100%
Learning Style        → 100%
Skill Level           → 80%
Study Goals           → 75%
Schedule & Days       → 60%
Commitment Level      → 100%
Communication         → 100%
Group Size            → 80%
```

### Study Group Dashboard

- Create named study groups with a subject, description, and group charter
- Two-tab layout: **My Groups** and **Explore Public Groups**
- Group Health Score (computed from task completion and message activity)
- Join public groups with a single click

### Group Interior (4 Tabs)

| Tab | Features |
|-----|----------|
| **Chat** | Real-time polling (8s), threaded bubble layout, auto-scroll |
| **Tasks** | Progress bar, checkbox toggle, assignee + due date, inline add |
| **Resources** | Categorized links (Notes / Video / Article / GitHub / PDF) |
| **Members** | Role badges, kick-member (leader only), group charter display |

### Progress Tracker

- 4 stat cards: Total Hours, Sessions, Current Streak, Completed Tasks
- Weekly goal progress bar (derived from commitment level)
- GitHub-style 84-day contribution heatmap
- Session log with topic tags and delete-on-hover
- AI Heuristic Insights panel:
  - Inactive group detector (silent for 7+ days)
  - Schedule optimizer (best study blocks from profile)
  - Goal suggestion generator (High / Medium / Low priority)

### Profile Wizard

14-factor profile editor with sections for:
- Basic & Academic Info
- Subjects You Are Studying
- Skill Level & Learning Style
- Goals & Schedule Preferences
- Bio & Profile Image

---

## System Architecture

```text
                      ┌────────────────────────┐
                      │  React + Vite Frontend  │
                      │  TypeScript + Tailwind  │
                      │  Framer Motion          │
                      └───────────┬────────────┘
                                  │
                              REST API
                                  │
                                  ▼
                      ┌────────────────────────┐
                      │  Flask Python Backend   │
                      │  Flask-JWT-Extended     │
                      │  flask-cors             │
                      └──────────┬─────────────┘
                                 │
              ┌──────────────────┼──────────────────┐
              │                  │                  │
              ▼                  ▼                  ▼
    ┌──────────────┐   ┌──────────────────┐  ┌──────────────┐
    │   MongoDB    │   │  Matching Engine  │  │  Heuristics  │
    │  (Local /    │   │  scikit-learn     │  │  Rule-based  │
    │   Atlas)     │   │  Cosine Sim       │  │  AI Insights │
    └──────────────┘   └──────────────────┘  └──────────────┘
```

---

## High-Level Workflow

```text
User Registration
      │
      ▼
Create Study Profile (14 factors)
      │
      ▼
Multi-Factor Compatibility Engine (scikit-learn)
      │
      ▼
Ranked Partner Recommendations + Explainable Match Breakdown
      │
      ▼
Study Group Formation (Create or Join)
      │
      ▼
Group Dashboard (Chat / Tasks / Resources / Members)
      │
      ▼
Progress Tracking + Rule-Based AI Heuristics
```

---

## Technology Stack

### Frontend

| Technology | Purpose |
|-----------|---------|
| React 19 | UI Framework |
| Vite 8 | Build Tool & Dev Server |
| TypeScript | Type Safety |
| Tailwind CSS v4 | Utility-First Styling |
| Framer Motion | Animations & Transitions |
| React Router v7 | Client-Side Routing |
| React Hook Form | Form Management |
| Lucide React | Icons |
| Axios | HTTP Client |

### Backend

| Technology | Purpose |
|-----------|---------|
| Python 3 + Flask | API Server |
| Flask-JWT-Extended | JWT Authentication |
| flask-cors | Cross-Origin Resource Sharing |
| Werkzeug | Password Hashing |
| pymongo | MongoDB Driver |
| scikit-learn | Compatibility Matching Engine |
| pandas + numpy | Data Processing |
| python-dotenv | Environment Config |

### Database

- **MongoDB** (local or MongoDB Atlas)
- Schema-less document store for Users, Groups, Sessions, Messages, Tasks, Resources

### Authentication

- JWT (JSON Web Tokens) — 7-day access token
- Bcrypt / Werkzeug password hashing

### AI / Matching Engine

- **scikit-learn** — cosine similarity and feature encoding for multi-factor compatibility scoring
- **Rule-based heuristics** — schedule optimizer, inactive group detector, goal suggestions (no external AI API required)

---

## Project Structure

```
StudyBuddy/
├── backend/
│   ├── app.py                  # Flask app entry point
│   ├── config.py               # Environment configuration
│   ├── database.py             # MongoDB operations helper
│   ├── requirements.txt        # Python dependencies
│   ├── recommendation/
│   │   ├── encoder.py          # Feature encoders (subjects, skills, goals...)
│   │   ├── matcher.py          # Weighted compatibility calculator
│   │   └── explainer.py        # Match explanation generator
│   ├── routes/
│   │   ├── auth_routes.py      # Register / Login / Logout / Me
│   │   ├── user_routes.py      # Profile CRUD
│   │   ├── matching_routes.py  # Recommendations endpoint
│   │   ├── group_routes.py     # Groups, Tasks, Resources, Messages
│   │   └── progress_routes.py  # Sessions, Metrics, Heuristics
│   └── utils/
│       ├── security.py         # JWT helpers
│       └── validation.py       # Input validators
│
└── frontend/
    ├── src/
    │   ├── App.tsx
    │   ├── index.css           # CSS variable design token system
    │   ├── components/
    │   │   ├── layout/Navbar.tsx
    │   │   ├── ui/             # Button, Card, Badge, Skeleton
    │   │   ├── matching/       # PartnerCard, MatchExplanationModal
    │   │   └── groups/         # GroupDetail, CreateGroupModal
    │   ├── pages/
    │   │   ├── LoginPage.tsx
    │   │   ├── RegisterPage.tsx
    │   │   ├── ProfilePage.tsx
    │   │   ├── RecommendationsPage.tsx
    │   │   ├── GroupsPage.tsx
    │   │   └── ProgressPage.tsx
    │   ├── context/            # Auth, Theme, Toast contexts
    │   ├── services/           # Typed API service layer
    │   └── types/              # TypeScript interfaces
    └── package.json
```

---

## Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+
- MongoDB (local) or a MongoDB Atlas connection string

### 1. Clone the Repository

```bash
git clone https://github.com/Tamilselvan-33/Study-Buddy.git
cd Study-Buddy
```

### 2. Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
source venv/bin/activate     # macOS / Linux

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Edit .env and set MONGO_URI, SECRET_KEY, JWT_SECRET_KEY

# Start the Flask server
python app.py
```

The backend will run on **http://localhost:5000**.

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start the dev server
npm run dev
```

The frontend will run on **http://localhost:5173**.

---

## Environment Variables

Create a `.env` file in the `backend/` directory:

```env
MONGO_URI=mongodb://localhost:27017/studybuddy
SECRET_KEY=your-secret-key-here
JWT_SECRET_KEY=your-jwt-secret-here
FLASK_DEBUG=True
PORT=5000
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login and get JWT |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/me` | Get current user |
| GET | `/api/users/profile` | Get user profile |
| PUT | `/api/users/profile` | Update user profile |
| GET | `/api/matching/recommendations` | Get ranked partner recommendations |
| GET | `/api/groups` | Get user's groups |
| POST | `/api/groups` | Create a group |
| GET | `/api/groups/explore` | Explore public groups |
| POST | `/api/groups/:id/join` | Join a group |
| GET | `/api/groups/:id/messages` | Get group chat messages |
| POST | `/api/groups/:id/messages` | Send a message |
| GET | `/api/groups/:id/tasks` | Get group tasks |
| POST | `/api/groups/:id/tasks` | Add a task |
| PATCH | `/api/groups/:id/tasks/:taskId` | Toggle task completion |
| GET | `/api/groups/:id/resources` | Get group resources |
| POST | `/api/groups/:id/resources` | Add a resource |
| GET | `/api/progress/metrics` | Get study metrics |
| GET | `/api/progress/sessions` | Get study sessions |
| POST | `/api/progress/sessions` | Log a study session |
| GET | `/api/progress/heuristics/inactive-groups` | Get inactive group alerts |
| GET | `/api/progress/heuristics/schedule` | Get schedule recommendations |
| GET | `/api/progress/heuristics/goals` | Get AI goal suggestions |

---

## Compatibility Matching Factors

| Factor | Weight | Description |
|--------|--------|-------------|
| Subject Overlap | 40% | Jaccard similarity between selected subjects |
| Learning Style | 15% | Exact match (Visual / Auditory / Reading-Writing / Kinesthetic / Project-Based) |
| Skill Level | 10% | Proximity on ordered scale (Beginner → Expert) |
| Study Goals | 10% | Jaccard similarity between selected goals |
| Schedule & Availability | 10% | Time-of-day + day-of-week overlap |
| Commitment Level | 5% | Proximity on ordered scale |
| Communication Preference | 5% | Exact match (Discord / Zoom / WhatsApp / In-Person / Slack) |
| Preferred Group Size | 5% | Inverse distance on group size preference |

---

## Features Planned for Future

- Google Calendar Integration
- Google Meet / Zoom Link Generation
- Discord Bot Integration
- AI Voice Study Rooms
- Shared Whiteboard
- AI Quiz Generator from Study Notes
- AI Meeting Summaries
- Smart Push Notifications
- Gamification & Achievement Badges
- University Community Pages

---

## Why StudyBuddy?

Unlike traditional study group platforms that only connect students by subject, StudyBuddy understands **how students learn**.

By combining explainable AI-powered compatibility matching, structured group collaboration tools, real-time group chat, task tracking, resource sharing, and a continuous progress dashboard, StudyBuddy transforms isolated studying into productive, goal-driven teamwork.