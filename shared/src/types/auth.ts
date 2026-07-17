import { Plan } from '../constants';

export interface UserSettings {
  autoCapture: boolean;
  defaultFolder?: string;
  theme: 'light' | 'dark' | 'system';
  notifications: boolean;
  weeklyDigest: boolean;
  language: string;
}

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  plan: Plan;
  settings: UserSettings;
}

export interface JwtPayload {
  userId: string;
  email: string;
  plan: Plan;
  iat: number;
  exp: number;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export type SafeUser = Omit<User, 'passwordHash'>;

export interface AuthResponse {
  user: SafeUser;
  tokens?: TokenPair;
}
