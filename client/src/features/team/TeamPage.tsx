import React, { useState, useEffect } from 'react';
import {
  useTeamsQuery,
  useCreateTeamMutation,
  useTeamDetailsQuery,
  useInviteTeamMemberMutation,
  useRemoveTeamMemberMutation,
} from '../../hooks/useQueries.js';
import { Users, UserPlus, Shield, X, Mail, Trash2, ChevronRight, Check } from 'lucide-react';

export default function TeamPage() {
  const { data: memberships = [], isLoading } = useTeamsQuery();
  const createTeamMutation = useCreateTeamMutation();
  const inviteMemberMutation = useInviteTeamMemberMutation();
  const removeMemberMutation = useRemoveTeamMemberMutation();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [teamName, setTeamName] = useState('');

  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const { data: activeTeamDetails, isLoading: isTeamDetailsLoading } = useTeamDetailsQuery(selectedTeamId || '');

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'member' | 'admin'>('member');
  const [inviteFeedback, setInviteFeedback] = useState<string | null>(null);

  // Close modals on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsCreateModalOpen(false);
        setSelectedTeamId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim()) return;

    await createTeamMutation.mutateAsync({
      name: teamName.trim(),
    });

    setTeamName('');
    setIsCreateModalOpen(false);
  };

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeamId || !inviteEmail.trim()) return;

    try {
      await inviteMemberMutation.mutateAsync({
        teamId: selectedTeamId,
        email: inviteEmail.trim(),
        role: inviteRole,
      });
      setInviteEmail('');
      setInviteFeedback('Invitation sent successfully!');
      setTimeout(() => setInviteFeedback(null), 3000);
    } catch (err: any) {
      setInviteFeedback(err.message || 'Failed to send invite');
      setTimeout(() => setInviteFeedback(null), 4000);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!selectedTeamId) return;
    if (confirm('Are you sure you want to remove this member from the team?')) {
      try {
        await removeMemberMutation.mutateAsync({
          teamId: selectedTeamId,
          userId,
        });
      } catch (err: any) {
        alert(err.message || 'Failed to remove member');
      }
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto animate-fade-in font-sans">
      <div className="flex justify-between items-center select-none">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wide">Team Workspaces</h1>
          <p className="text-sm text-memora-text-muted">Connect your memory layer to corporate workspaces and share knowledge.</p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2 bg-memora-accent text-white font-semibold rounded-lg text-sm hover:bg-memora-accent-hover active:scale-95 transition-all duration-200 cursor-pointer shadow-lg shadow-memora-accent-glow flex items-center gap-1.5"
        >
          <UserPlus size={16} />
          Create Team
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {isLoading ? (
          <div className="grid grid-cols-1 gap-4">
            <div className="h-20 shimmer rounded-2xl border border-white/5"></div>
            <div className="h-20 shimmer rounded-2xl border border-white/5"></div>
          </div>
        ) : memberships.length > 0 ? (
          memberships.map((member: any) => (
            <div
              key={member.id}
              onClick={() => setSelectedTeamId(member.teamId || member.team?.id)}
              className="glass p-5 rounded-2xl border border-white/5 border-t border-white/12 flex justify-between items-center hover:scale-[1.01] hover:border-white/15 active:scale-[0.99] transition-all duration-250 ease-out cursor-pointer group"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-memora-bg rounded-xl border border-memora-border group-hover:border-memora-accent/50 transition-colors">
                  <Users className="text-memora-accent" size={20} />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="font-bold text-white text-base leading-snug group-hover:text-memora-accent transition-colors">
                    {member.team?.name || 'Team Workspace'}
                  </span>
                  <span className="text-xs text-memora-text-muted">
                    Created on {member.team?.createdAt ? new Date(member.team.createdAt).toLocaleDateString() : 'Recent'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs bg-memora-border/60 text-white px-3 py-1 rounded-full font-semibold uppercase flex items-center gap-1.5 border border-memora-border select-none">
                  <Shield size={12} className="text-memora-accent" />
                  {member.role || 'Member'}
                </span>
                <ChevronRight size={18} className="text-memora-text-muted group-hover:text-white transition-colors" />
              </div>
            </div>
          ))
        ) : (
          <div className="glass p-8 rounded-2xl text-center text-memora-text-muted flex flex-col items-center gap-3 select-none">
            <Users size={32} className="text-memora-border animate-pulse" />
            <div className="text-sm font-medium">Not a member of any teams yet. Create a team workspace to invite members!</div>
          </div>
        )}
      </div>

      {/* Team Details & Members Modal */}
      {selectedTeamId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-4"
          onClick={() => setSelectedTeamId(null)}
        >
          <div
            className="glass p-6 rounded-2xl border border-white/15 w-full max-w-lg flex flex-col gap-5 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center border-b border-memora-border/40 pb-3">
              <div>
                <h2 className="text-lg font-bold text-white">
                  {activeTeamDetails?.name || 'Team Workspace'}
                </h2>
                <p className="text-xs text-memora-text-muted">Manage team members and invite collaborators.</p>
              </div>
              <button
                onClick={() => setSelectedTeamId(null)}
                className="text-memora-text-muted hover:text-white transition-colors cursor-pointer p-1"
              >
                <X size={18} />
              </button>
            </div>

            {/* Invite New Member Form */}
            <form onSubmit={handleInviteMember} className="flex flex-col gap-3 bg-memora-surface/50 p-4 rounded-xl border border-white/5">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Mail size={14} className="text-memora-accent" />
                Invite Team Member
              </span>
              <div className="flex gap-2">
                <input
                  type="email"
                  required
                  placeholder="collaborator@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="flex-1 bg-memora-bg border border-memora-border rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-memora-accent"
                />
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as any)}
                  className="bg-memora-bg border border-memora-border rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-memora-accent"
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
                <button
                  type="submit"
                  disabled={inviteMemberMutation.isPending || !inviteEmail.trim()}
                  className="px-3.5 py-1.5 bg-memora-accent text-white font-semibold rounded-xl text-xs hover:bg-memora-accent-hover disabled:opacity-50 cursor-pointer whitespace-nowrap"
                >
                  {inviteMemberMutation.isPending ? 'Sending...' : 'Invite'}
                </button>
              </div>
              {inviteFeedback && (
                <span className={`text-[11px] font-medium ${inviteFeedback.includes('success') ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {inviteFeedback}
                </span>
              )}
            </form>

            {/* Members List */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold text-memora-text-muted uppercase tracking-wider">
                Members ({activeTeamDetails?.members?.length || 0})
              </span>
              {isTeamDetailsLoading ? (
                <div className="h-16 shimmer rounded-xl"></div>
              ) : activeTeamDetails?.members && activeTeamDetails.members.length > 0 ? (
                activeTeamDetails.members.map((m: any) => (
                  <div
                    key={m.id}
                    className="flex justify-between items-center p-3 rounded-xl bg-memora-bg/60 border border-white/5 text-xs"
                  >
                    <div className="flex flex-col">
                      <span className="font-semibold text-white">{m.user?.name || 'User'}</span>
                      <span className="text-memora-text-muted text-[11px]">{m.user?.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px] uppercase font-bold text-memora-text-muted">
                        {m.role}
                      </span>
                      {m.role !== 'owner' && (
                        <button
                          onClick={() => handleRemoveMember(m.userId)}
                          title="Remove member"
                          className="text-memora-text-muted hover:text-rose-400 p-1 transition-colors cursor-pointer"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <span className="text-xs text-memora-text-muted">No members found.</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Team Modal */}
      {isCreateModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-4"
          onClick={() => setIsCreateModalOpen(false)}
        >
          <div
            className="glass p-6 rounded-2xl border border-white/15 w-full max-w-md flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-white">Create New Team</h2>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-memora-text-muted hover:text-white transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateTeam} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-memora-text-muted">Team Name</label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g. Engineering Core"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  className="bg-memora-bg border border-memora-border rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-memora-accent"
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
                  disabled={createTeamMutation.isPending || !teamName.trim()}
                  className="px-4 py-2 bg-memora-accent text-white font-semibold rounded-lg text-xs hover:bg-memora-accent-hover disabled:opacity-50 cursor-pointer"
                >
                  {createTeamMutation.isPending ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
