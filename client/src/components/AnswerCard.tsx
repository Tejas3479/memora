import React from 'react';
import { SynthesizedAnswer } from '@memora/shared';
import { Sparkles, ArrowUpRight } from 'lucide-react';

interface Props {
  answer: SynthesizedAnswer;
}

export default function AnswerCard({ answer }: Props) {
  return (
    <div className="glass p-6 rounded-xl border border-memora-accent/40 bg-gradient-to-r from-memora-accent/5 to-transparent flex flex-col gap-4 animate-fade-in relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-10">
        <Sparkles size={120} className="text-memora-accent" />
      </div>

      <div className="flex items-center gap-2 text-memora-accent font-semibold">
        <Sparkles size={20} />
        <span>Synthesized Memory Answer</span>
      </div>

      <p className="text-base text-white/95 leading-relaxed whitespace-pre-wrap">
        {answer.answer}
      </p>

      {answer.sources && answer.sources.length > 0 && (
        <div className="border-t border-memora-border pt-4 flex flex-col gap-2">
          <span className="text-xs font-semibold text-memora-text-muted">Citations & References</span>
          <div className="flex flex-wrap gap-2">
            {answer.sources.map((src, i) => (
              <a
                key={i}
                href={src.url}
                target="_blank"
                rel="noreferrer"
                className="text-xs bg-memora-border hover:bg-memora-border/80 px-3 py-1.5 rounded-md flex items-center gap-1.5 text-white transition-colors"
              >
                <span>[{i + 1}] {src.title}</span>
                <ArrowUpRight size={12} className="text-memora-text-muted" />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
