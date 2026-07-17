export type AgentRole = 'researcher' | 'synthesizer' | 'critic' | 'curator';

export interface AgentMessage {
  fromAgent: AgentRole;
  toAgent: AgentRole;
  content: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
}

export interface MultiAgentInput {
  userId: string;
  task: string;
  agents: AgentRole[];
  maxRounds: number;
  context?: string[];
}

export interface MultiAgentOutput {
  finalResult: string;
  agentConversation: AgentMessage[];
  roundsUsed: number;
  consensusReached: boolean;
}

export const MULTI_AGENT_CONFIG = {
  defaultAgents: ['researcher', 'synthesizer', 'critic'] as const,
  maxRounds: 5,
  consensusThreshold: 0.8,
  timeoutMs: 30000,
} as const;
