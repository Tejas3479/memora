import React from 'react';
import { Sparkles, X } from 'lucide-react';

interface Props {
  title: string;
  message: string;
  onClose: () => void;
}

export default function ProactiveCard({ title, message, onClose }: Props) {
  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 glass border border-memora-accent/40 rounded-xl p-4 shadow-xl flex gap-3 animate-slide-in-right">
      <div className="p-2 rounded-lg bg-memora-accent/15 h-fit">
        <Sparkles className="text-memora-accent animate-pulse" size={20} />
      </div>
      <div className="flex-1 flex flex-col gap-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-sm text-white truncate">{title}</span>
          <button onClick={onClose} className="text-memora-text-muted hover:text-white rounded">
            <X size={16} />
          </button>
        </div>
        <p className="text-xs text-memora-text/90 leading-relaxed">
          {message}
        </p>
      </div>
    </div>
  );
}
