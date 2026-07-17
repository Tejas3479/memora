import React from 'react';
import SearchBar from '../../components/SearchBar.js';
import AnswerCard from '../../components/AnswerCard.js';
import MemoryCard from '../../components/MemoryCard.js';
import { useSearchStore } from '../../store/searchStore.js';
import { SearchCode } from 'lucide-react';

export default function SearchPage() {
  const { results, synthesizedAnswer, isSearching } = useSearchStore();

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto animate-fade-in">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-white">Ask your Memory Layer</h1>
        <p className="text-sm text-memora-text-muted">
          Type natural language questions, exact keywords, or phrases to recall pages, chats, or documentation.
        </p>
      </div>

      <SearchBar />

      {isSearching && (
        <div className="flex flex-col gap-4">
          <div className="h-32 bg-memora-surface rounded-xl animate-pulse"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="h-40 bg-memora-surface rounded-xl animate-pulse"></div>
            <div className="h-40 bg-memora-surface rounded-xl animate-pulse"></div>
          </div>
        </div>
      )}

      {!isSearching && (
        <>
          {synthesizedAnswer && <AnswerCard answer={synthesizedAnswer} />}

          {results.length > 0 && (
            <div className="flex flex-col gap-4 mt-2">
              <h3 className="font-semibold text-sm text-memora-text-muted uppercase tracking-wider">
                Matching Memory Snips ({results.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {results.map((item) => (
                  <MemoryCard key={item.id} memory={item} />
                ))}
              </div>
            </div>
          )}

          {!isSearching && results.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-memora-text-muted gap-3">
              <SearchCode size={48} className="text-memora-border" />
              <div className="text-sm">No memories queried yet. Ask away!</div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
