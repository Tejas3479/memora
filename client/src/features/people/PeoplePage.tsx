import React, { useState } from 'react';
import { usePeopleQuery, useCreatePersonMutation } from '../../hooks/useQueries.js';
import { Users, Mail, Building, Plus, X } from 'lucide-react';

export default function PeoplePage() {
  const [query, setQuery] = useState('');
  const { data: people = [], isLoading } = usePeopleQuery(query);
  const createPersonMutation = useCreatePersonMutation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [notes, setNotes] = useState('');

  const handleCreatePerson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    await createPersonMutation.mutateAsync({
      name: name.trim(),
      email: email.trim() || undefined,
      company: company.trim() || undefined,
      role: role.trim() || undefined,
      notes: notes.trim() || undefined,
    });

    setName('');
    setEmail('');
    setCompany('');
    setRole('');
    setNotes('');
    setIsModalOpen(false);
  };

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto animate-fade-in font-sans">
      <div className="flex justify-between items-center select-none">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wide">People Registry</h1>
          <p className="text-sm text-memora-text-muted">Detected individuals referenced in meetings, emails, or Slack chats.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-memora-accent text-white font-semibold rounded-lg text-sm hover:bg-memora-accent-hover active:scale-95 transition-all duration-200 cursor-pointer shadow-lg shadow-memora-accent-glow flex items-center gap-1.5"
        >
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
        {isLoading ? (
          <div className="contents">
            <div className="h-28 shimmer rounded-2xl border border-white/5"></div>
            <div className="h-28 shimmer rounded-2xl border border-white/5"></div>
          </div>
        ) : people.length > 0 ? (
          people.map((person: any) => (
            <div key={person.id} className="glass p-5 rounded-2xl border border-white/5 border-t border-white/12 flex gap-4 items-start hover:scale-[1.01] hover:border-white/15 active:scale-[0.99] transition-all duration-250 ease-out">
              <div className="h-10 w-10 bg-memora-accent/15 border border-memora-accent/20 rounded-full flex items-center justify-center font-bold text-memora-accent select-none shrink-0">
                {person.name[0]?.toUpperCase() || 'P'}
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
                  {person.memoryCount || person._count?.mentions || 0} mentions
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="glass col-span-2 p-8 rounded-2xl text-center text-memora-text-muted flex flex-col items-center gap-3">
            <Users size={32} className="text-memora-border animate-pulse" />
            <div className="text-sm">No matched people found. Registry is populated as you capture pages.</div>
          </div>
        )}
      </div>

      {/* Add Person Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="glass p-6 rounded-2xl border border-white/15 w-full max-w-md flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-white">Add Contact to Registry</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-memora-text-muted hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreatePerson} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-memora-text-muted">Full Name</label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g. Sarah Connor"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-memora-bg border border-memora-border rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-memora-accent"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-memora-text-muted">Email</label>
                  <input
                    type="email"
                    placeholder="sarah@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-memora-bg border border-memora-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-memora-accent"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-memora-text-muted">Company</label>
                  <input
                    type="text"
                    placeholder="Cyberdyne Systems"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className="bg-memora-bg border border-memora-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-memora-accent"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-memora-text-muted">Role / Title</label>
                <input
                  type="text"
                  placeholder="e.g. Lead Architect"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="bg-memora-bg border border-memora-border rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-memora-accent"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-memora-text-muted">Notes (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Key areas of focus, past projects..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="bg-memora-bg border border-memora-border rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-memora-accent"
                />
              </div>

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
                  disabled={createPersonMutation.isPending || !name.trim()}
                  className="px-4 py-2 bg-memora-accent text-white font-semibold rounded-lg text-xs hover:bg-memora-accent-hover disabled:opacity-50 cursor-pointer"
                >
                  {createPersonMutation.isPending ? 'Adding...' : 'Add Person'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
