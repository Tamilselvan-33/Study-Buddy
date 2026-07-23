export type SkillLevel = 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
export type LearningStyle = 'Visual' | 'Auditory' | 'Reading/Writing' | 'Kinesthetic' | 'Project-Based';
export type PreferredTime = 'Early Morning' | 'Afternoon' | 'Evening' | 'Late Night' | 'Flexible';
export type CommitmentLevel = 'Low (1-3 hrs/wk)' | 'Moderate (4-8 hrs/wk)' | 'High (9-15 hrs/wk)' | 'Intensive (15+ hrs/wk)';
export type CommunicationPref = 'Discord Chat' | 'Google Meet / Video' | 'In-Person' | 'Async Messages' | 'Mixed';

export interface UserProfile {
  name: string;
  college: string;
  department: string;
  year: string;
  subjects: string[];
  skillLevel: SkillLevel;
  learningStyle: LearningStyle;
  studyGoals: string[];
  preferredStudyTime: PreferredTime;
  availabilityDays: string[];
  commitmentLevel: CommitmentLevel;
  communicationPref: CommunicationPref;
  preferredGroupSize: number;
  bio: string;
  avatarUrl?: string;
  personalityTag?: string;
}

export interface User {
  id: string;
  email: string;
  profile?: UserProfile;
  isProfileComplete: boolean;
  createdAt: string;
}

export interface MatchRecommendation {
  userId: string;
  user: User;
  compatibilityScore: number; // 0 - 100
  matchReasons: string[];
  strengths: string[];
  potentialConflicts: string[];
  subjectScore: number;
  learningStyleScore: number;
  skillScore: number;
  scheduleScore: number;
}

export interface GroupMember {
  userId: string;
  name: string;
  email: string;
  avatarUrl?: string;
  role: 'Leader' | 'Member';
  joinedAt: string;
}

export interface StudyGroup {
  id: string;
  name: string;
  description: string;
  subject: string;
  leaderId: string;
  maxMembers: number;
  members: GroupMember[];
  isTemporary: boolean;
  meetingTime?: string;
  charter?: {
    objective: string;
    expectations: string[];
  };
  healthScore?: number;
  createdAt: string;
}

export interface GroupTask {
  id: string;
  groupId: string;
  title: string;
  assignedTo?: string;
  dueDate?: string;
  completed: boolean;
  createdAt: string;
}

export interface GroupResource {
  id: string;
  groupId: string;
  title: string;
  url: string;
  category: string;
  sharedBy: string;
  createdAt: string;
}

export interface GroupMessage {
  id: string;
  groupId: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
}

export interface StudySession {
  id: string;
  groupId?: string;
  title: string;
  durationMinutes: number;
  date: string;
  topicsCovered: string[];
  notes?: string;
}

export interface ProgressMetrics {
  totalHoursStudied: number;
  sessionsCompleted: number;
  currentStreakDays: number;
  weeklyGoalHours: number;
  completedTasksCount: number;
  contributionMap: { date: string; hours: number }[];
}

export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: any[];
  };
}
