import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client.js';
import { useAuthStore } from '../store/authStore.js';
import { Globe, Clock, Zap, BookOpen, MessageSquare, StickyNote, ArrowRight } from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const { data: tabsData, isLoading: isTabsLoading } = useQuery({
    queryKey: ['tabs', 'stats'],
    queryFn: () => api.get('/api/tabs'),
  });

  const { data: integrationsData } = useQuery({
    queryKey: ['integrations'],
    queryFn: () => api.get('/api/integrations'),
  });

  const { data: timelineData, isLoading: isTimelineLoading } = useQuery({
    queryKey: ['timeline', 'recent'],
    queryFn: () => api.get('/api/timeline?limit=5'),
  });

  const totalMemories = tabsData?.all || 0;
  const webClips = tabsData?.web || 0;
  const activeSyncs = Array.isArray(integrationsData) ? integrationsData.length : 0;
  const recentItems = timelineData?.items || [];

  const getSourceIcon = (src: string) => {
    switch (src?.toLowerCase()) {
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
        <div 
          onClick={() => navigate('/timeline')}
          className="glass p-6 md:col-span-2 flex flex-col justify-between hover:scale-[1.01] hover:border-white/15 active:scale-[0.99] transition-all duration-250 ease-out bento-metric-card relative overflow-hidden group cursor-pointer"
        >
          <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-memora-accent/5 rounded-full blur-[50px] group-hover:bg-memora-accent/8 transition-colors duration-300"></div>
          
          <div className="flex justify-between items-start">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-memora-text-muted uppercase tracking-wider">Total Cognitive Records</span>
              <span className="text-4xl font-extrabold text-white tracking-tight mt-1">{totalMemories}</span>
            </div>
            <div className="p-3 bg-[#7c3aed]/10 border border-[#7c3aed]/20 rounded-xl text-memora-accent group-hover:shadow-[0_0_15px_rgba(124,58,237,0.2)] transition-shadow">
              <Clock size={24} />
            </div>
          </div>
          <div className="text-xs text-memora-text-muted mt-6 z-10 select-none flex items-center justify-between">
            <span>Deep indexing connected across {activeSyncs} workspace syncs</span>
            <span className="text-memora-accent flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              View Timeline <ArrowRight size={12} />
            </span>
          </div>
        </div>

        {/* Ingested Web Clips - Single Width Bento */}
        <div 
          onClick={() => navigate('/timeline?source=web')}
          className="glass p-6 flex flex-col justify-between hover:scale-[1.01] hover:border-white/15 active:scale-[0.99] transition-all duration-250 ease-out bento-metric-card relative overflow-hidden group cursor-pointer"
        >
          <div className="flex justify-between items-start">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-memora-text-muted uppercase tracking-wider">Web Scraping Clips</span>
              <span className="text-3xl font-bold text-white tracking-tight mt-1">{webClips}</span>
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
        <div 
          onClick={() => navigate('/settings')}
          className="glass p-6 flex flex-col justify-between hover:scale-[1.01] hover:border-white/15 active:scale-[0.99] transition-all duration-250 ease-out bento-metric-card relative overflow-hidden group cursor-pointer"
        >
          <div className="flex justify-between items-start">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-memora-text-muted uppercase tracking-wider">Active Workspace Syncs</span>
              <span className="text-3xl font-bold text-white tracking-tight mt-1">{activeSyncs}</span>
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
        <div className="flex justify-between items-center select-none">
          <h3 className="font-semibold text-xs text-memora-text-muted uppercase tracking-wider">
            Recent Ingestions
          </h3>
          <button 
            onClick={() => navigate('/timeline')}
            className="text-xs text-memora-accent hover:underline flex items-center gap-1 font-medium"
          >
            See all <ArrowRight size={12} />
          </button>
        </div>
        
        <div className="flex flex-col gap-3">
          {recentItems.map((item: any) => {
            const dateObj = typeof item.timestamp === 'number'
              ? (item.timestamp > 1e11 ? new Date(item.timestamp) : new Date(item.timestamp * 1000))
              : new Date(item.createdAt || Date.now());

            return (
              <div 
                key={item.id} 
                onClick={() => navigate('/timeline')}
                className="glass p-4 flex justify-between items-center hover:border-white/15 hover:scale-[1.005] active:scale-[0.995] transition-all duration-200 cursor-pointer group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2.5 rounded-lg bg-memora-surface border border-memora-border group-hover:border-memora-accent/40 transition-colors">
                    {getSourceIcon(item.source)}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-semibold text-sm text-white group-hover:text-memora-accent transition-colors truncate">{item.title}</span>
                    <span className="text-xs text-memora-text-muted truncate max-w-lg">{item.content}</span>
                  </div>
                </div>
                <span className="text-xs text-memora-text-muted select-none shrink-0 font-mono">
                  {dateObj.toLocaleDateString()}
                </span>
              </div>
            );
          })}

          {recentItems.length === 0 && (
            <div className="glass p-8 rounded-xl text-center text-memora-text-muted flex flex-col items-center gap-2">
              <Clock size={24} className="text-memora-border animate-pulse" />
              <div className="text-xs">No memories found. Start capturing pages using the browser extension or add a note!</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
