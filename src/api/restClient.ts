// src/api/restClient.ts
import axios from 'axios';
import { userStorage } from '../store/userStore';

const BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';
export const apiClient = axios.create({ baseURL: `${BASE}/api`, timeout: 10000 });

apiClient.interceptors.request.use(cfg => {
  try {
    const u = JSON.parse(userStorage.getString('current_user') ?? 'null');
    if (u?.token) cfg.headers.Authorization = `Bearer ${u.token}`;
  } catch {}
  return cfg;
});

export const authAPI = {
  loginGuest: (username: string) => apiClient.post('/auth/guest', { username }),
  login: (email: string, password: string) => apiClient.post('/auth/login', { email, password }),
  register: (u: string, e: string, p: string) => apiClient.post('/auth/register', { username:u, email:e, password:p }),
};

export const profileAPI = {
  getProfile: (id: string) => apiClient.get(`/users/${id}`),
  getRecentGames: (id: string) => apiClient.get(`/users/${id}/games?limit=5`),
  getGameHistory: (id: string, page=1) => apiClient.get(`/users/${id}/games?page=${page}`),
};
