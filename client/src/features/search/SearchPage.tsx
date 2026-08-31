import React, { useState } from 'react';
import { useSearchStream } from '../../hooks/useSearchStream.js';
import MemoryCard from '../../components/MemoryCard.js';
import { Search, Filter, RefreshCw, Sparkles, ExternalLink, SearchCode, Square, Network } from 'lucide-react';

export default function SearchPage() {
  const {
    query,
    setQuery,
    results,
    subQueries,
    streamingAnswer,
    synthesizedAnswer,
    isSearching,
    error,
    executeSearch,
    abortSearch,
  } = useSearchStream();

  const [showFilters, setShowFilters] = useState(false);
  const [sourceFilter, setSourceFilter] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    executeSearch(query, { source: sourceFilter || undefined });
  };

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto animate-fade-in font-sans">
      <div className="flex flex-col gap-2 select-none">
        <h1 className="text-2xl font-bold text-white tracking-wide">Ask your Memory Layer</h1>
        <p className="text-sm text-memora-text-muted">
          Type natural language questions, multi-part inquiries, or keywords to synthesize answers across all indexed memories.
        </p>
      </div>

      {/* Search Input Bar */}
      <div className="w-full flex flex-col gap-3">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-memora-text-muted group-focus-within:text-memora-accent transition-colors" size={20} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask anything... (e.g., 'Compare the Q3 architecture specs with Sarah\'s feedback')"
              className="w-full h-12 pl-12 pr-16 bg-memora-surface/80 border border-memora-border rounded-xl text-white placeholder-memora-text-muted/60 focus:outline-none focus:border-memora-accent focus:ring-2 focus:ring-memora-accent/30 transition-all duration-200 text-sm"
            />
          </div>

          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 rounded-xl border border-memora-border flex items-center justify-center gap-2 text-xs font-semibold transition-all duration-200 active:scale-95 cursor-pointer ${
              showFilters ? 'bg-memora-accent border-memora-accent text-white shadow-lg shadow-memora-accent-glow' : 'bg-memora-surface text-memora-text-muted hover:text-white'
            }`}
          >
            <Filter size={16} />
            Filters
          </button>

          {isSearching ? (
            <button
              type="button"
              onClick={abortSearch}
              className="px-5 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 font-semibold flex items-center justify-center gap-2 hover:bg-red-500/30 active:scale-95 transition-all text-xs cursor-pointer"
            >
              <Square size={14} className="fill-current" />
              Stop
            </button>
          ) : (
            <button
              type="submit"
              disabled={!query.trim()}
              className="px-6 rounded-xl bg-memora-accent text-white font-semibold flex items-center justify-center gap-2 hover:bg-memora-accent-hover active:scale-95 transition-all duration-200 shadow-lg shadow-memora-accent-glow disabled:opacity-50 text-xs cursor-pointer"
            >
              Search
            </button>
          )}
        </form>

        {showFilters && (
          <div className="glass p-4 rounded-xl flex flex-wrap gap-4 animate-fade-in">
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-memora-text-muted">Filter Source</span>
              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                className="bg-memora-bg border border-memora-border text-white text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-memora-accent"
              >
                <option value="">All Sources</option>
                <option value="web">Web Pages</option>
                <option value="slack">Slack Chats</option>
                <option value="notion">Notion Pages</option>
                <option value="github">GitHub Repos</option>
                <option value="document">Documents</option>
                <option value="note">My Notes</option>
                <option value="DREAM">Dream Insights</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Sub-Queries Decomposition Badge Banner */}
      {subQueries.length > 1 && (
        <div className="glass p-4 rounded-2xl border border-memora-accent/20 flex flex-col gap-2 animate-fade-in">
          <div className="flex items-center gap-2 text-xs font-bold text-memora-accent uppercase tracking-wider select-none">
            <Network size={14} />
            <span>Agentic Query Decomposition ({subQueries.length} parallel hops)</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {subQueries.map((sub, i) => (
              <span
                key={i}
                className="text-xs bg-[#050508]/80 border border-memora-border text-white/90 px-3 py-1 rounded-lg font-mono"
              >
                Hop {i + 1}: {sub}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Live Streaming Answer / Synthesized Answer Card */}
      {(streamingAnswer || synthesizedAnswer) && (
        <div className="bg-[#0f0f16]/90 backdrop-blur-md text-slate-200 border border-white/10 shadow-[0_0_25px_rgba(0,0,0,0.3)] p-6 rounded-2xl flex flex-col gap-4 animate-fade-in relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-memora-accent font-semibold text-xs tracking-wide uppercase select-none">
              <Sparkles size={16} className={isSearching ? 'animate-spin' : 'animate-pulse'} />
              <span>{isSearching ? 'Synthesizing Live Response...' : 'Synthesized Answer'}</span>
            </div>

            {synthesizedAnswer && (
              <span className="text-[10px] bg-green-500/20 text-green-400 border border-green-500/30 px-2.5 py-0.5 rounded-full font-mono font-semibold">
                Confidence: {Math.round((synthesizedAnswer.confidence || 0.9) * 100)}%
              </span>
            )}
          </div>

          <p className="text-sm text-white/90 leading-relaxed whitespace-pre-wrap font-sans">
            {streamingAnswer || synthesizedAnswer?.answer}
            {isSearching && <span className="inline-block w-2 h-4 bg-memora-accent ml-1 animate-pulse"></span>}
          </p>

          {/* Citations and References */}
          {synthesizedAnswer?.sources && synthesizedAnswer.sources.length > 0 && (
            <div className="border-t border-memora-border pt-4 flex flex-col gap-2.5">
              <span className="text-xs font-semibold text-memora-text-muted select-none">
                Citations & References
              </span>
              <div className="flex flex-wrap gap-2">
                {synthesizedAnswer.sources.map((src, i) => (
                  <a
                    key={i}
                    href={src.url || '#'}
                    target="_blank"
                    rel="noreferrer"
                    title={src.title}
                    className="bg-[#7c3aed]/10 border border-[#7c3aed]/20 text-xs px-3 py-1 rounded-full hover:bg-[#7c3aed]/20 transition-all duration-200 flex items-center gap-1.5 text-white/90 hover:border-memora-accent"
                  >
                    <span className="font-mono">[{i + 1}]</span>
                    <span className="truncate max-w-xs">{src.title}</span>
                    <ExternalLink size={12} className="text-memora-text-muted shrink-0" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Loading Skeleton */}
      {isSearching && !streamingAnswer && (
        <div className="flex flex-col gap-4">
          <div className="h-32 shimmer rounded-2xl border border-white/5"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="h-40 shimmer rounded-2xl border border-white/5"></div>
            <div className="h-40 shimmer rounded-2xl border border-white/5"></div>
          </div>
        </div>
      )}

      {/* Matching Memory Results */}
      {results.length > 0 && (
        <div className="flex flex-col gap-4 mt-2">
          <h3 className="font-semibold text-xs text-memora-text-muted uppercase tracking-wider">
            Matching Memory Items ({results.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {results.map((item, idx) => (
              <MemoryCard key={`${item.id}-${idx}`} memory={item} />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isSearching && results.length === 0 && !streamingAnswer && (
        <div className="flex flex-col items-center justify-center py-20 text-memora-text-muted gap-3 select-none">
          <SearchCode size={48} className="text-memora-border" />
          <div className="text-sm">No memories queried yet. Ask a question above to begin!</div>
        </div>
      )}
    </div>
  );
}
