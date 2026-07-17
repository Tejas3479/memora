import React from 'react';
import { SearchResult } from '@memora/shared';
import { Globe, MessageSquare, BookOpen, Github, FileText, StickyNote, Award } from 'lucide-react';

interface Props {
  memory: SearchResult;
}

export default function MemoryCard({ memory }: Props) {
  const getIcon = () => {
    switch (memory.source as any) {
      case 'web':
        return <Globe className="text-blue-400" size={18} />;
      case 'slack':
        return <MessageSquare className="text-pink-400" size={18} />;
      case 'notion':
        return <BookOpen className="text-yellow-400" size={18} />;
      case 'github':
        return <Github className="text-purple-400" size={18} />;
      case 'document':
        return <FileText className="text-orange-400" size={18} />;
      case 'note':
        return <StickyNote className="text-teal-400" size={18} />;
      default:
        return <Globe className="text-memora-accent" size={18} />;
    }
  };

  return (
    <div className="glass p-6 rounded-xl hover:border-memora-accent hover:shadow-lg transition-all duration-300 flex flex-col gap-3 group">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded bg-memora-bg group-hover:scale-110 transition-transform">
            {getIcon()}
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-white leading-snug group-hover:text-memora-accent transition-colors">
              {memory.title}
            </span>
            <span className="text-xs text-memora-text-muted">
              {memory.url}
            </span>
          </div>
        </div>
        {memory.score !== undefined && (
          <span className="text-xs font-semibold bg-memora-accent/20 text-memora-accent px-2.5 py-1 rounded-full flex items-center gap-1 shrink-0">
            <Award size={12} />
            {(memory.score * 100).toFixed(0)}%
          </span>
        )}
      </div>

      <p className="text-sm text-memora-text/90 line-clamp-3 leading-relaxed">
        {memory.content}
      </p>

      <div className="flex items-center justify-between border-t border-memora-border/40 pt-3 mt-1">
        <span className="text-xs text-memora-text-muted">
          {new Date(Number(memory.timestamp) * 1000).toLocaleDateString()}
        </span>
        <span className="text-xs font-semibold uppercase text-memora-text-muted">
          {memory.source}
        </span>
      </div>
    </div>
  );
}
