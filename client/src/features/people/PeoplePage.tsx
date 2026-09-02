import React, { useState, useEffect } from 'react';
import {
  usePeopleQuery,
  useCreatePersonMutation,
  usePersonDetailsQuery,
  useUpdatePersonMutation,
  useDeletePersonMutation,
} from '../../hooks/useQueries.js';
import { useDebounce } from '../../hooks/useDebounce.js';
import { Users, Mail, Building, Plus, X, Trash2, Edit3, ChevronRight, BookOpen } from 'lucide-react';

export default function PeoplePage() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);
  const { data: people = [], isLoading } = usePeopleQuery(debouncedQuery);
  const createPersonMutation = useCreatePersonMutation();
  const updatePersonMutation = useUpdatePersonMutation();
  const deletePersonMutation = useDeletePersonMutation();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [notes, setNotes] = useState('');

  // Selected person modal state
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const { data: activePerson, isLoading: isPersonLoading } = usePersonDetailsQuery(selectedPersonId || '');
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editCompany, setEditCompany] = useState('');
  const [editRole, setEditRole] = useState('');
  const [editNotes, setEditNotes] = useState('');

  useEffect(() => {
    if (activePerson) {
      setEditName(activePerson.name || '');
      setEditEmail(activePerson.email || '');
      setEditCompany(activePerson.company || '');
      setEditRole(activePerson.role || '');
      setEditNotes(activePerson.notes || '');
      setIsEditing(false);
    }
  }, [activePerson]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsCreateModalOpen(false);
        setSelectedPersonId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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
    setIsCreateModalOpen(false);
  };

  const handleUpdatePerson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPersonId || !editName.trim()) return;

    await updatePersonMutation.mutateAsync({
      id: selectedPersonId,
      data: {
        name: editName.trim(),
        email: editEmail.trim() || undefined,
        company: editCompany.trim() || undefined,
        role: editRole.trim() || undefined,
        notes: editNotes.trim() || undefined,
      },
    });

    setIsEditing(false);
  };

  const handleDeletePerson = async () => {
    if (!selectedPersonId) return;
    if (confirm(`Remove ${activePerson?.name || 'this contact'} from the registry?`)) {
      await deletePersonMutation.mutateAsync(selectedPersonId);
      setSelectedPersonId(null);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto animate-fade-in font-sans">
      <div className="flex justify-between items-center select-none">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wide">People Registry</h1>
          <p className="text-sm text-memora-text-muted">Detected individuals referenced in meetings, emails, or Slack chats.</p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
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
            <div
              key={person.id}
              onClick={() => setSelectedPersonId(person.id)}
              className="glass p-5 rounded-2xl border border-white/5 border-t border-white/12 flex gap-4 items-start hover:scale-[1.01] hover:border-white/15 active:scale-[0.99] transition-all duration-250 ease-out cursor-pointer group"
            >
              <div className="h-10 w-10 bg-memora-accent/15 border border-memora-accent/20 rounded-full flex items-center justify-center font-bold text-memora-accent select-none shrink-0 group-hover:bg-memora-accent/25 transition-colors">
                {person.name[0]?.toUpperCase() || 'P'}
              </div>
              
              <div className="flex-1 flex flex-col gap-1 min-w-0">
                <span className="font-bold text-white leading-tight group-hover:text-memora-accent transition-colors">{person.name}</span>
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
              
              <div className="text-right shrink-0 select-none flex flex-col items-end gap-2">
                <span className="text-[10px] bg-memora-border text-memora-text-muted px-2.5 py-0.5 rounded-full font-mono font-semibold">
                  {person.memoryCount || person._count?.mentions || 0} mentions
                </span>
                <ChevronRight size={16} className="text-memora-text-muted group-hover:text-white transition-colors" />
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

      {/* Person Detail & Edit Modal */}
      {selectedPersonId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-4"
          onClick={() => setSelectedPersonId(null)}
        >
          <div
            className="glass p-6 rounded-2xl border border-white/15 w-full max-w-lg flex flex-col gap-5 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start border-b border-memora-border/40 pb-3">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 bg-memora-accent/20 border border-memora-accent/30 rounded-full flex items-center justify-center font-bold text-memora-accent text-lg">
                  {activePerson?.name?.[0]?.toUpperCase() || 'P'}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">{activePerson?.name || 'Contact'}</h2>
                  <span className="text-xs text-memora-text-muted">{activePerson?.role || 'Individual'}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  title="Edit details"
                  className="p-1.5 rounded-lg border border-memora-border text-memora-text-muted hover:text-white transition-colors cursor-pointer"
                >
                  <Edit3 size={14} />
                </button>
                <button
                  onClick={handleDeletePerson}
                  title="Delete person"
                  className="p-1.5 rounded-lg border border-memora-border text-memora-text-muted hover:text-rose-400 transition-colors cursor-pointer"
                >
                  <Trash2 size={14} />
                </button>
                <button
                  onClick={() => setSelectedPersonId(null)}
                  className="p-1.5 text-memora-text-muted hover:text-white transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {isEditing ? (
              <form onSubmit={handleUpdatePerson} className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-memora-text-muted">Full Name</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="bg-memora-bg border border-memora-border rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-memora-accent"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-memora-text-muted">Email</label>
                    <input
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      className="bg-memora-bg border border-memora-border rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-memora-accent"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-memora-text-muted">Company</label>
                    <input
                      type="text"
                      value={editCompany}
                      onChange={(e) => setEditCompany(e.target.value)}
                      className="bg-memora-bg border border-memora-border rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-memora-accent"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-memora-text-muted">Role / Title</label>
                  <input
                    type="text"
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value)}
                    className="bg-memora-bg border border-memora-border rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-memora-accent"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-memora-text-muted">Notes</label>
                  <textarea
                    rows={2}
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    className="bg-memora-bg border border-memora-border rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-memora-accent"
                  />
                </div>
                <div className="flex justify-end gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-3 py-1.5 border border-memora-border rounded-lg text-xs text-memora-text-muted hover:text-white cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updatePersonMutation.isPending}
                    className="px-3.5 py-1.5 bg-memora-accent text-white font-semibold rounded-lg text-xs hover:bg-memora-accent-hover cursor-pointer"
                  >
                    {updatePersonMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-3 text-xs bg-memora-surface/50 p-3 rounded-xl border border-white/5">
                  <div>
                    <span className="text-memora-text-muted block text-[11px]">Email</span>
                    <span className="text-white font-medium">{activePerson?.email || 'None'}</span>
                  </div>
                  <div>
                    <span className="text-memora-text-muted block text-[11px]">Company</span>
                    <span className="text-white font-medium">{activePerson?.company || 'None'}</span>
                  </div>
                  {activePerson?.notes && (
                    <div className="col-span-2 pt-2 border-t border-white/5">
                      <span className="text-memora-text-muted block text-[11px]">Notes</span>
                      <span className="text-slate-200">{activePerson.notes}</span>
                    </div>
                  )}
                </div>

                {/* Linked Mentions List */}
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-semibold text-memora-text-muted uppercase tracking-wider flex items-center gap-1.5">
                    <BookOpen size={12} /> Referenced Memories ({activePerson?.mentions?.length || 0})
                  </span>
                  {activePerson?.mentions && activePerson.mentions.length > 0 ? (
                    <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
                      {activePerson.mentions.map((m: any) => (
                        <div
                          key={m.id}
                          className="p-3 rounded-xl bg-memora-bg/60 border border-white/5 text-xs flex justify-between items-center"
                        >
                          <div className="flex flex-col gap-0.5">
                            <span className="font-semibold text-white">{m.memory?.title || 'Memory Note'}</span>
                            <span className="text-[11px] text-memora-text-muted truncate max-w-sm">
                              {m.memory?.content?.slice(0, 80)}...
                            </span>
                          </div>
                          <span className="text-[10px] uppercase font-mono px-2 py-0.5 bg-white/5 rounded border border-white/10 text-memora-accent shrink-0">
                            {m.memory?.source || 'web'}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-memora-text-muted">No memory mentions recorded yet.</span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Person Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-4">
          <div className="glass p-6 rounded-2xl border border-white/15 w-full max-w-md flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-white">Add Contact to Registry</h2>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-memora-text-muted hover:text-white transition-colors cursor-pointer"
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
                  onClick={() => setIsCreateModalOpen(false)}
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
