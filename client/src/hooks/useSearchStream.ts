import { useState, useRef, useCallback } from 'react';
import { SearchResult, SynthesizedAnswer } from '@memora/shared';
import { useAuthStore } from '../store/authStore.js';

export function useSearchStream() {
  const [isSearching, setIsSearching] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [subQueries, setSubQueries] = useState<string[]>([]);
  const [streamingAnswer, setStreamingAnswer] = useState('');
  const [synthesizedAnswer, setSynthesizedAnswer] = useState<SynthesizedAnswer | null>(null);
  const [error, setError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  const abortSearch = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsSearching(false);
  }, []);

  const executeSearch = useCallback(async (searchQuery: string, filters: Record<string, any> = {}) => {
    if (!searchQuery.trim()) return;

    abortSearch();

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsSearching(true);
    setQuery(searchQuery);
    setResults([]);
    setSubQueries([]);
    setStreamingAnswer('');
    setSynthesizedAnswer(null);
    setError(null);

    const token = useAuthStore.getState().accessToken;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          query: searchQuery,
          filters,
          stream: true,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error?.message || `Search failed with status ${response.status}`);
      }

      if (!response.body) {
        throw new Error('No response body available for streaming');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let accumulatedAnswer = '';
      let candidateResults: SearchResult[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) continue;
          const jsonStr = trimmed.replace(/^data:\s*/, '');

          try {
            const data = JSON.parse(jsonStr);

            if (data.type === 'sub_queries') {
              setSubQueries(data.subQueries || []);
            } else if (data.type === 'sources') {
              candidateResults = data.results || [];
              setResults(candidateResults);
            } else if (data.type === 'token') {
              accumulatedAnswer += data.token;
              setStreamingAnswer(accumulatedAnswer);
            } else if (data.type === 'done') {
              setSynthesizedAnswer({
                answer: accumulatedAnswer,
                sources: candidateResults.map((c) => ({
                  url: c.url,
                  title: c.title,
                  chunkId: c.chunkId,
                  snippet: c.content,
                })),
                confidence: candidateResults.length > 0 ? 0.9 : 0.2,
              });
            }
          } catch (e) {
            // Incomplete frame, continue reading
          }
        }
      }
    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        console.error('[useSearchStream] Error:', err);
        setError(err.message || 'Search failed');
      }
    } finally {
      setIsSearching(false);
      abortControllerRef.current = null;
    }
  }, [abortSearch]);

  return {
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
  };
}
export default useSearchStream;
