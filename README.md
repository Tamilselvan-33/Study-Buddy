# StudyBuddy

**AI-Powered Collaborative Study Group Finder**

Find the right people. Study smarter. Succeed together.

---

# Overview

StudyBuddy is an AI-powered collaborative learning platform that helps students discover highly compatible study partners based on **how they learn**, not just **what they study**.

Instead of matching users solely by subject or course, StudyBuddy uses Google Gemini to analyze study habits, learning styles, availability, commitment levels, goals, and collaboration preferences to create productive and engaging study groups.

The platform also supports **instant AI-generated temporary study groups** for exams, coding contests, assignments, interview preparation, and revision sessions.

Every recommendation is accompanied by an AI-generated explanation, making the matching process transparent and trustworthy.

---

# Problem Statement

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
- Session durations

Because of these differences, many study groups become inactive, unproductive, or dissolve within days.

Another common challenge is the need for **instant collaboration** before:

- Exams
- Coding contests
- Assignments
- Interviews
- Lab practicals

Current platforms do not provide intelligent real-time group formation based on compatibility.

---

# Solution

StudyBuddy uses Google Gemini to intelligently match students based on study compatibility.

Each learner creates a personalized study profile containing:

- Subjects
- Skill level
- Study schedule
- Preferred session duration
- Learning style
- Communication preference
- Accountability preference
- Academic goals

The AI analyzes these profiles and generates:

- Compatibility score
- AI study personality
- Explainable match reasoning
- Personalized study recommendations

StudyBuddy also creates temporary goal-based study groups whenever students need immediate collaboration.

---

# Key Features

## AI Explainable Matching

Instead of simply saying two students match, StudyBuddy explains **why**.

Example:

```
Compatibility Score: 94%

Reason

• Similar study timings
• Same commitment level
• Complementary strengths
• Both enjoy problem-solving sessions
```

This makes AI recommendations transparent and trustworthy.

---

## AI Study Personality

Every learner receives an AI-generated study personality.

Examples include:

- Focused Problem Solver
- Discussion Learner
- Visual Explorer
- Revision Sprinter
- Accountability Partner

These personalities help build balanced and productive study groups.

---

## AI Instant Study Groups

Students often need study partners immediately.

StudyBuddy automatically forms temporary study groups based on:

- Subject
- Skill level
- Availability
- Study goal
- Online users

Example:

```
DSA Sprint Group

Duration:
2 Hours

Goals

• Graph Revision
• Dynamic Programming Practice
```

After completion, the group automatically expires.

---

## AI Study Session Planner

Once a group is formed, Gemini generates a structured study agenda.

Example:

```
20 min  Concept Revision

45 min  Coding Practice

20 min  Group Discussion

15 min  Quiz

10 min  Summary
```

---

## AI Group Charter

Every new group receives an automatically generated collaboration charter.

The charter includes:

- Group objective
- Weekly schedule
- Attendance expectations
- Communication guidelines
- Session frequency
- Member responsibilities

---

## AI Icebreaker

Instead of awkward introductions, AI starts meaningful conversations.

Example:

> "Everyone is preparing Graph Algorithms today. Begin by solving one shortest-path problem together."

---

## AI Group Health Monitor

StudyBuddy continuously evaluates collaboration quality.

Metrics include:

- Attendance
- Participation
- Goal completion
- Session consistency

Example:

```
Group Health Score

82%

Strengths

• Excellent attendance
• Strong consistency

Suggestions

• Increase discussion participation
• Reduce session duration
```

---

## Smart Recommendations

If a group becomes inactive, the AI recommends:

- Better study partners
- Active learners with similar goals
- Temporary study groups
- New collaboration opportunities

---

## Learning Dashboard

Every student receives a personal dashboard containing:

- Total study hours
- Sessions completed
- Topics covered
- Weekly progress
- Learning streak
- Compatibility history

A GitHub-style contribution graph visualizes study consistency.

---

# System Architecture

```text
                          +----------------------+
                          |     Next.js App      |
                          |  React + Tailwind    |
                          +----------+-----------+
                                     |
                                     |
                          REST API / Socket.IO
                                     |
                                     v
                    +-------------------------------+
                    |    Node.js + Express Server   |
                    +-------------------------------+
                      |             |             |
                      |             |             |
                      |             |             |
                      v             v             v
              +-------------+  +------------+  +-------------+
              | MongoDB     |  | Gemini API |  | Socket.IO   |
              | Atlas       |  | Google AI  |  | Real-time   |
              +-------------+  +------------+  +-------------+
                    |               |
                    |               |
                    |               |
                    |       AI Matching Engine
                    |       Study Personality
                    |       Session Planner
                    |       Group Charter
                    |       Health Analysis
                    |       Smart Recommendations
                    |
                    v
          Persistent Storage

          • Users
          • Groups
          • Sessions
          • Matches
          • Activity Logs
```

---

# High-Level Workflow

```text
User Registration
        │
        ▼
Create Study Profile
        │
        ▼
Gemini Analyzes Preferences
        │
        ▼
Compatibility Matching
        │
        ▼
Study Group Formation
        │
        ▼
AI Generates

• Study Personality
• Group Charter
• Session Plan
• Icebreaker
        │
        ▼
Real-Time Collaboration
        │
        ▼
Health Monitoring
        │
        ▼
Smart Recommendations
```

---

# Technology Stack

## Frontend

- Next.js
- React
- Tailwind CSS
- shadcn/ui

## Backend

- Node.js
- Express.js

## Database

- MongoDB Atlas
- Mongoose

## Authentication

- JWT
- Google OAuth (Optional)

## Artificial Intelligence

- Google Gemini API
- Prompt Engineering
- Structured JSON Outputs
- Explainable AI Matching

## Real-Time Communication

- Socket.IO

## Deployment

- Vercel
- Render / Railway
- MongoDB Atlas

---

# Database Design

## Users

Stores:

- Personal information
- Subjects
- Skill level
- Availability
- Learning style
- Study personality
- Academic goals
- Preferences

---

## Groups

Stores:

- Permanent groups
- Temporary AI groups
- Members
- Group goals
- AI-generated charter
- Expiration time

---

## Sessions

Stores:

- AI study plans
- Attendance
- Session progress
- Meeting summaries

---

## Matches

Stores:

- Compatibility score
- AI explanations
- Recommendation history

---

## Activity

Tracks:

- Study hours
- Attendance
- Weekly progress
- Learning streak
- Group contributions

---

# Why StudyBuddy?

Unlike traditional study group platforms that only connect students by subject, StudyBuddy understands **how students learn**.

By combining explainable AI, intelligent compatibility matching, structured collaboration, temporary study sessions, and continuous group health monitoring, StudyBuddy transforms isolated studying into productive, goal-driven teamwork.

---

# Future Scope

- Calendar Integration
- Google Meet Integration
- Zoom Integration
- Discord Integration
- AI Voice Study Rooms
- Shared AI Whiteboard
- AI Quiz Generator
- AI Meeting Summaries
- Smart Notifications
- Gamification
- Achievement System
- University Communities

---

# Hackathon Pitch

StudyBuddy is an AI-powered collaboration platform that helps students discover compatible study partners, create productive study groups, and stay accountable throughout their learning journey.

Powered by Google Gemini, the platform delivers explainable compatibility matching, AI-generated study personalities, instant study sessions, structured collaboration plans, and intelligent group health monitoring.

Rather than simply connecting students studying the same subject, StudyBuddy understands how they learn, who they learn best with, and when they need support—making collaborative learning more effective, engaging, and sustainable.