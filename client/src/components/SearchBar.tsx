import React, { useState, useEffect, useRef } from 'react';
import { useSearchStore } from '../store/searchStore.js';
import { Search, Filter, RefreshCw } from 'lucide-react';

export default function SearchBar() {
  const { query, setQuery, search, isSearching, filters, setFilters } = useSearchStore();
  const [showFilters, setShowFilters] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Global Ctrl+K / Cmd+K listener (Section 9.1)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    search();
  };

  const handleSourceFilterChange = (source: string) => {
    setFilters({ ...filters, source: source || undefined });
  };

  return (
    <div className="w-full flex flex-col gap-3 search-focus-container transition-all duration-300">
      <form onSubmit={handleSearchSubmit} className="flex gap-2">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-memora-text-muted transition-colors group-focus-within:text-memora-accent" size={20} />
          
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask anything or search your memory cosmos... (e.g., Qdrant cluster specs)"
            className="w-full h-12 pl-12 pr-16 bg-memora-surface/80 border border-memora-border rounded-xl text-white placeholder-memora-text-muted/60 focus:outline-none focus:border-memora-accent focus:ring-2 focus:ring-memora-accent/30 transition-all duration-200"
          />
          
          {/* Visual Ctrl+K shortcut badge */}
          <div className="absolute right-4 top-1/2 -translate-y-1/2 bg-memora-border/50 border border-memora-border text-xxs px-2 py-1 rounded text-memora-text-muted font-mono select-none pointer-events-none group-focus-within:hidden">
            ⌘K
          </div>
        </div>
        
        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className={`px-4 rounded-xl border border-memora-border flex items-center justify-center gap-2 text-sm font-medium transition-all duration-200 active:scale-95 ${
            showFilters ? 'bg-memora-accent border-memora-accent text-white shadow-lg shadow-memora-accent-glow' : 'bg-memora-surface text-memora-text-muted hover:text-white'
          }`}
        >
          <Filter size={18} />
          Filters
        </button>
        
        <button
          type="submit"
          disabled={isSearching}
          className="px-6 rounded-xl bg-memora-accent text-white font-semibold flex items-center justify-center gap-2 hover:bg-memora-accent-hover active:scale-95 transition-all duration-200 shadow-lg shadow-memora-accent-glow disabled:opacity-50"
        >
          {isSearching ? <RefreshCw className="animate-spin" size={18} /> : 'Search'}
        </button>
      </form>

      {showFilters && (
        <div className="glass p-4 rounded-xl flex flex-wrap gap-4 animate-fade-in">
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-memora-text-muted">Source Type</span>
            <select
              value={filters.source || ''}
              onChange={(e) => handleSourceFilterChange(e.target.value)}
              className="bg-memora-bg border border-memora-border text-white text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-memora-accent"
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
