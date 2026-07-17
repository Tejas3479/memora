import React, { useState } from 'react';
import { useSearchStore } from '../store/searchStore.js';
import { Search, Filter, RefreshCw } from 'lucide-react';

export default function SearchBar() {
  const { query, setQuery, search, isSearching, filters, setFilters } = useSearchStore();
  const [showFilters, setShowFilters] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    search();
  };

  const handleSourceFilterChange = (source: string) => {
    setFilters({ ...filters, source: source || undefined });
  };

  return (
    <div className="w-full flex flex-col gap-3">
      <form onSubmit={handleSearchSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-memora-text-muted" size={20} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask anything or search your memory layer... (e.g. Scaling Qdrant config)"
            className="w-full h-12 pl-12 pr-4 bg-memora-surface border border-memora-border rounded-lg text-white focus:outline-none focus:border-memora-accent focus:ring-1 focus:ring-memora-accent"
          />
        </div>
        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className={`px-4 rounded-lg border border-memora-border flex items-center justify-center gap-2 text-sm font-medium ${
            showFilters ? 'bg-memora-accent border-memora-accent text-white' : 'bg-memora-surface text-memora-text-muted hover:text-white'
          }`}
        >
          <Filter size={18} />
          Filters
        </button>
        <button
          type="submit"
          disabled={isSearching}
          className="px-6 rounded-lg bg-memora-accent text-white font-semibold flex items-center justify-center gap-2 hover:bg-memora-accent-hover shadow-lg shadow-memora-accent-glow disabled:opacity-50"
        >
          {isSearching ? <RefreshCw className="animate-spin" size={18} /> : 'Search'}
        </button>
      </form>

      {showFilters && (
        <div className="glass p-4 rounded-lg flex flex-wrap gap-4 animate-fade-in">
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-memora-text-muted">Source Type</span>
            <select
              value={filters.source || ''}
              onChange={(e) => handleSourceFilterChange(e.target.value)}
              className="bg-memora-bg border border-memora-border text-white text-sm rounded px-3 py-1.5 focus:outline-none"
            >
              <option value="">All Sources</option>
              <option value="web">Web Pages</option>
              <option value="slack">Slack Chats</option>
              <option value="notion">Notion Pages</option>
              <option value="github">GitHub Repos</option>
              <option value="document">Documents</option>
              <option value="note">My Notes</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
}
