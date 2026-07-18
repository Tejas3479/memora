import React, { useEffect } from 'react';
import useTimelineStore from '../../store/timelineStore.js';
import MemoryCard from '../../components/MemoryCard.js';
import useInfiniteScroll from '../../hooks/useInfiniteScroll.js';

export default function TimelinePage() {
  const { items, isLoading, hasMore, fetchMore, sourceFilter, setSourceFilter, dateFrom, dateTo, setDateFilter, reset } = useTimelineStore();

  useEffect(() => {
    reset();
    fetchMore();
  }, [fetchMore, reset]);

  const sentinelRef = useInfiniteScroll(fetchMore, {
    enabled: hasMore && !isLoading,
  });

  const sources = [
    { label: 'All Logs', value: '' },
    { label: 'Web', value: 'web' },
    { label: 'Slack', value: 'slack' },
    { label: 'Notion', value: 'notion' },
    { label: 'GitHub', value: 'github' },
    { label: 'Documents', value: 'document' },
    { label: 'Notes', value: 'note' },
  ];

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto animate-fade-in font-sans">
      <div className="flex justify-between items-center select-none">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wide">Memory Timeline</h1>
          <p className="text-sm text-memora-text-muted">Chronological history of all indexed captures.</p>
        </div>
      </div>

      {/* Date Scrubber */}
      <div className="flex flex-wrap items-center gap-3 bg-memora-surface/60 border border-memora-border p-3 rounded-2xl text-xs select-none">
        <span className="text-memora-text-muted font-bold uppercase tracking-wider text-[9px]">Date Scrubber</span>
        <div className="flex items-center gap-2">
          <span className="text-memora-text-muted">From:</span>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFilter(e.target.value, dateTo)}
            className="bg-[#050508]/80 border border-memora-border rounded-lg px-2 py-1 text-white focus:outline-none focus:border-memora-accent cursor-pointer text-xs"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-memora-text-muted">To:</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateFilter(dateFrom, e.target.value)}
            className="bg-[#050508]/80 border border-memora-border rounded-lg px-2 py-1 text-white focus:outline-none focus:border-memora-accent cursor-pointer text-xs"
          />
        </div>
        {(dateFrom || dateTo) && (
          <button
            onClick={() => setDateFilter('', '')}
            className="ml-auto text-[10px] text-memora-accent hover:underline font-bold uppercase cursor-pointer"
          >
            Reset Scrubber
          </button>
        )}
      </div>

      {/* Floating Capsule Tags (Section 3.2) */}
      <div className="flex gap-2 pb-2 overflow-x-auto select-none no-scrollbar">
        {sources.map((src) => (
          <button
            key={src.value}
            onClick={() => setSourceFilter(src.value)}
            className={`px-4 py-1.5 rounded-full border text-xs font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer active:scale-95 ${
              sourceFilter === src.value
                ? 'bg-memora-accent border-memora-accent text-white shadow-lg shadow-memora-accent-glow'
                : 'border-memora-border bg-memora-surface text-memora-text-muted hover:text-white hover:border-white/10'
            }`}
          >
            {src.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map((item, idx) => (
          <MemoryCard key={`${item.id}-${idx}`} memory={item} />
        ))}
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-40 shimmer rounded-2xl border border-white/5"></div>
          <div className="h-40 shimmer rounded-2xl border border-white/5"></div>
        </div>
      )}

      {/* Sentinel element for infinite scroll */}
      <div ref={sentinelRef} className="h-10"></div>
    </div>
  );
}
