import React, { useEffect, useState } from 'react';
import { api } from '../../api/client.js';
import { Users, UserPlus, Shield } from 'lucide-react';

export default function TeamPage() {
  const [memberships, setMemberships] = useState<any[]>([]);

  useEffect(() => {
    api.get('/api/teams').then(setMemberships).catch(console.error);
  }, []);

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto animate-fade-in font-sans">
      <div className="flex justify-between items-center select-none">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wide">Team Workspaces</h1>
          <p className="text-sm text-memora-text-muted">Connect your memory layer to corporate workspaces and share knowledge.</p>
        </div>
        <button className="px-4 py-2 bg-memora-accent text-white font-semibold rounded-lg text-sm hover:bg-memora-accent-hover active:scale-95 transition-all duration-200 cursor-pointer shadow-lg shadow-memora-accent-glow flex items-center gap-1.5">
          <UserPlus size={16} />
          Create Team
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {memberships.map((member) => (
          <div key={member.id} className="glass p-5 rounded-2xl border border-white/5 border-t border-white/12 flex justify-between items-center hover:scale-[1.01] hover:border-white/15 active:scale-[0.99] transition-all duration-250 ease-out">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-memora-bg rounded-xl border border-memora-border">
                <Users className="text-memora-accent" size={20} />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="font-bold text-white text-base leading-snug">{member.team?.name}</span>
                <span className="text-xs text-memora-text-muted">Created on {new Date(member.team?.createdAt).toLocaleDateString()}</span>
              </div>
            </div>

            <span className="text-xs bg-memora-border/60 text-white px-3 py-1 rounded-full font-semibold uppercase flex items-center gap-1.5 border border-memora-border select-none">
              <Shield size={12} className="text-memora-accent" />
              {member.role}
            </span>
          </div>
        ))}

        {memberships.length === 0 && (
          <div className="glass p-8 rounded-2xl text-center text-memora-text-muted flex flex-col items-center gap-3 select-none">
            <Users size={32} className="text-memora-border animate-pulse" />
            <div className="text-sm font-medium">Not a member of any teams yet. Create a team workspace to invite members!</div>
          </div>
        )}
      </div>
    </div>
  );
}
