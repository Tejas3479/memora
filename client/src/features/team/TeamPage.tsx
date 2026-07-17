import React, { useEffect, useState } from 'react';
import { api } from '../../api/client.js';
import { Users, UserPlus, Shield } from 'lucide-react';

export default function TeamPage() {
  const [memberships, setMemberships] = useState<any[]>([]);

  useEffect(() => {
    api.get('/api/teams').then(setMemberships).catch(console.error);
  }, []);

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white font-sans">Team Workspaces</h1>
          <p className="text-sm text-memora-text-muted">Connect your memory layer to corporate workspaces and share knowledge.</p>
        </div>
        <button className="px-4 py-2 bg-memora-accent text-white font-semibold rounded-lg text-sm hover:bg-memora-accent-hover flex items-center gap-1.5">
          <UserPlus size={16} />
          Create Team
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {memberships.map((member) => (
          <div key={member.id} className="glass p-5 rounded-xl flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-memora-bg rounded-lg">
                <Users className="text-memora-accent" size={24} />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-white">{member.team?.name}</span>
                <span className="text-xs text-memora-text-muted">Created on {new Date(member.team?.createdAt).toLocaleDateString()}</span>
              </div>
            </div>

            <span className="text-xs bg-memora-border text-white px-3 py-1 rounded font-semibold uppercase flex items-center gap-1.5">
              <Shield size={12} className="text-memora-accent" />
              {member.role}
            </span>
          </div>
        ))}

        {memberships.length === 0 && (
          <div className="glass p-8 rounded-xl text-center text-memora-text-muted flex flex-col items-center gap-2">
            <Users size={32} className="text-memora-border" />
            <div className="text-sm font-medium">Not a member of any teams yet. Create a team workspace to invite members!</div>
          </div>
        )}
      </div>
    </div>
  );
}
