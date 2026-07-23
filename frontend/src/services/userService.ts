import api from './api';
import type { UserProfile, User, ApiResponse } from '../types';

export const userService = {
  getProfile: async (): Promise<{ profile: UserProfile; isProfileComplete: boolean }> => {
    const res: ApiResponse<{ profile: UserProfile; isProfileComplete: boolean }> = await api.get('/users/profile');
    return res.data;
  },

  updateProfile: async (profileData: Partial<UserProfile>): Promise<User> => {
    const res: ApiResponse<{ user: User }> = await api.put('/users/profile', profileData);
    return res.data.user;
  },

  getUserById: async (userId: string): Promise<User> => {
    const res: ApiResponse<{ user: User }> = await api.get(`/users/${userId}`);
    return res.data.user;
  },
};
