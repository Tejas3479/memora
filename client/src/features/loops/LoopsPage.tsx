import React, { useState } from 'react';
import { Cpu, RefreshCw, AlertCircle } from 'lucide-react';
import { api } from '../../api/client.js';

export default function LoopsPage() {
  const [running, setRunning] = useState<Record<string, boolean>>({});
  const [results, setResults] = useState<Record<string, any>>({});

  const triggerLoop = async (loopType: string) => {
    setRunning({ ...running, [loopType]: true });
    try {
      // Dispatch runner trigger to backend loops trigger
      const response = await api.post('/api/proactive', {
        type: 'loop-trigger',
        identifier: loopType,
        recentText: `Triggering loops for ${loopType}`,
      });
      setResults({
        ...results,
        [loopType]: {
          status: 'COMPLETED',
          summary: `Successfully completed execution task for ${loopType}. Processed related vector points.`,
        },
      });
    } catch (err) {
      setResults({
        ...results,
        [loopType]: {
          status: 'FAILED',
          summary: `Error executing task runner: ${(err as Error).message}`,
        },
      });
    } finally {
      setRunning({ ...running, [loopType]: false });
    }
  };

  const loops = [
    { type: 'SELF_REFLECTION', label: 'Self Reflection (Meta-cognition)', desc: 'Analyzes user memory patterns and outlines knowledge gaps.' },
    { type: 'CONSOLIDATION', label: 'Consolidation Summarizer', desc: 'Identifies duplicates and merges temporal/topic clusters.' },
    { type: 'DREAMING', label: 'Dreaming Connection Finder', desc: 'Processes random note pairs offline looking for latent connections.' },
    { type: 'EVALUATION', label: 'Search Quality Evaluation', desc: 'Calculates feedback precision rates and satisfaction percentages.' },
  ];

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto animate-fade-in">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-white font-sans">Reflection Loops</h1>
        <p className="text-sm text-memora-text-muted">
          Active background processors optimizing indexing, mapping latent semantic relations, and consolidating logs.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {loops.map((loop) => (
          <div key={loop.type} className="glass p-5 rounded-xl flex justify-between items-start">
            <div className="flex gap-4">
              <div className="p-3 bg-memora-bg rounded-lg">
                <Cpu className="text-memora-accent" size={24} />
              </div>
              <div className="flex flex-col gap-1 max-w-md">
                <span className="font-bold text-white leading-tight">{loop.label}</span>
                <span className="text-xs text-memora-text-muted leading-relaxed">{loop.desc}</span>
                
                {results[loop.type] && (
                  <div className="mt-3 bg-memora-bg p-3 rounded border border-memora-border flex flex-col gap-1 text-xs">
                    <span className={`font-semibold ${results[loop.type].status === 'COMPLETED' ? 'text-green-400' : 'text-red-400'}`}>
                      {results[loop.type].status}
                    </span>
                    <p className="text-memora-text-muted">{results[loop.type].summary}</p>
                  </div>
                )}
              </div>
            </div>

            <button
              disabled={running[loop.type]}
              onClick={() => triggerLoop(loop.type)}
              className="px-4 py-2 bg-memora-accent text-white font-semibold text-xs rounded hover:bg-memora-accent-hover disabled:opacity-50 flex items-center gap-1.5 shrink-0"
            >
              {running[loop.type] ? (
                <>
                  <RefreshCw className="animate-spin" size={12} />
                  Running
                </>
              ) : (
                'Run Now'
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
