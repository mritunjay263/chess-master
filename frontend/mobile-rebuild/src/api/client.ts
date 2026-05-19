// ============================================================
// src/api/client.ts — Axios REST client with auth token inject
// ============================================================
import axios from 'axios';
import { API_BASE_URL } from './config';
import { useUserStore } from '../store/userStore';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' },
});

// Inject JWT token on every request
apiClient.interceptors.request.use((config) => {
  const token = useUserStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ---------- Auth endpoints ----------
export const authAPI = {
  login: (email: string, password: string) =>
    apiClient.post<{ user: any; token: string }>('/auth/login', { email, password }),

  register: (email: string, password: string, username: string) =>
    apiClient.post<{ user: any; token: string }>('/auth/register', { email, password, username }),

  getProfile: () =>
    apiClient.get('/users/me'),

  getGameHistory: (userId: string, page = 1) =>
    apiClient.get(`/users/${userId}/games?page=${page}&limit=20`),
};
