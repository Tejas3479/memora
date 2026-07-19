import { createLogger } from './logger.js';

const logger = createLogger('CircuitBreaker');

export interface CircuitBreakerConfig {
  failureThreshold: number; // Number of failures before opening circuit
  cooldownPeriod: number;    // Time in ms before transitioning from Open to Half-Open
}

export class CircuitBreaker {
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private failureCount = 0;
  private lastFailureTime: number | null = null;
  private name: string;
  private config: CircuitBreakerConfig;

  constructor(name: string, config: CircuitBreakerConfig = { failureThreshold: 5, cooldownPeriod: 10000 }) {
    this.name = name;
    this.config = config;
  }

  public async execute<T>(action: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (this.lastFailureTime && Date.now() - this.lastFailureTime > this.config.cooldownPeriod) {
        logger.info(`[CircuitBreaker: ${this.name}] Cooldown passed. Transitioning to HALF-OPEN.`);
        this.state = 'HALF_OPEN';
      } else {
        logger.warn(`[CircuitBreaker: ${this.name}] Circuit is OPEN. Blocking request.`);
        throw new Error(`Circuit breaker [${this.name}] is open`);
      }
    }

    try {
      const result = await action();
      
      if (this.state === 'HALF_OPEN') {
        logger.info(`[CircuitBreaker: ${this.name}] Request succeeded in HALF-OPEN. Resetting to CLOSED.`);
        this.state = 'CLOSED';
        this.failureCount = 0;
      }
      
      return result;
    } catch (error) {
      this.failureCount++;
      this.lastFailureTime = Date.now();
      
      if (this.state === 'CLOSED' && this.failureCount >= this.config.failureThreshold) {
        logger.error(`[CircuitBreaker: ${this.name}] Failure threshold (${this.config.failureThreshold}) reached. Opening circuit.`);
        this.state = 'OPEN';
      } else if (this.state === 'HALF_OPEN') {
        logger.error(`[CircuitBreaker: ${this.name}] Request failed in HALF-OPEN. Returning to OPEN.`);
        this.state = 'OPEN';
      }

      throw error;
    }
  }

  public getState(): 'CLOSED' | 'OPEN' | 'HALF_OPEN' {
    return this.state;
  }
}

// Singleton breakers for central services
export const slackBreaker = new CircuitBreaker('SlackAPI', { failureThreshold: 5, cooldownPeriod: 15000 });
export const notionBreaker = new CircuitBreaker('NotionAPI', { failureThreshold: 5, cooldownPeriod: 15000 });
export const geminiBreaker = new CircuitBreaker('GeminiAPI', { failureThreshold: 5, cooldownPeriod: 15000 });
export const voyageBreaker = new CircuitBreaker('VoyageAPI', { failureThreshold: 5, cooldownPeriod: 15000 });
export const qdrantBreaker = new CircuitBreaker('QdrantDB', { failureThreshold: 5, cooldownPeriod: 15000 });
