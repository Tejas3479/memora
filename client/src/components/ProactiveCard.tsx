import React from 'react';
import { Sparkles, X } from 'lucide-react';

interface Props {
  title: string;
  message: string;
  onClose: () => void;
}

export default function ProactiveCard({ title, message, onClose }: Props) {
  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 bg-[#0a0a0f]/60 backdrop-blur-[16px] border border-white/5 border-t border-white/12 rounded-2xl p-4 shadow-2xl flex gap-3 animate-slide-in-right hover:scale-[1.01] hover:border-white/15 active:scale-[0.99] transition-all duration-250 ease-out group">
      <div className="p-2 rounded-lg bg-memora-accent/15 h-fit text-memora-accent group-hover:shadow-[0_0_12px_rgba(124,58,237,0.2)] transition-shadow">
        <Sparkles className="animate-pulse" size={18} />
      </div>
      
      <div className="flex-1 flex flex-col gap-1.5 min-w-0">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-sm text-white truncate font-sans tracking-wide">{title}</span>
          <button onClick={onClose} className="text-memora-text-muted hover:text-white rounded p-0.5 hover:bg-white/5 transition-colors">
            <X size={14} />
          </button>
        </div>
        <p className="text-xs text-memora-text/90 leading-relaxed font-sans">
          {message}
        </p>
      </div>
    </div>
  );
}
