import React, { useState } from 'react';
import { useIntegrationsQuery, useDisconnectIntegrationMutation, useBillingQuery } from '../../hooks/useQueries.js';
import { useUiStore } from '../../store/uiStore.js';
import { useAuthStore } from '../../store/authStore.js';
import { api } from '../../api/client.js';
import { Globe, BookOpen, MessageSquare, Github } from 'lucide-react';

export default function SettingsPage() {
  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'integrations' | 'preferences' | 'billing'>('profile');
  const { user } = useAuthStore();
  const { data: integrations = [] } = useIntegrationsQuery();
  const { data: billingData } = useBillingQuery();
  const disconnectMutation = useDisconnectIntegrationMutation();
  const [isUpgrading, setIsUpgrading] = useState(false);

  const {
    adhdFocusMode,
    reducedTransparency,
    colorBlindMode,
    toggleAdhdFocusMode,
    toggleReducedTransparency,
    toggleColorBlindMode
  } = useUiStore();

  const [profileName, setProfileName] = useState(user?.name || '');
  const [profileEmail, setProfileEmail] = useState(user?.email || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);

  const handleConnect = (provider: string) => {
    window.location.href = `/auth/${provider}`;
  };

  const handleDisconnect = async (id: string) => {
    try {
      await disconnectMutation.mutateAsync(id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      const updated = await api.put('/api/account', { name: profileName, email: profileEmail });
      useAuthStore.getState().setUser({ ...user!, name: updated.name, email: updated.email });
      setProfileMessage('Profile updated successfully!');
      setTimeout(() => setProfileMessage(null), 3000);
    } catch (err: any) {
      setProfileMessage(err.message || 'Failed to update profile');
      setTimeout(() => setProfileMessage(null), 4000);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) return;
    setIsSavingPassword(true);
    try {
      await api.put('/api/account/password', { currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setPasswordMessage('Password changed successfully!');
      setTimeout(() => setPasswordMessage(null), 3000);
    } catch (err: any) {
      setPasswordMessage(err.message || 'Failed to change password');
      setTimeout(() => setPasswordMessage(null), 4000);
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleUpgrade = async (plan: 'PRO' | 'TEAM') => {
    try {
      setIsUpgrading(true);
      const res = await api.post('/api/billing/checkout', { plan });
      if (res?.url) {
        window.location.href = res.url;
      }
    } catch (err) {
      console.error('[Billing Checkout Failed]:', err);
    } finally {
      setIsUpgrading(false);
    }
  };

  const integrationsList = [
    { provider: 'slack', label: 'Slack', desc: 'Sync conversations and starred items', icon: MessageSquare },
    { provider: 'notion', label: 'Notion', desc: 'Index shared team workspaces and pages', icon: BookOpen },
    { provider: 'google', label: 'Google', desc: 'Sync calendar schedules and meetings', icon: Globe },
    { provider: 'github', label: 'GitHub', desc: 'Index pull requests and repository docs', icon: Github },
  ];

  return (
    <div className="flex flex-col md:flex-row gap-8 max-w-5xl mx-auto animate-fade-in font-sans">
      {/* Navigation Sub-tabs */}
      <div className="w-full md:w-56 flex flex-col gap-1 select-none">
        <h1 className="text-xl font-bold text-white mb-4">Settings</h1>
        <button
          onClick={() => setActiveSubTab('profile')}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeSubTab === 'profile'
              ? 'bg-memora-accent text-white'
              : 'text-memora-text-muted hover:text-white hover:bg-memora-surface'
          }`}
        >
          Profile
        </button>
        <button
          onClick={() => setActiveSubTab('integrations')}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeSubTab === 'integrations'
              ? 'bg-memora-accent text-white'
              : 'text-memora-text-muted hover:text-white hover:bg-memora-surface'
          }`}
        >
          Integrations
        </button>
        <button
          onClick={() => setActiveSubTab('preferences')}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeSubTab === 'preferences'
              ? 'bg-memora-accent text-white'
              : 'text-memora-text-muted hover:text-white hover:bg-memora-surface'
          }`}
        >
          Accessibility
        </button>
        <button
          onClick={() => setActiveSubTab('billing')}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeSubTab === 'billing'
              ? 'bg-memora-accent text-white'
              : 'text-memora-text-muted hover:text-white hover:bg-memora-surface'
          }`}
        >
          Plans & Billing
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col gap-6">
        {activeSubTab === 'profile' && (
          <div className="flex flex-col gap-6">
            <form onSubmit={handleSaveProfile} className="glass p-6 rounded-xl flex flex-col gap-4">
              <h2 className="text-lg font-bold text-white">Profile Details</h2>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-memora-text-muted">Display Name</label>
                <input
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="bg-memora-bg border border-memora-border rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-memora-accent"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-memora-text-muted">Email Address</label>
                <input
                  type="email"
                  value={profileEmail}
                  onChange={(e) => setProfileEmail(e.target.value)}
                  className="bg-memora-bg border border-memora-border rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-memora-accent"
                />
              </div>

              {profileMessage && (
                <span className={`text-xs font-medium ${profileMessage.includes('success') ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {profileMessage}
                </span>
              )}

              <div className="flex justify-end mt-2">
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="px-4 py-2 bg-memora-accent text-white font-semibold rounded-lg text-xs hover:bg-memora-accent-hover disabled:opacity-50 cursor-pointer shadow-lg shadow-memora-accent-glow"
                >
                  {isSavingProfile ? 'Saving...' : 'Save Profile Changes'}
                </button>
              </div>
            </form>

            <form onSubmit={handleChangePassword} className="glass p-6 rounded-xl flex flex-col gap-4">
              <h2 className="text-lg font-bold text-white">Change Password</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-memora-text-muted">Current Password</label>
                  <input
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="bg-memora-bg border border-memora-border rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-memora-accent"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-memora-text-muted">New Password</label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="bg-memora-bg border border-memora-border rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-memora-accent"
                  />
                </div>
              </div>

              {passwordMessage && (
                <span className={`text-xs font-medium ${passwordMessage.includes('success') ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {passwordMessage}
                </span>
              )}

              <div className="flex justify-end mt-2">
                <button
                  type="submit"
                  disabled={isSavingPassword || !currentPassword || !newPassword}
                  className="px-4 py-2 bg-memora-accent text-white font-semibold rounded-lg text-xs hover:bg-memora-accent-hover disabled:opacity-50 cursor-pointer shadow-lg shadow-memora-accent-glow"
                >
                  {isSavingPassword ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        )}

        {activeSubTab === 'integrations' && (
          <div className="flex flex-col gap-4">
            <h2 className="text-lg font-bold text-white">Workspace Syncs</h2>
            <div className="grid grid-cols-1 gap-4">
              {integrationsList.map((item) => {
                const Icon = item.icon;
                const active = integrations.find((i: any) => i.provider?.toLowerCase() === item.provider.toLowerCase());
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
                <span className="text-sm font-semibold text-white">
                  Memora {billingData?.plan || user?.plan || 'FREE'} Tier
                </span>
                <span className="text-xs text-memora-text-muted">
                  {billingData?.plan === 'PRO' || user?.plan === 'PRO'
                    ? 'Unlimited ingestions & advanced agentic search'
                    : 'Includes 1,000 ingestions/mo'}
                </span>
              </div>
              <span className="text-xs bg-memora-accent/20 text-memora-accent border border-memora-accent/30 px-3 py-1 rounded font-semibold uppercase">
                {billingData?.status || 'Active'}
              </span>
            </div>

            {billingData?.plan !== 'PRO' && user?.plan !== 'PRO' && (
              <button
                disabled={isUpgrading}
                onClick={() => handleUpgrade('PRO')}
                className="py-2.5 rounded bg-memora-accent text-white font-semibold hover:bg-memora-accent-hover active:scale-[0.99] transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-memora-accent-glow"
              >
                {isUpgrading ? 'Redirecting to checkout...' : 'Upgrade to Pro ($9.99/mo)'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
