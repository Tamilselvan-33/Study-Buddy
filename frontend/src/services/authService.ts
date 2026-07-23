import api from './api';
import type { User, ApiResponse } from '../types';

export interface LoginParams {
  email: string;
  password: string;
}

export interface RegisterParams {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponseData {
  token: string;
  user: User;
}

export const authService = {
  register: async (params: RegisterParams): Promise<AuthResponseData> => {
    const res: ApiResponse<AuthResponseData> = await api.post('/auth/register', params);
    return res.data;
  },

  login: async (params: LoginParams): Promise<AuthResponseData> => {
    const res: ApiResponse<AuthResponseData> = await api.post('/auth/login', params);
    return res.data;
  },

  getCurrentUser: async (): Promise<User> => {
    const res: ApiResponse<{ user: User }> = await api.get('/auth/me');
    return res.data.user;
  },

  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
    localStorage.removeItem('studybuddy_token');
  },
};
