import React, { useState, useEffect } from 'react';
import {
  useAutomationsQuery,
  useCreateAutomationMutation,
  useToggleAutomationMutation,
  useDeleteAutomationMutation,
  useFoldersQuery,
} from '../../hooks/useQueries.js';
import { Zap, Plus, X, Trash2, Tag, Folder } from 'lucide-react';

export default function AutomationsPage() {
  const { data: rules = [], isLoading } = useAutomationsQuery();
  const { data: folders = [] } = useFoldersQuery();
  const createAutomationMutation = useCreateAutomationMutation();
  const toggleAutomationMutation = useToggleAutomationMutation();
  const deleteAutomationMutation = useDeleteAutomationMutation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [ruleName, setRuleName] = useState('');
  const [ruleDesc, setRuleDesc] = useState('');
  const [trigger, setTrigger] = useState('ON_INGEST');
  const [action, setAction] = useState('TAG');
  const [tagName, setTagName] = useState('important');
  const [selectedFolderId, setSelectedFolderId] = useState('');

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsModalOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleName.trim()) return;

    const actionConfig: Record<string, any> = {};
    if (action === 'TAG') {
      actionConfig.tagName = tagName.trim() || 'auto';
    } else if (action === 'MOVE_FOLDER') {
      actionConfig.folderId = selectedFolderId || undefined;
    }

    await createAutomationMutation.mutateAsync({
      name: ruleName.trim(),
      description: ruleDesc.trim() || undefined,
      trigger,
      actions: [action],
      conditions: {},
      actionConfig,
    });

    setRuleName('');
    setRuleDesc('');
    setTagName('important');
    setSelectedFolderId('');
    setIsModalOpen(false);
  };

  const handleDeleteRule = (id: string, name: string) => {
    if (confirm(`Delete automation rule "${name}"?`)) {
      deleteAutomationMutation.mutate(id);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto animate-fade-in font-sans">
      <div className="flex justify-between items-center select-none">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wide">Automation Rules</h1>
          <p className="text-sm text-memora-text-muted">Set up active triggers to tag, folder, or enrich incoming memories.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-memora-accent text-white font-semibold rounded-lg text-sm hover:bg-memora-accent-hover active:scale-95 transition-all duration-200 cursor-pointer shadow-lg shadow-memora-accent-glow flex items-center gap-1.5"
        >
          <Plus size={16} />
          Create Rule
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {isLoading ? (
          <div className="grid grid-cols-1 gap-4">
            <div className="h-24 shimmer rounded-2xl border border-white/5"></div>
            <div className="h-24 shimmer rounded-2xl border border-white/5"></div>
          </div>
        ) : rules.length > 0 ? (
          rules.map((rule: any) => (
            <div key={rule.id} className="glass p-5 rounded-2xl border border-white/5 border-t border-white/12 flex justify-between items-start hover:scale-[1.01] hover:border-white/15 active:scale-[0.99] transition-all duration-250 ease-out">
              <div className="flex gap-4">
                <div className="p-3 bg-memora-bg rounded-xl border border-memora-border">
                  <Zap className="text-memora-accent" size={20} />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="font-bold text-white text-base leading-snug">{rule.name}</span>
                  <span className="text-xs text-memora-text-muted leading-normal">{rule.description || 'Custom event automation rule'}</span>
                  <div className="flex flex-wrap gap-2 mt-3 select-none items-center">
                    <span className="text-[10px] bg-memora-border text-memora-text-muted px-2.5 py-0.5 rounded-full font-mono uppercase">
                      Trigger: {rule.trigger}
                    </span>
                    <span className="text-[10px] bg-memora-accent/15 text-memora-accent px-2.5 py-0.5 rounded-full font-mono uppercase">
                      Action: {Array.isArray(rule.actions) ? rule.actions[0] : rule.actions || 'Process'}
                    </span>
                    {rule.actionConfig?.tagName && (
                      <span className="text-[10px] bg-teal-500/15 text-teal-300 px-2.5 py-0.5 rounded-full font-mono">
                        #{rule.actionConfig.tagName}
                      </span>
                    )}
                    {rule.actionConfig?.folderId && (
                      <span className="text-[10px] bg-blue-500/15 text-blue-300 px-2.5 py-0.5 rounded-full font-mono flex items-center gap-1">
                        <Folder size={10} /> Folder
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 select-none shrink-0">
                <div className="text-right flex flex-col items-end gap-1">
                  <div className="text-xs text-white font-semibold">{rule.executionCount || 0} executions</div>
                  <button
                    onClick={() => toggleAutomationMutation.mutate({ id: rule.id, enabled: !rule.enabled })}
                    className={`text-[10px] px-2 py-0.5 rounded font-mono font-semibold cursor-pointer transition-colors ${
                      rule.enabled !== false
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                        : 'bg-memora-border text-memora-text-muted border border-memora-border'
                    }`}
                  >
                    {rule.enabled !== false ? 'Active' : 'Disabled'}
                  </button>
                </div>
                <button
                  onClick={() => handleDeleteRule(rule.id, rule.name)}
                  title="Delete rule"
                  className="text-memora-text-muted hover:text-rose-400 p-1 transition-colors cursor-pointer"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="glass p-8 rounded-2xl text-center text-memora-text-muted flex flex-col items-center gap-3">
            <Zap size={32} className="text-memora-border animate-pulse" />
            <div className="text-xs">No automation rules created. Create one to classify imports automatically!</div>
          </div>
        )}
      </div>

      {/* Create Rule Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-4"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="glass p-6 rounded-2xl border border-white/15 w-full max-w-md flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center border-b border-memora-border/40 pb-3">
              <h2 className="text-lg font-bold text-white">Create Automation Rule</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-memora-text-muted hover:text-white transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateRule} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-memora-text-muted">Rule Name</label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g. Auto-tag Research Papers"
                  value={ruleName}
                  onChange={(e) => setRuleName(e.target.value)}
                  className="bg-memora-bg border border-memora-border rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-memora-accent"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-memora-text-muted">Description</label>
                <input
                  type="text"
                  placeholder="e.g. Automatically extract tags on web captures"
                  value={ruleDesc}
                  onChange={(e) => setRuleDesc(e.target.value)}
                  className="bg-memora-bg border border-memora-border rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-memora-accent"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-memora-text-muted">Trigger Event</label>
                  <select
                    value={trigger}
                    onChange={(e) => setTrigger(e.target.value)}
                    className="bg-memora-bg border border-memora-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-memora-accent cursor-pointer"
                  >
                    <option value="ON_INGEST">On Ingest</option>
                    <option value="ON_SEARCH">On Search</option>
                    <option value="ON_TAG">On Tag</option>
                    <option value="MANUAL">Manual Trigger</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-memora-text-muted">Action</label>
                  <select
                    value={action}
                    onChange={(e) => setAction(e.target.value)}
                    className="bg-memora-bg border border-memora-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-memora-accent cursor-pointer"
                  >
                    <option value="TAG">Tag & Categorize</option>
                    <option value="MOVE_FOLDER">Move to Folder</option>
                    <option value="SUMMARIZE">Summarize</option>
                    <option value="ENRICH">Enrich Entities</option>
                    <option value="NOTIFY">Send Notification</option>
                  </select>
                </div>
              </div>

              {/* Dynamic Action Configuration Inputs */}
              {action === 'TAG' && (
                <div className="flex flex-col gap-1.5 bg-memora-surface/60 p-3 rounded-xl border border-white/5 animate-fade-in">
                  <label className="text-xs font-semibold text-white flex items-center gap-1.5">
                    <Tag size={14} className="text-memora-accent" />
                    Tag Name to Apply
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ai, finance, reading"
                    value={tagName}
                    onChange={(e) => setTagName(e.target.value)}
                    className="bg-memora-bg border border-memora-border rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-memora-accent"
                  />
                </div>
              )}

              {action === 'MOVE_FOLDER' && (
                <div className="flex flex-col gap-1.5 bg-memora-surface/60 p-3 rounded-xl border border-white/5 animate-fade-in">
                  <label className="text-xs font-semibold text-white flex items-center gap-1.5">
                    <Folder size={14} className="text-memora-accent" />
                    Target Folder
                  </label>
                  <select
                    value={selectedFolderId}
                    onChange={(e) => setSelectedFolderId(e.target.value)}
                    className="bg-memora-bg border border-memora-border rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-memora-accent cursor-pointer"
                  >
                    <option value="">Select a folder...</option>
                    {folders.map((f: any) => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex justify-end gap-2.5 mt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-memora-border text-memora-text-muted hover:text-white rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createAutomationMutation.isPending || !ruleName.trim()}
                  className="px-4 py-2 bg-memora-accent text-white font-semibold rounded-lg text-xs hover:bg-memora-accent-hover disabled:opacity-50 cursor-pointer"
                >
                  {createAutomationMutation.isPending ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
