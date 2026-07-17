import { create } from 'zustand';
import { api } from '../api/client.js';
import { SearchResult } from '@memora/shared';

interface TimelineState {
  items: SearchResult[];
  isLoading: boolean;
  hasMore: boolean;
  offset: number;
  sourceFilter: string;
  fetchMore: () => Promise<void>;
  reset: () => void;
  setSourceFilter: (src: string) => void;
}

export const useTimelineStore = create<TimelineState>((set, get) => ({
  items: [],
  isLoading: false,
  hasMore: true,
  offset: 0,
  sourceFilter: '',

  setSourceFilter: (sourceFilter) => {
    set({ sourceFilter, items: [], offset: 0, hasMore: true });
    get().fetchMore();
  },

  reset: () => {
    set({ items: [], offset: 0, hasMore: true, sourceFilter: '' });
  },

  fetchMore: async () => {
    const { items, offset, sourceFilter, isLoading, hasMore } = get();
    if (isLoading || !hasMore) return;

    set({ isLoading: true });
    try {
      const url = `/api/timeline?limit=10&offset=${offset}${sourceFilter ? `&source=${sourceFilter}` : ''}`;
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
