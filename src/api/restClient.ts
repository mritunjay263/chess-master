// src/api/restClient.ts
import axios from 'axios';
import { BACKEND_URL } from './config';
import { useUserStore } from '../store/userStore';

const api = axios.create({ baseURL: BACKEND_URL, timeout: 10000 });

api.interceptors.request.use(cfg => {
  const token = useUserStore.getState().token;
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

export const authAPI = {
  loginGuest: (username: string) => api.post('/auth/guest', { username }),
};

export const userAPI = {
  getProfile: () => api.get('/user/me'),
};
