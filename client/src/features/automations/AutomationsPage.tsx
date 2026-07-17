import React, { useEffect, useState } from 'react';
import { api } from '../../api/client.js';
import { Zap } from 'lucide-react';

export default function AutomationsPage() {
  const [rules, setRules] = useState<any[]>([]);

  useEffect(() => {
    api.get('/api/automations').then(setRules).catch(console.error);
  }, []);

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto animate-fade-in font-sans">
      <div className="flex justify-between items-center select-none">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wide">Automation Rules</h1>
          <p className="text-sm text-memora-text-muted">Set up active triggers to tag, folder, or enrich incoming memories.</p>
        </div>
        <button className="px-4 py-2 bg-memora-accent text-white font-semibold rounded-lg text-sm hover:bg-memora-accent-hover active:scale-95 transition-all duration-200 cursor-pointer shadow-lg shadow-memora-accent-glow">
          Create Rule
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {rules.map((rule) => (
          <div key={rule.id} className="glass p-5 rounded-2xl border border-white/5 border-t border-white/12 flex justify-between items-start hover:scale-[1.01] hover:border-white/15 active:scale-[0.99] transition-all duration-250 ease-out">
            <div className="flex gap-4">
              <div className="p-3 bg-memora-bg rounded-xl border border-memora-border">
                <Zap className="text-memora-accent" size={20} />
              </div>
              <div className="flex flex-col gap-1">
                <span className="font-bold text-white text-base leading-snug">{rule.name}</span>
                <span className="text-xs text-memora-text-muted leading-normal">{rule.description}</span>
                <div className="flex gap-2 mt-3 select-none">
                  <span className="text-[10px] bg-memora-border text-memora-text-muted px-2.5 py-0.5 rounded-full font-mono uppercase">
                    {rule.trigger}
                  </span>
                  <span className="text-[10px] bg-memora-accent/15 text-memora-accent px-2.5 py-0.5 rounded-full font-mono uppercase">
                    {rule.actions[0] || 'Tag'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 select-none shrink-0">
              <div className="text-right">
                <div className="text-xs text-white font-semibold">{rule.executionCount} executions</div>
                <div className="text-[10px] text-memora-text-muted font-mono mt-0.5">Active</div>
              </div>
            </div>
          </div>
        ))}

        {rules.length === 0 && (
          <div className="glass p-8 rounded-2xl text-center text-memora-text-muted flex flex-col items-center gap-3">
            <Zap size={32} className="text-memora-border animate-pulse" />
            <div className="text-xs">No automation rules created. Create one to classify imports automatically!</div>
          </div>
        )}
      </div>
    </div>
  );
}
