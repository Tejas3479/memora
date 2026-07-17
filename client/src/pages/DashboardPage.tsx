import React, { useState, useEffect } from 'react';
import { api } from '../api/client.js';
import { useAuthStore } from '../store/authStore.js';
import { Globe, Users, Clock, Zap, BookOpen, MessageSquare, StickyNote, Award } from 'lucide-react';

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
    <div className="flex flex-col gap-6 max-w-4xl mx-auto animate-fade-in">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-white">Hello, {user?.name || 'Developer'}</h1>
        <p className="text-sm text-memora-text-muted">Here is an overview of your personal memory layer logs.</p>
      </div>

      {/* Grid counters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass p-5 rounded-xl flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-memora-text-muted">Total Memories</span>
            <span className="text-2xl font-bold text-white">{stats.total}</span>
          </div>
          <div className="p-3 bg-memora-accent/15 rounded-lg">
            <Clock className="text-memora-accent" size={20} />
          </div>
        </div>

        <div className="glass p-5 rounded-xl flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-memora-text-muted">Ingested Web Clips</span>
            <span className="text-2xl font-bold text-white">{stats.thisMonth}</span>
          </div>
          <div className="p-3 bg-memora-accent/15 rounded-lg">
            <Globe className="text-memora-accent" size={20} />
          </div>
        </div>

        <div className="glass p-5 rounded-xl flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-memora-text-muted">Active Integrations</span>
            <span className="text-2xl font-bold text-white">{stats.integrations}</span>
          </div>
          <div className="p-3 bg-memora-accent/15 rounded-lg">
            <Zap className="text-memora-accent" size={20} />
          </div>
        </div>
      </div>

      {/* Recent Captures */}
      <div className="flex flex-col gap-4 mt-2">
        <h3 className="font-semibold text-sm text-memora-text-muted uppercase tracking-wider">
          Recent Ingestions
        </h3>
        
        <div className="flex flex-col gap-3">
          {recent.map((item, i) => (
            <div key={i} className="glass p-4 rounded-xl flex justify-between items-center hover:border-memora-accent transition-colors cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded bg-memora-bg">
                  {getSourceIcon(item.source)}
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-sm text-white">{item.title}</span>
                  <span className="text-xs text-memora-text-muted truncate max-w-sm">{item.content}</span>
                </div>
              </div>
              <span className="text-xs text-memora-text-muted select-none shrink-0">
                {new Date(item.timestamp * 1000).toLocaleDateString()}
              </span>
            </div>
          ))}

          {recent.length === 0 && (
            <div className="glass p-8 rounded-xl text-center text-memora-text-muted flex flex-col items-center gap-1.5">
              <Clock size={24} className="text-memora-border" />
              <div className="text-xs">No memories found. Start scraping pages using the extension!</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
