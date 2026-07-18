import { create } from 'zustand';
import { api } from '../api/client.js';
import { SearchResult } from '@memora/shared';

interface TimelineState {
  items: SearchResult[];
  isLoading: boolean;
  hasMore: boolean;
  offset: number;
  sourceFilter: string;
  dateFrom: string;
  dateTo: string;
  fetchMore: () => Promise<void>;
  reset: () => void;
  setSourceFilter: (src: string) => void;
  setDateFilter: (from: string, to: string) => void;
}

export const useTimelineStore = create<TimelineState>((set, get) => ({
  items: [],
  isLoading: false,
  hasMore: true,
  offset: 0,
  sourceFilter: '',
  dateFrom: '',
  dateTo: '',

  setSourceFilter: (sourceFilter) => {
    set({ sourceFilter, items: [], offset: 0, hasMore: true });
    get().fetchMore();
  },

  setDateFilter: (dateFrom, dateTo) => {
    set({ dateFrom, dateTo, items: [], offset: 0, hasMore: true });
    get().fetchMore();
  },

  reset: () => {
    set({ items: [], offset: 0, hasMore: true, sourceFilter: '', dateFrom: '', dateTo: '' });
  },

  fetchMore: async () => {
    const { items, offset, sourceFilter, dateFrom, dateTo, isLoading, hasMore } = get();
    if (isLoading || !hasMore) return;

    set({ isLoading: true });
    try {
      let url = `/api/timeline?limit=10&offset=${offset}`;
      if (sourceFilter) url += `&source=${sourceFilter}`;
      if (dateFrom) url += `&dateFrom=${dateFrom}`;
      if (dateTo) url += `&dateTo=${dateTo}`;

      const response = await api.get(url);

      set({
        items: [...items, ...(response.items || [])],
        offset: offset + (response.items || []).length,
        hasMore: response.hasMore,
        isLoading: false,
      });
    } catch (err) {
      console.error('[TimelineStore] Error fetching timeline items:', err);
      set({ isLoading: false });
    }
  },
}));
export default useTimelineStore;
