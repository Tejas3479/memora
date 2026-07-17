import { create } from 'zustand';
import { api } from '../api/client.js';

interface AuthState {
  user: any | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  checkAuth: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  setToken: (token: string) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: true,

  setToken: (token: string) => {
    set({ accessToken: token });
  },

  checkAuth: async () => {
    try {
      const response = await fetch('/auth/me', {
        headers: get().accessToken ? { Authorization: `Bearer ${get().accessToken}` } : {},
      });
      if (response.ok) {
        const user = await response.json();
        set({ user, isAuthenticated: true, isLoading: false });
      } else {
        // Attempt rotation
        const refreshResponse = await fetch('/auth/refresh', { method: 'POST' });
        if (refreshResponse.ok) {
          const { accessToken } = await refreshResponse.json();
          set({ accessToken });
          const userRes = await fetch('/auth/me', {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          if (userRes.ok) {
            const user = await userRes.json();
            set({ user, isAuthenticated: true, isLoading: false });
            return;
          }
        }
        set({ user: null, accessToken: null, isAuthenticated: false, isLoading: false });
      }
    } catch {
      set({ user: null, accessToken: null, isAuthenticated: false, isLoading: false });
    }
  },

  login: async (email, password) => {
    set({ isLoading: true });
    const response = await fetch('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      set({ isLoading: false });
      throw new Error('Invalid email or password');
    }

    const { user, accessToken } = await response.json();
    set({ user, accessToken, isAuthenticated: true, isLoading: false });

    // Sync extension if present
    const chromeInstance = (window as any).chrome;
    if (typeof chromeInstance !== 'undefined' && chromeInstance.runtime) {
      chromeInstance.runtime.sendMessage({ type: 'SET_TOKEN', payload: accessToken });
    }
  },

  register: async (email, password, name) => {
    set({ isLoading: true });
    const response = await fetch('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
    });

    if (!response.ok) {
      set({ isLoading: false });
      throw new Error('Registration failed');
    }

    const { user, accessToken } = await response.json();
    set({ user, accessToken, isAuthenticated: true, isLoading: false });
  },

  logout: async () => {
    await fetch('/auth/logout', { method: 'POST' });
    set({ user: null, accessToken: null, isAuthenticated: false });
  },
}));
