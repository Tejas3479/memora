import React from 'react';
import { SynthesizedAnswer } from '@memora/shared';
import { Sparkles, ExternalLink } from 'lucide-react';

interface Props {
  answer: SynthesizedAnswer;
}

export default function AnswerCard({ answer }: Props) {
  return (
    <div className="bg-[#0f0f16]/90 backdrop-blur-md text-slate-200 border border-white/5 shadow-[0_0_20px_rgba(0,0,0,0.25)] p-6 rounded-2xl flex flex-col gap-4 animate-fade-in relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none select-none">
        <Sparkles size={120} className="text-memora-accent" />
      </div>

      <div className="flex items-center gap-2 text-memora-accent font-semibold text-sm tracking-wide uppercase select-none">
        <Sparkles size={18} className="animate-pulse" />
        <span>Synthesized Memory Answer</span>
      </div>

      <p className="text-base text-white/90 leading-relaxed whitespace-pre-wrap font-sans">
        {answer.answer}
      </p>

      {answer.sources && answer.sources.length > 0 && (
        <div className="border-t border-memora-border pt-4 flex flex-col gap-2.5">
          <span className="text-xs font-semibold text-memora-text-muted select-none">
            Citations & References
          </span>
          <div className="flex flex-wrap gap-2">
            {answer.sources.map((src, i) => (
              <a
                key={i}
                href={src.url}
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
  );
}
