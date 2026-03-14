import { create } from 'zustand';
import type { AuthState, User } from '../types/auth';

const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('token'),

  login: (token: string, user: User) => {
    localStorage.setItem('token', token);
    set({ token, user });
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ token: null, user: null });
  },
}));

export default useAuthStore;
