import React, { useEffect, useState } from 'react';
import { api } from '../../api/client.js';
import { Zap, Play, CheckCircle } from 'lucide-react';

export default function AutomationsPage() {
  const [rules, setRules] = useState<any[]>([]);

  useEffect(() => {
    api.get('/api/automations').then(setRules).catch(console.error);
  }, []);

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white font-sans">Automation Rules</h1>
          <p className="text-sm text-memora-text-muted">Set up active triggers to tag, folder, or enrich incoming memories.</p>
        </div>
        <button className="px-4 py-2 bg-memora-accent text-white font-semibold rounded-lg text-sm hover:bg-memora-accent-hover">
          Create Rule
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {rules.map((rule) => (
          <div key={rule.id} className="glass p-5 rounded-xl flex justify-between items-start">
            <div className="flex gap-4">
              <div className="p-3 bg-memora-bg rounded-lg">
                <Zap className="text-memora-accent" size={24} />
              </div>
              <div className="flex flex-col gap-1">
                <span className="font-bold text-white">{rule.name}</span>
                <span className="text-xs text-memora-text-muted">{rule.description}</span>
                <div className="flex gap-2 mt-2">
                  <span className="text-[10px] bg-memora-border text-memora-text-muted px-2 py-0.5 rounded uppercase font-semibold">
                    {rule.trigger}
                  </span>
                  <span className="text-[10px] bg-memora-accent/20 text-memora-accent px-2 py-0.5 rounded uppercase font-semibold">
                    {rule.actions[0] || 'Tag'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-xs text-white font-semibold">{rule.executionCount} executions</div>
                <div className="text-[10px] text-memora-text-muted">Enabled</div>
              </div>
            </div>
          </div>
        ))}

        {rules.length === 0 && (
          <div className="glass p-8 rounded-xl text-center text-memora-text-muted flex flex-col items-center gap-2">
            <Zap size={32} className="text-memora-border" />
            <div className="text-sm">No automation rules created. Create one to classify imports automatically!</div>
          </div>
        )}
      </div>
    </div>
  );
}
