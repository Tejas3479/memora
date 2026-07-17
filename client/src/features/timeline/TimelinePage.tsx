import React, { useEffect } from 'react';
import useTimelineStore from '../../store/timelineStore.js';
import MemoryCard from '../../components/MemoryCard.js';
import useInfiniteScroll from '../../hooks/useInfiniteScroll.js';

export default function TimelinePage() {
  const { items, isLoading, hasMore, fetchMore, sourceFilter, setSourceFilter, reset } = useTimelineStore();

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
    <div className="flex flex-col gap-6 max-w-4xl mx-auto animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white font-sans">Memory Timeline</h1>
          <p className="text-sm text-memora-text-muted">Chronological history of all indexed captures.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-memora-border pb-px overflow-x-auto">
        {sources.map((src) => (
          <button
            key={src.value}
            onClick={() => setSourceFilter(src.value)}
            className={`px-4 py-2 border-b-2 text-sm font-semibold whitespace-nowrap -mb-px transition-colors ${
              sourceFilter === src.value
                ? 'border-memora-accent text-memora-accent'
                : 'border-transparent text-memora-text-muted hover:text-white'
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
          <div className="h-40 bg-memora-surface rounded-xl animate-pulse"></div>
          <div className="h-40 bg-memora-surface rounded-xl animate-pulse"></div>
        </div>
      )}

      {/* Sentinel element for infinite scroll */}
      <div ref={sentinelRef} className="h-10"></div>
    </div>
  );
}
