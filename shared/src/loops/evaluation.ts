export interface EvaluationInput {
  userId: string;
  period: {
    start: string;
    end: string;
  };
  feedbackIds?: string[];
}

export interface EvaluationOutput {
  searchQuality: {
    precision: number;
    recall: number;
    mrr: number;
  };
  synthesisQuality: {
    relevance: number;
    accuracy: number;
    completeness: number;
  };
  userSatisfaction: number;
  recommendations: string[];
}

export const EVALUATION_CONFIG = {
  minFeedbackSamples: 5,
  evaluationCadence: 'weekly' as const,
  metricsToTrack: ['precision', 'recall', 'mrr', 'relevance', 'accuracy', 'completeness'] as const,
  improvementThreshold: 0.05,
} as const;
