// src/api/client.ts — axios REST client with auth interceptor
import axios from 'axios';
import { API_CONFIG } from './config';
import { useUserStore } from '@store/userStore';

export const api = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT_MS,
});

api.interceptors.request.use((cfg) => {
  const token = useUserStore.getState().token;
  if (token) {
    cfg.headers = cfg.headers ?? {};
    cfg.headers.Authorization = `Bearer ${token}`;
  }
  return cfg;
});

// Domain endpoints — keep thin; React Query will own caching/state
export const AuthApi = {
  login: (email: string, password: string) =>
    api.post<{ token: string; user: import('@/types/index').PlayerInfo }>('/auth/login', {
      email,
      password,
    }),
  register: (email: string, password: string, username: string) =>
    api.post<{ token: string; user: import('@/types/index').PlayerInfo }>('/auth/register', {
      email,
      password,
      username,
    }),
  me: () => api.get<import('@/types/index').PlayerInfo>('/auth/me'),
};

export const GameApi = {
  history: (userId: string, page = 1) =>
    api.get<{ games: any[]; hasMore: boolean }>(`/users/${userId}/games`, { params: { page } }),
  stats: (userId: string) =>
    api.get<{
      wins: number;
      losses: number;
      draws: number;
      rating: number;
      avgGameLengthMs: number;
      favouriteOpening?: string;
    }>(`/users/${userId}/stats`),
};

export const LeaderboardApi = {
  top: (limit = 50) => api.get<{ players: import('@/types/index').PlayerInfo[] }>('/leaderboard', {
    params: { limit },
  }),
};
