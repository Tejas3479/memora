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
  adhdFocusMode: boolean;
  reducedTransparency: boolean;
  colorBlindMode: boolean;
  toggleSidebar: () => void;
  toggleAdhdFocusMode: () => void;
  toggleReducedTransparency: () => void;
  toggleColorBlindMode: () => void;
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
  adhdFocusMode: false,
  reducedTransparency: false,
  colorBlindMode: false,

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  toggleAdhdFocusMode: () => set((state) => {
    const next = !state.adhdFocusMode;
    if (next) {
      document.body.classList.add('adhd-focus-active');
    } else {
      document.body.classList.remove('adhd-focus-active');
    }
    return { adhdFocusMode: next };
  }),
  toggleReducedTransparency: () => set((state) => {
    const next = !state.reducedTransparency;
    if (next) {
      document.body.classList.add('reduced-transparency-active');
    } else {
      document.body.classList.remove('reduced-transparency-active');
    }
    return { reducedTransparency: next };
  }),
  toggleColorBlindMode: () => set((state) => {
    const next = !state.colorBlindMode;
    if (next) {
      document.body.classList.add('color-blind-active');
    } else {
      document.body.classList.remove('color-blind-active');
    }
    return { colorBlindMode: next };
  }),
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
export default useUiStore;
