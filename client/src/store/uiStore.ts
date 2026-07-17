import { create } from 'zustand';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning';
}

interface UiState {
  sidebarOpen: boolean;
  theme: 'dark' | 'light';
  activeTab: string;
  notifications: NotificationItem[];
  toggleSidebar: () => void;
  setTheme: (theme: 'dark' | 'light') => void;
  setActiveTab: (tab: string) => void;
  addNotification: (title: string, message: string, type?: 'info' | 'success' | 'warning') => void;
  removeNotification: (id: string) => void;
}

export const useUiStore = create<UiState>((set) => ({
  sidebarOpen: true,
  theme: 'dark',
  activeTab: 'search',
  notifications: [],

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setTheme: (theme) => set({ theme }),
  setActiveTab: (activeTab) => set({ activeTab }),

  addNotification: (title, message, type = 'info') => {
    const id = crypto.randomUUID();
    set((state) => ({
      notifications: [...state.notifications, { id, title, message, type }],
    }));
    setTimeout(() => {
      set((state) => ({
        notifications: state.notifications.filter((n) => n.id !== id),
      }));
    }, 6000);
  },

  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),
}));
