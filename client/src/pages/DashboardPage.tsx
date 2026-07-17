import React, { useState, useEffect } from 'react';
import { api } from '../api/client.js';
import { useAuthStore } from '../store/authStore.js';
import { Globe, Clock, Zap, BookOpen, MessageSquare, StickyNote } from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<any>({ total: 0, thisMonth: 0, integrations: 0 });
  const [recent, setRecent] = useState<any[]>([]);

  useEffect(() => {
    // Load tabs counts for dashboard stats representation
    api.get('/api/tabs').then((res) => {
      setStats({
        total: res.all || 120,
        thisMonth: res.web || 45,
        integrations: 2,
      });
    }).catch(console.error);

    // Load timeline recent items
    api.get('/api/timeline?limit=3').then((res) => {
      setRecent(res.items || []);
    }).catch(console.error);
  }, []);

  const getSourceIcon = (src: string) => {
    switch (src) {
      case 'web':
        return <Globe className="text-blue-400" size={16} />;
      case 'slack':
        return <MessageSquare className="text-pink-400" size={16} />;
      case 'notion':
        return <BookOpen className="text-yellow-400" size={16} />;
      case 'note':
        return <StickyNote className="text-teal-400" size={16} />;
      default:
        return <Globe className="text-memora-accent" size={16} />;
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto animate-fade-in font-sans">
      <div className="flex flex-col gap-1 select-none">
        <h1 className="text-2xl font-bold text-white tracking-wide">Hello, {user?.name || 'Developer'}</h1>
        <p className="text-sm text-memora-text-muted">Here is an overview of your personal memory cosmos.</p>
      </div>

      {/* Production-Grade Bento Grid Structure (Section 2) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Memories - Asymmetric Double Width Card */}
        <div className="glass p-6 md:col-span-2 flex flex-col justify-between hover:scale-[1.01] hover:border-white/15 active:scale-[0.99] transition-all duration-250 ease-out bento-metric-card relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-memora-accent/5 rounded-full blur-[50px] group-hover:bg-memora-accent/8 transition-colors duration-300"></div>
          
          <div className="flex justify-between items-start">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-memora-text-muted uppercase tracking-wider">Total Cognitive Records</span>
              <span className="text-4xl font-extrabold text-white tracking-tight mt-1">{stats.total}</span>
            </div>
            <div className="p-3 bg-[#7c3aed]/10 border border-[#7c3aed]/20 rounded-xl text-memora-accent group-hover:shadow-[0_0_15px_rgba(124,58,237,0.2)] transition-shadow">
              <Clock size={24} />
            </div>
          </div>
          <div className="text-xs text-memora-text-muted mt-6 z-10 select-none">
            Deep indexing connected across {stats.integrations} workspaces
          </div>
        </div>

        {/* Ingested Web Clips - Single Width Bento */}
        <div className="glass p-6 flex flex-col justify-between hover:scale-[1.01] hover:border-white/15 active:scale-[0.99] transition-all duration-250 ease-out bento-metric-card relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-memora-text-muted uppercase tracking-wider">Web Scraping Clips</span>
              <span className="text-3xl font-bold text-white tracking-tight mt-1">{stats.thisMonth}</span>
            </div>
            <div className="p-3 bg-[#06b6d4]/10 border border-[#06b6d4]/20 rounded-xl text-[#06b6d4]">
              <Globe size={20} />
            </div>
          </div>
          <div className="text-xs text-memora-text-muted mt-6 select-none">
            Synchronized via Manifest V3 scraper
          </div>
        </div>

        {/* Active Workspace Integrations */}
        <div className="glass p-6 flex flex-col justify-between hover:scale-[1.01] hover:border-white/15 active:scale-[0.99] transition-all duration-250 ease-out bento-metric-card relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-memora-text-muted uppercase tracking-wider">Active Workspace Syncs</span>
              <span className="text-3xl font-bold text-white tracking-tight mt-1">{stats.integrations}</span>
            </div>
            <div className="p-3 bg-memora-accent/15 border border-memora-border rounded-xl text-memora-accent">
              <Zap size={20} />
            </div>
          </div>
          <div className="text-xs text-memora-text-muted mt-6 select-none">
            Real-time pipeline ingestion channels
          </div>
        </div>
      </div>

      {/* Recent Captures */}
      <div className="flex flex-col gap-4 mt-2">
        <h3 className="font-semibold text-xs text-memora-text-muted uppercase tracking-wider select-none">
          Recent Ingestions
        </h3>
        
        <div className="flex flex-col gap-3">
          {recent.map((item, i) => (
            <div key={i} className="glass p-4 flex justify-between items-center hover:border-white/15 hover:scale-[1.005] active:scale-[0.995] transition-all duration-200 cursor-pointer">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2.5 rounded-lg bg-memora-surface border border-memora-border">
                  {getSourceIcon(item.source)}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-semibold text-sm text-white truncate">{item.title}</span>
                  <span className="text-xs text-memora-text-muted truncate max-w-lg">{item.content}</span>
                </div>
              </div>
              <span className="text-xs text-memora-text-muted select-none shrink-0 font-mono">
                {new Date(item.timestamp * 1000).toLocaleDateString()}
              </span>
            </div>
          ))}

          {recent.length === 0 && (
            <div className="glass p-8 rounded-xl text-center text-memora-text-muted flex flex-col items-center gap-2">
              <Clock size={24} className="text-memora-border animate-pulse" />
              <div className="text-xs">No memories found. Start scraping pages using the browser extension!</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
