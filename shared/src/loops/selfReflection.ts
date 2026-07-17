export interface SelfReflectionInput {
  userId: string;
  recentMemoryIds: string[];
  timeWindow: {
    start: string;
    end: string;
  };
}

export interface SelfReflectionOutput {
  insights: Array<{
    type: 'pattern' | 'gap' | 'recommendation';
    description: string;
    confidence: number;
    relatedMemories: string[];
  }>;
  qualityScore: number;
  suggestedActions: string[];
}

export const SELF_REFLECTION_CONFIG = {
  minMemoriesRequired: 10,
  maxMemoriesToAnalyze: 100,
  reflectionPrompt: `You are a personal knowledge analyst. Analyze the following collection of memories belonging to a single user.

Your tasks:
1. Identify recurring patterns and themes across the memories
2. Detect knowledge gaps — areas the user has explored superficially but not deeply
3. Find contradictions or outdated information that should be reconciled
4. Suggest concrete actions to improve the user's knowledge base
5. Rate the overall quality of the memory collection (0-1 scale)

Provide your analysis as structured JSON with the following shape:
{
  "insights": [{ "type": "pattern|gap|recommendation", "description": "...", "confidence": 0.0-1.0, "relatedMemories": ["id1", "id2"] }],
  "qualityScore": 0.0-1.0,
  "suggestedActions": ["action1", "action2"]
}`,
} as const;
