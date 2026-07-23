import api from './api';
import type { ApiResponse, StudyGroup, GroupTask, GroupResource, GroupMessage } from '../types';

// ── Groups ───────────────────────────────────────────────────────────────────

export const fetchMyGroups = (): Promise<ApiResponse<{ groups: StudyGroup[] }>> =>
  api.get('/groups');

export const exploreGroups = (subject?: string): Promise<ApiResponse<{ groups: StudyGroup[] }>> =>
  api.get('/groups/explore', { params: subject ? { subject } : {} });

export const fetchGroup = (groupId: string): Promise<ApiResponse<{ group: StudyGroup }>> =>
  api.get(`/groups/${groupId}`);

export const createGroup = (payload: {
  name: string;
  description: string;
  subject: string;
  maxMembers: number;
  isTemporary: boolean;
  meetingTime?: string;
  charter?: { objective: string; expectations: string[] };
}): Promise<ApiResponse<{ group: StudyGroup }>> =>
  api.post('/groups', payload);

export const updateGroup = (
  groupId: string,
  payload: Partial<{
    name: string;
    description: string;
    subject: string;
    maxMembers: number;
    meetingTime: string;
    isTemporary: boolean;
  }>
): Promise<ApiResponse<{ group: StudyGroup }>> =>
  api.put(`/groups/${groupId}`, payload);

export const deleteGroup = (groupId: string): Promise<ApiResponse<Record<string, never>>> =>
  api.delete(`/groups/${groupId}`);

export const joinGroup = (groupId: string): Promise<ApiResponse<Record<string, never>>> =>
  api.post(`/groups/${groupId}/join`);

export const leaveGroup = (groupId: string): Promise<ApiResponse<Record<string, never>>> =>
  api.post(`/groups/${groupId}/leave`);

export const removeMember = (
  groupId: string,
  memberId: string
): Promise<ApiResponse<Record<string, never>>> =>
  api.delete(`/groups/${groupId}/members/${memberId}`);

// ── Tasks ────────────────────────────────────────────────────────────────────

export const fetchTasks = (groupId: string): Promise<ApiResponse<{ tasks: GroupTask[] }>> =>
  api.get(`/groups/${groupId}/tasks`);

export const createTask = (
  groupId: string,
  payload: { title: string; assignedTo?: string; dueDate?: string }
): Promise<ApiResponse<{ task: GroupTask }>> =>
  api.post(`/groups/${groupId}/tasks`, payload);

export const updateTask = (
  groupId: string,
  taskId: string,
  payload: Partial<{ completed: boolean; title: string; dueDate: string; assignedTo: string }>
): Promise<ApiResponse<{ task: GroupTask }>> =>
  api.patch(`/groups/${groupId}/tasks/${taskId}`, payload);

export const deleteTask = (
  groupId: string,
  taskId: string
): Promise<ApiResponse<Record<string, never>>> =>
  api.delete(`/groups/${groupId}/tasks/${taskId}`);

// ── Resources ────────────────────────────────────────────────────────────────

export const fetchResources = (
  groupId: string
): Promise<ApiResponse<{ resources: GroupResource[] }>> =>
  api.get(`/groups/${groupId}/resources`);

export const createResource = (
  groupId: string,
  payload: { title: string; url: string; category: string }
): Promise<ApiResponse<{ resource: GroupResource }>> =>
  api.post(`/groups/${groupId}/resources`, payload);

export const deleteResource = (
  groupId: string,
  resourceId: string
): Promise<ApiResponse<Record<string, never>>> =>
  api.delete(`/groups/${groupId}/resources/${resourceId}`);

// ── Messages ─────────────────────────────────────────────────────────────────

export const fetchMessages = (
  groupId: string,
  limit?: number
): Promise<ApiResponse<{ messages: GroupMessage[] }>> =>
  api.get(`/groups/${groupId}/messages`, { params: limit ? { limit } : {} });

export const sendMessage = (
  groupId: string,
  content: string
): Promise<ApiResponse<{ message: GroupMessage }>> =>
  api.post(`/groups/${groupId}/messages`, { content });
