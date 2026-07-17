import { TeamRole } from '../constants';

export interface Team {
  id: string;
  name: string;
  createdAt: Date;
  memberCount?: number;
}

export interface TeamMember {
  id: string;
  userId: string;
  teamId: string;
  role: TeamRole;
  user?: { id: string; name: string; email: string };
}

export interface TeamCreateRequest {
  name: string;
}

export interface TeamInviteRequest {
  email: string;
  role?: TeamRole;
}

export interface TeamUpdateRequest {
  name?: string;
}
