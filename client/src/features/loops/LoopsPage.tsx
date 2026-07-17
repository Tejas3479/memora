import React, { useState } from 'react';
import { Cpu, RefreshCw } from 'lucide-react';
import { api } from '../../api/client.js';

export default function LoopsPage() {
  const [running, setRunning] = useState<Record<string, boolean>>({});
  const [results, setResults] = useState<Record<string, any>>({});

  const triggerLoop = async (loopType: string) => {
    setRunning({ ...running, [loopType]: true });
    try {
      await api.post('/api/proactive', {
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
    <div className="flex flex-col gap-6 max-w-4xl mx-auto animate-fade-in font-sans">
      <div className="flex flex-col gap-1 select-none">
        <h1 className="text-2xl font-bold text-white tracking-wide">Reflection Loops</h1>
        <p className="text-sm text-memora-text-muted">
          Active background processors optimizing indexing, mapping latent semantic relations, and consolidating logs.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {loops.map((loop) => (
          <div key={loop.type} className="glass p-5 rounded-2xl border border-white/5 border-t border-white/12 flex justify-between items-start hover:scale-[1.01] hover:border-white/15 active:scale-[0.99] transition-all duration-250 ease-out">
            <div className="flex gap-4">
              <div className="p-3 bg-memora-bg rounded-xl border border-memora-border">
                <Cpu className="text-memora-accent animate-pulse" size={20} />
              </div>
              
              <div className="flex flex-col gap-1 max-w-md">
                <span className="font-bold text-white text-base leading-snug">{loop.label}</span>
                <span className="text-xs text-memora-text-muted leading-relaxed">{loop.desc}</span>
                
                {results[loop.type] && (
                  <div className="mt-4 bg-[#050508]/60 p-3 rounded-xl border border-memora-border flex flex-col gap-1 text-xs animate-fade-in">
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
              className="px-4 py-2 bg-memora-accent text-white font-semibold text-xs rounded-lg hover:bg-memora-accent-hover active:scale-95 transition-all duration-200 cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shrink-0"
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
