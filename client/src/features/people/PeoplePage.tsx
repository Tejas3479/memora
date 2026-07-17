import React, { useEffect, useState } from 'react';
import { api } from '../../api/client.js';
import { Users, Mail, Building, Plus } from 'lucide-react';

export default function PeoplePage() {
  const [people, setPeople] = useState<any[]>([]);
  const [query, setQuery] = useState('');

  useEffect(() => {
    api.get(`/api/people?query=${query}`).then(setPeople).catch(console.error);
  }, [query]);

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto animate-fade-in font-sans">
      <div className="flex justify-between items-center select-none">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wide">People Registry</h1>
          <p className="text-sm text-memora-text-muted">Detected individuals referenced in meetings, emails, or Slack chats.</p>
        </div>
        <button className="px-4 py-2 bg-memora-accent text-white font-semibold rounded-lg text-sm hover:bg-memora-accent-hover active:scale-95 transition-all duration-200 cursor-pointer shadow-lg shadow-memora-accent-glow flex items-center gap-1.5">
          <Plus size={16} />
          Add Person
        </button>
      </div>

      <input
        type="text"
        placeholder="Filter by name, email, or company..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full h-11 bg-memora-surface/85 border border-memora-border rounded-xl px-4 text-white text-sm focus:outline-none focus:border-memora-accent focus:ring-2 focus:ring-memora-accent/20 transition-all duration-200"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {people.map((person) => (
          <div key={person.id} className="glass p-5 rounded-2xl border border-white/5 border-t border-white/12 flex gap-4 items-start hover:scale-[1.01] hover:border-white/15 active:scale-[0.99] transition-all duration-250 ease-out">
            <div className="h-10 w-10 bg-memora-accent/15 border border-memora-accent/20 rounded-full flex items-center justify-center font-bold text-memora-accent select-none">
              {person.name[0]?.toUpperCase()}
            </div>
            
            <div className="flex-1 flex flex-col gap-1 min-w-0">
              <span className="font-bold text-white leading-tight">{person.name}</span>
              {person.role && <span className="text-xs text-memora-text-muted">{person.role}</span>}
              
              <div className="flex flex-col gap-1 mt-3 text-xs text-memora-text-muted">
                {person.email && (
                  <div className="flex items-center gap-2">
                    <Mail size={12} className="text-memora-text-muted" />
                    <span className="truncate">{person.email}</span>
                  </div>
                )}
                {person.company && (
                  <div className="flex items-center gap-2">
                    <Building size={12} className="text-memora-text-muted" />
                    <span className="truncate">{person.company}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="text-right shrink-0 select-none">
              <span className="text-[10px] bg-memora-border text-memora-text-muted px-2.5 py-0.5 rounded-full font-mono font-semibold">
                {person.memoryCount} mentions
              </span>
            </div>
          </div>
        ))}
      </div>

      {people.length === 0 && (
        <div className="glass p-8 rounded-2xl text-center text-memora-text-muted flex flex-col items-center gap-3">
          <Users size={32} className="text-memora-border animate-pulse" />
          <div className="text-sm">No matched people found. Registry is populated as you capture pages.</div>
        </div>
      )}
    </div>
  );
}
