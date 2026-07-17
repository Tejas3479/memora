import React, { useState, useEffect } from 'react';
import { api } from '../../api/client.js';
import { useUiStore } from '../../store/uiStore.js';
import { Globe, BookOpen, MessageSquare, Github, Eye, Sparkles, Sliders } from 'lucide-react';

export default function SettingsPage() {
  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'integrations' | 'preferences' | 'billing'>('profile');
  const [integrations, setIntegrations] = useState<any[]>([]);

  const {
    adhdFocusMode,
    reducedTransparency,
    colorBlindMode,
    toggleAdhdFocusMode,
    toggleReducedTransparency,
    toggleColorBlindMode
  } = useUiStore();

  useEffect(() => {
    if (activeSubTab === 'integrations') {
      api.get('/api/integrations').then(setIntegrations).catch(console.error);
    }
  }, [activeSubTab]);

  const handleConnect = (provider: string) => {
    window.location.href = `/auth/${provider}`;
  };

  const handleDisconnect = async (id: string) => {
    try {
      await api.delete(`/api/integrations/${id}`);
      setIntegrations(integrations.filter((i) => i.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const integrationsList = [
    { provider: 'slack', label: 'Slack Workspace', icon: MessageSquare, desc: 'Indexes team conversation history' },
    { provider: 'notion', label: 'Notion Workspace', icon: BookOpen, desc: 'Syncs databases and text records' },
    { provider: 'google', label: 'Google Workspace', icon: Globe, desc: 'Syncs Drive documents and calendar events' },
    { provider: 'github', label: 'GitHub Repository', icon: Github, desc: 'Tracks readme, issues, and PR logs' },
  ];

  return (
    <div className="flex gap-8 max-w-4xl mx-auto animate-fade-in">
      <div className="w-48 shrink-0 flex flex-col gap-1 border-r border-memora-border pr-8">
        <button
          onClick={() => setActiveSubTab('profile')}
          className={`px-4 py-2 text-left rounded text-sm font-semibold transition-colors ${
            activeSubTab === 'profile' ? 'bg-memora-border text-white' : 'text-memora-text-muted hover:text-white'
          }`}
        >
          Profile settings
        </button>
        <button
          onClick={() => setActiveSubTab('integrations')}
          className={`px-4 py-2 text-left rounded text-sm font-semibold transition-colors ${
            activeSubTab === 'integrations' ? 'bg-memora-border text-white' : 'text-memora-text-muted hover:text-white'
          }`}
        >
          Integrations
        </button>
        <button
          onClick={() => setActiveSubTab('preferences')}
          className={`px-4 py-2 text-left rounded text-sm font-semibold transition-colors ${
            activeSubTab === 'preferences' ? 'bg-memora-border text-white' : 'text-memora-text-muted hover:text-white'
          }`}
        >
          Preferences
        </button>
        <button
          onClick={() => setActiveSubTab('billing')}
          className={`px-4 py-2 text-left rounded text-sm font-semibold transition-colors ${
            activeSubTab === 'billing' ? 'bg-memora-border text-white' : 'text-memora-text-muted hover:text-white'
          }`}
        >
          Plan & Billing
        </button>
      </div>

      <div className="flex-1 flex flex-col gap-6">
        {activeSubTab === 'profile' && (
          <div className="glass p-6 rounded-xl flex flex-col gap-4">
            <h2 className="text-lg font-bold text-white">Profile Details</h2>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-memora-text-muted">Display Name</label>
              <input
                type="text"
                value="John Doe"
                disabled
                className="bg-memora-bg border border-memora-border rounded px-4 py-2 text-white"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-memora-text-muted">Email address</label>
              <input
                type="email"
                value="user@example.com"
                disabled
                className="bg-memora-bg border border-memora-border rounded px-4 py-2 text-white"
              />
            </div>
          </div>
        )}

        {activeSubTab === 'integrations' && (
          <div className="flex flex-col gap-4">
            <h2 className="text-lg font-bold text-white">Workspace Syncs</h2>
            <div className="grid grid-cols-1 gap-4">
              {integrationsList.map((item) => {
                const Icon = item.icon;
                const active = integrations.find((i) => i.provider === item.provider);
                return (
                  <div key={item.provider} className="glass p-5 rounded-xl flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded bg-memora-bg">
                        <Icon size={24} className="text-memora-accent" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold text-white">{item.label}</span>
                        <span className="text-xs text-memora-text-muted">{item.desc}</span>
                      </div>
                    </div>
                    {active ? (
                      <button
                        onClick={() => handleDisconnect(active.id)}
                        className="px-4 py-1.5 border border-red-500/30 text-red-400 text-xs font-semibold rounded hover:bg-red-500/10 transition-colors"
                      >
                        Disconnect
                      </button>
                    ) : (
                      <button
                        onClick={() => handleConnect(item.provider)}
                        className="px-4 py-1.5 bg-memora-accent text-white text-xs font-semibold rounded hover:bg-memora-accent-hover transition-colors"
                      >
                        Connect
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeSubTab === 'preferences' && (
          <div className="glass p-6 rounded-xl flex flex-col gap-6">
            <h2 className="text-lg font-bold text-white">Interface Preferences</h2>
            
            <div className="flex flex-col gap-4">
              {/* ADHD Focus Mode toggle */}
              <div className="flex items-center justify-between p-4 bg-memora-bg/50 border border-memora-border rounded-lg">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-semibold text-white">ADHD Focus Mode</span>
                  <span className="text-xs text-memora-text-muted">Dims peripheral cards to eliminate visual distractions</span>
                </div>
                <input
                  type="checkbox"
                  checked={adhdFocusMode}
                  onChange={toggleAdhdFocusMode}
                  className="w-4 h-4 rounded border-memora-border accent-memora-accent focus:ring-0 cursor-pointer"
                />
              </div>

              {/* Reduced Transparency Mode toggle */}
              <div className="flex items-center justify-between p-4 bg-memora-bg/50 border border-memora-border rounded-lg">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-semibold text-white">Reduce Transparency</span>
                  <span className="text-xs text-memora-text-muted">Replaces glassmorphic background blurs with solid colors</span>
                </div>
                <input
                  type="checkbox"
                  checked={reducedTransparency}
                  onChange={toggleReducedTransparency}
                  className="w-4 h-4 rounded border-memora-border accent-memora-accent focus:ring-0 cursor-pointer"
                />
              </div>

              {/* Color-Blind Safe Mode toggle */}
              <div className="flex items-center justify-between p-4 bg-memora-bg/50 border border-memora-border rounded-lg">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-semibold text-white">Color-Blind Safe Mode</span>
                  <span className="text-xs text-memora-text-muted">Swaps brand hues with accessible deuteranopia-safe colors</span>
                </div>
                <input
                  type="checkbox"
                  checked={colorBlindMode}
                  onChange={toggleColorBlindMode}
                  className="w-4 h-4 rounded border-memora-border accent-memora-accent focus:ring-0 cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}

        {activeSubTab === 'billing' && (
          <div className="glass p-6 rounded-xl flex flex-col gap-6">
            <h2 className="text-lg font-bold text-white">Current Subscription</h2>
            <div className="flex justify-between items-center bg-memora-bg p-4 rounded border border-memora-border">
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-white">Memora Free tier</span>
                <span className="text-xs text-memora-text-muted">Includes 1,000 ingestions/mo</span>
              </div>
              <span className="text-xs bg-memora-border text-white px-3 py-1 rounded font-semibold uppercase">
                Active
              </span>
            </div>
            <button className="py-2 rounded bg-memora-accent text-white font-semibold hover:bg-memora-accent-hover transition-all duration-300">
              Upgrade to Pro ($9.99/mo)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
