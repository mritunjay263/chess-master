// src/store/userStore.ts
import { create } from 'zustand';
import { MMKV } from 'react-native-mmkv';
import type { User } from '../types';

export const userStorage = new MMKV({ id: 'chess-user' });
const KEY = 'current_user';
function load(): User | null {
  try { return JSON.parse(userStorage.getString(KEY) ?? 'null'); } catch { return null; }
}
interface Store { user: User|null; isGuest: boolean; setUser:(u:User,g?:boolean)=>void; updateUser:(p:Partial<User>)=>void; logout:()=>void; }
export const useUserStore = create<Store>((set, get) => ({
  user: load(),
  isGuest: userStorage.getBoolean('is_guest') ?? false,
  setUser: (user, isGuest=false) => { userStorage.set(KEY, JSON.stringify(user)); userStorage.set('is_guest', isGuest); set({ user, isGuest }); },
  updateUser: (partial) => { const u = { ...get().user!, ...partial }; userStorage.set(KEY, JSON.stringify(u)); set({ user: u }); },
  logout: () => { userStorage.delete(KEY); userStorage.delete('is_guest'); set({ user: null, isGuest: false }); },
}));
