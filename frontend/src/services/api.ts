import axios from 'axios';
import type { ApiResponse } from '../types';

// In production, VITE_API_BASE_URL points to the deployed Flask backend.
// In development, Vite proxy rewrites /api → http://localhost:5000/api automatically.
const baseURL = import.meta.env.VITE_API_BASE_URL
  ? `${import.meta.env.VITE_API_BASE_URL}/api`
  : '/api';

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT Token if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('studybuddy_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response Interceptor: Format errors cleanly
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response && error.response.data) {
      const apiError: ApiResponse = error.response.data;
      return Promise.reject(apiError.error?.message || 'An API error occurred');
    }
    return Promise.reject(error.message || 'Network error connection failed');
  }
);

export default api;
