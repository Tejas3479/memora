import { create } from 'zustand';
import { api } from '../api/client.js';
import { SearchResult, SynthesizedAnswer } from '@memora/shared';

interface SearchState {
  query: string;
  results: SearchResult[];
  synthesizedAnswer: SynthesizedAnswer | null;
  isSearching: boolean;
  filters: Record<string, any>;
  setQuery: (q: string) => void;
  setFilters: (f: Record<string, any>) => void;
  search: () => Promise<void>;
  clearResults: () => void;
}

export const useSearchStore = create<SearchState>((set, get) => ({
  query: '',
  results: [],
  synthesizedAnswer: null,
  isSearching: false,
  filters: {},

  setQuery: (query) => set({ query }),
  setFilters: (filters) => set({ filters }),

  search: async () => {
    const { query, filters } = get();
    if (!query) return;

    set({ isSearching: true });
    try {
      const response = await api.post('/api/search', { query, filters });
      set({
        results: response.results || [],
        synthesizedAnswer: response.synthesizedAnswer || null,
        isSearching: false,
      });
    } catch (err) {
      console.error('[SearchStore] Error performing search:', err);
      set({ isSearching: false });
    }
  },

  clearResults: () => set({ results: [], synthesizedAnswer: null }),
}));
