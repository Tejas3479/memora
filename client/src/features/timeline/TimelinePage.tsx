import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTimelineInfiniteQuery } from '../../hooks/useQueries.js';
import MemoryCard from '../../components/MemoryCard.js';
import CaptureModal from '../../components/CaptureModal.js';
import useInfiniteScroll from '../../hooks/useInfiniteScroll.js';
import { Plus } from 'lucide-react';

export default function TimelinePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const folderId = searchParams.get('folderId') || '';
  const paramSource = searchParams.get('source') || '';
  const [sourceFilter, setSourceFilter] = useState(paramSource);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [isCaptureOpen, setIsCaptureOpen] = useState(false);

  useEffect(() => {
    if (paramSource) {
      setSourceFilter(paramSource);
    }
  }, [paramSource]);

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useTimelineInfiniteQuery({
    source: sourceFilter,
    folderId,
    dateFrom,
    dateTo,
    limit: 12,
  });

  const items = data ? data.pages.flatMap((page) => page.items) : [];

  const sentinelRef = useInfiniteScroll(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, {
    enabled: Boolean(hasNextPage) && !isFetchingNextPage,
  });

  const sources = [
    { label: 'All Logs', value: '' },
    { label: 'Web', value: 'web' },
    { label: 'Slack', value: 'slack' },
    { label: 'Notion', value: 'notion' },
    { label: 'GitHub', value: 'github' },
    { label: 'Documents', value: 'document' },
    { label: 'Notes', value: 'note' },
    { label: 'Dream Insights', value: 'DREAM' },
  ];

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto animate-fade-in font-sans">
      <div className="flex justify-between items-center select-none">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wide">Memory Timeline</h1>
          <p className="text-sm text-memora-text-muted">Chronological history of all indexed captures.</p>
        </div>
        <button
          onClick={() => setIsCaptureOpen(true)}
          className="px-4 py-2 bg-memora-accent text-white font-semibold rounded-lg text-sm hover:bg-memora-accent-hover active:scale-95 transition-all duration-200 cursor-pointer shadow-lg shadow-memora-accent-glow flex items-center gap-1.5"
        >
          <Plus size={16} />
          Capture Memory
        </button>
      </div>

      <CaptureModal isOpen={isCaptureOpen} onClose={() => setIsCaptureOpen(false)} />

      {/* Date Scrubber */}
      <div className="flex flex-wrap items-center gap-3 bg-memora-surface/60 border border-memora-border p-3 rounded-2xl text-xs select-none">
        <span className="text-memora-text-muted font-bold uppercase tracking-wider text-[9px]">Date Scrubber</span>
        <div className="flex items-center gap-2">
          <span className="text-memora-text-muted">From:</span>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="bg-[#050508]/80 border border-memora-border rounded-lg px-2 py-1 text-white focus:outline-none focus:border-memora-accent cursor-pointer text-xs"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-memora-text-muted">To:</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="bg-[#050508]/80 border border-memora-border rounded-lg px-2 py-1 text-white focus:outline-none focus:border-memora-accent cursor-pointer text-xs"
          />
        </div>
        {(dateFrom || dateTo) && (
          <button
            onClick={() => {
              setDateFrom('');
              setDateTo('');
            }}
            className="ml-auto text-[10px] text-memora-accent hover:underline font-bold uppercase cursor-pointer"
          >
            Reset Scrubber
          </button>
        )}
      </div>

      {folderId && (
        <div className="flex items-center justify-between bg-memora-accent/15 border border-memora-accent/30 px-3.5 py-1.5 rounded-xl text-xs text-white">
          <span>Filtering by folder: <code className="font-mono text-memora-accent">{folderId}</code></span>
          <button
            onClick={() => {
              searchParams.delete('folderId');
              setSearchParams(searchParams);
            }}
            className="text-memora-accent hover:underline text-[11px] font-semibold cursor-pointer"
          >
            Clear Folder Filter
          </button>
        </div>
      )}

      {/* Floating Capsule Tags */}
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

      {(isLoading || isFetchingNextPage) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-40 shimmer rounded-2xl border border-white/5"></div>
          <div className="h-40 shimmer rounded-2xl border border-white/5"></div>
        </div>
      )}

      {!isLoading && items.length === 0 && (
        <div className="glass p-8 rounded-2xl text-center text-memora-text-muted flex flex-col items-center gap-2 select-none">
          <div className="text-sm font-semibold text-white">No timeline records found</div>
          <div className="text-xs">Try clearing filters or ingest a new document/URL to see your timeline.</div>
        </div>
      )}

      {/* Sentinel element for infinite scroll */}
      <div ref={sentinelRef} className="h-10"></div>
    </div>
  );
}
