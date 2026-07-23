import api from './api';
import type { ApiResponse, StudySession, ProgressMetrics } from '../types';

interface InactiveGroup {
  groupId: string;
  groupName: string;
  lastActivityDaysAgo: number | null;
  suggestion: string;
}

interface ScheduleBlock {
  day: string;
  startTime: string;
  endTime: string;
  recommendation: string;
}

interface GoalSuggestion {
  goal: string;
  rationale: string;
  priority: 'High' | 'Medium' | 'Low';
}

export const fetchSessions = (): Promise<ApiResponse<{ sessions: StudySession[] }>> =>
  api.get('/progress/sessions');

export const logSession = (payload: {
  title: string;
  durationMinutes: number;
  date: string;
  topicsCovered: string[];
  notes?: string;
  groupId?: string;
}): Promise<ApiResponse<{ session: StudySession }>> =>
  api.post('/progress/sessions', payload);

export const deleteSession = (sessionId: string): Promise<ApiResponse<Record<string, never>>> =>
  api.delete(`/progress/sessions/${sessionId}`);

export const fetchMetrics = (): Promise<ApiResponse<{ metrics: ProgressMetrics }>> =>
  api.get('/progress/metrics');

export const fetchInactiveGroups = (): Promise<ApiResponse<{ inactiveGroups: InactiveGroup[] }>> =>
  api.get('/progress/heuristics/inactive-groups');

export const fetchScheduleSuggestions = (): Promise<
  ApiResponse<{ schedule: ScheduleBlock[]; rationale: string }>
> => api.get('/progress/heuristics/schedule');

export const fetchGoalSuggestions = (): Promise<
  ApiResponse<{ suggestions: GoalSuggestion[]; averageWeeklyHours: number }>
> => api.get('/progress/heuristics/goals');

export type { InactiveGroup, ScheduleBlock, GoalSuggestion };
