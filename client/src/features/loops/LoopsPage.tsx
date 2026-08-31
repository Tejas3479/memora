import React, { useState } from 'react';
import { useLoopsHistoryQuery, useTriggerLoopMutation } from '../../hooks/useQueries.js';
import { Cpu, RefreshCw, Sparkles, Brain, Merge, Network, BarChart2, CheckCircle2, XCircle, Clock } from 'lucide-react';

export default function LoopsPage() {
  const { data: executions = [], isLoading: isHistoryLoading } = useLoopsHistoryQuery();
  const triggerLoopMutation = useTriggerLoopMutation();
  const [triggeringType, setTriggeringType] = useState<string | null>(null);

  const triggerLoop = async (loopType: string) => {
    setTriggeringType(loopType);
    try {
      await triggerLoopMutation.mutateAsync({
        loopType,
        config: {},
        sync: false,
      });
    } catch (err) {
      console.error('[LoopsPage] Failed to trigger loop:', err);
    } finally {
      setTriggeringType(null);
    }
  };

  const loops = [
    {
      type: 'SELF_REFLECTION',
      label: 'Self Reflection (Meta-cognition)',
      icon: Brain,
      desc: 'Queries recent memories to detect themes, uncover knowledge gaps, and formulate concrete study actions.',
    },
    {
      type: 'CONSOLIDATION',
      label: 'Consolidation Summarizer',
      icon: Merge,
      desc: 'Clusters redundant and duplicate memory notes into unified canonical summaries in PostgreSQL and Qdrant.',
    },
    {
      type: 'DREAMING',
      label: 'Dreaming Connection Finder',
      icon: Sparkles,
      desc: 'Discovers latent associative links between non-identical notes and creates new synthetic insight memories.',
    },
    {
      type: 'MULTI_AGENT',
      label: 'Multi-Agent Debate',
      icon: Network,
      desc: 'Runs a multi-agent debate (Researcher, Critic, Synthesizer) to refine complex concepts and reach consensus.',
    },
    {
      type: 'EVALUATION',
      label: 'Search Quality Evaluation',
      icon: BarChart2,
      desc: 'Analyzes user feedback signals to calculate precision metrics and benchmark synthesis quality.',
    },
  ];

  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto animate-fade-in font-sans">
      <div className="flex flex-col gap-1 select-none">
        <h1 className="text-2xl font-bold text-white tracking-wide">Reflection Loops</h1>
        <p className="text-sm text-memora-text-muted">
          Autonomous background cognitive loops optimizing index graphs, synthesizing latent connections, and consolidating memories.
        </p>
      </div>

      {/* Available Loops */}
      <div className="grid grid-cols-1 gap-4">
        {loops.map((loop) => {
          const Icon = loop.icon;
          const isTriggering = triggeringType === loop.type;
          const activeExecution = executions.find(
            (e) => e.loopType === loop.type && (e.status === 'RUNNING' || e.status === 'PENDING')
          );
          const isBusy = isTriggering || Boolean(activeExecution);

          return (
            <div
              key={loop.type}
              className="glass p-5 rounded-2xl border border-white/5 border-t border-white/12 flex justify-between items-start hover:scale-[1.01] hover:border-white/15 active:scale-[0.99] transition-all duration-250 ease-out"
            >
              <div className="flex gap-4">
                <div className="p-3 bg-memora-bg rounded-xl border border-memora-border shrink-0">
                  <Icon className="text-memora-accent" size={20} />
                </div>

                <div className="flex flex-col gap-1 max-w-md">
                  <span className="font-bold text-white text-base leading-snug">{loop.label}</span>
                  <span className="text-xs text-memora-text-muted leading-relaxed">{loop.desc}</span>

                  {activeExecution && (
                    <div className="mt-3 bg-memora-accent/10 border border-memora-accent/20 p-2.5 rounded-xl flex items-center gap-2 text-xs text-memora-accent animate-pulse">
                      <RefreshCw size={12} className="animate-spin" />
                      <span>Execution in progress (Status: {activeExecution.status})...</span>
                    </div>
                  )}
                </div>
              </div>

              <button
                disabled={isBusy}
                onClick={() => triggerLoop(loop.type)}
                className="px-4 py-2 bg-memora-accent text-white font-semibold text-xs rounded-lg hover:bg-memora-accent-hover active:scale-95 transition-all duration-200 cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shrink-0"
              >
                {isBusy ? (
                  <>
                    <RefreshCw className="animate-spin" size={12} />
                    Running
                  </>
                ) : (
                  'Run Loop'
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Execution History */}
      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-bold text-white">Execution History</h2>

        {isHistoryLoading ? (
          <div className="flex flex-col gap-3">
            <div className="h-16 shimmer rounded-2xl"></div>
            <div className="h-16 shimmer rounded-2xl"></div>
          </div>
        ) : executions.length > 0 ? (
          <div className="flex flex-col gap-3">
            {executions.slice(0, 10).map((exec) => (
              <div
                key={exec.id}
                className="glass p-4 rounded-xl border border-white/5 flex flex-col gap-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-white font-bold">{exec.loopType}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-semibold flex items-center gap-1 ${
                        exec.status === 'COMPLETED'
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                          : exec.status === 'RUNNING' || exec.status === 'PENDING'
                          ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 animate-pulse'
                          : 'bg-red-500/20 text-red-400 border border-red-500/30'
                      }`}
                    >
                      {exec.status === 'COMPLETED' && <CheckCircle2 size={10} />}
                      {exec.status === 'FAILED' && <XCircle size={10} />}
                      {(exec.status === 'RUNNING' || exec.status === 'PENDING') && <Clock size={10} />}
                      {exec.status}
                    </span>
                  </div>

                  <span className="text-[11px] text-memora-text-muted">
                    {new Date(exec.startedAt).toLocaleString()}
                  </span>
                </div>

                {exec.error && (
                  <div className="text-xs text-red-400 font-mono bg-red-500/10 p-2 rounded-lg border border-red-500/20">
                    {exec.error}
                  </div>
                )}

                {exec.output && (
                  <div className="text-xs text-memora-text-muted bg-[#050508]/60 p-3 rounded-lg border border-memora-border">
                    {exec.loopType === 'DREAMING' && exec.output.discoveries?.length > 0 && (
                      <div className="flex flex-col gap-1">
                        <span className="font-semibold text-white">Discovered Connections:</span>
                        {exec.output.discoveries.map((d: any, i: number) => (
                          <p key={i} className="text-xs text-memora-text-muted italic">"{d.description}"</p>
                        ))}
                      </div>
                    )}
                    {exec.loopType === 'SELF_REFLECTION' && exec.output.insights?.length > 0 && (
                      <div className="flex flex-col gap-1">
                        <span className="font-semibold text-white">Meta-cognitive Insights:</span>
                        {exec.output.insights.map((ins: any, i: number) => (
                          <p key={i} className="text-xs text-memora-text-muted">• {ins.description}</p>
                        ))}
                      </div>
                    )}
                    {exec.loopType === 'CONSOLIDATION' && (
                      <div className="text-xs text-memora-text-muted">
                        Summaries created: <span className="text-white font-semibold">{exec.output.summariesCreated || 0}</span>, Memories merged: <span className="text-white font-semibold">{exec.output.memoriesMerged || 0}</span>
                      </div>
                    )}
                    {exec.loopType === 'MULTI_AGENT' && (
                      <div className="text-xs text-memora-text-muted">
                        Rounds: <span className="text-white font-semibold">{exec.output.roundsUsed || 0}</span>, Consensus: <span className="text-green-400 font-semibold">{exec.output.consensusReached ? 'Achieved' : 'Pending'}</span>
                      </div>
                    )}
                    {exec.loopType === 'EVALUATION' && (
                      <div className="text-xs text-memora-text-muted">
                        Precision: <span className="text-white font-semibold">{Math.round((exec.output.searchQuality?.precision || 0.8) * 100)}%</span>, Satisfaction: <span className="text-white font-semibold">{(exec.output.userSatisfaction || 4.0).toFixed(1)}/5.0</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="glass p-6 rounded-xl text-center text-memora-text-muted text-xs select-none">
            No loops executed yet. Click "Run Loop" on any cognitive engine above to trigger processing.
          </div>
        )}
      </div>
    </div>
  );
}
