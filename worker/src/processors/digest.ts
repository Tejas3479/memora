import { Job } from 'bullmq';
import { WeeklyDigestPayload, WeeklyDigestResult, createLogger } from '@memora/shared';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { prisma } from '../prisma.js';

const logger = createLogger('DigestProcessor');

export async function digestProcessor(job: Job<WeeklyDigestPayload>): Promise<WeeklyDigestResult> {
  const { userId, weekStart, weekEnd } = job.data;

  const startDate = weekStart ? new Date(weekStart) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const endDate = weekEnd ? new Date(weekEnd) : new Date();

  // Retrieve memories compiled during the week from PostgreSQL
  const memories = await prisma.memory.findMany({
    where: {
      userId,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  logger.info(`Compiling weekly summary report for ${userId} across ${memories.length} memory records.`);

  if (memories.length === 0) {
    return {
      memoriesCount: 0,
      topTopics: [],
      summaryGenerated: false,
    };
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  let summaryText = '';
  let topTopics: string[] = [];

  if (apiKey) {
    try {
      const ai = new GoogleGenerativeAI(apiKey);
      const model = ai.getGenerativeModel({ model: process.env.LLM_MODEL || 'gemini-1.5-flash' });

      const memorySnippets = memories
        .slice(0, 20)
        .map((m, i) => `[${i + 1}] (${m.source}) ${m.title}: ${m.content.slice(0, 300)}`)
        .join('\n');

      const prompt = `You are an executive memory assistant. Review the following notes and captures from the past week:
${memorySnippets}

1. Provide a concise 3-bullet synthesis of key accomplishments and recurring themes.
2. List 3 to 5 top topic keywords as a comma-separated list on the final line prefixed with "TOPICS: "`;

      const res = await model.generateContent(prompt);
      const text = res.response.text();
      const topicsMatch = text.match(/TOPICS:\s*(.*)$/im);
      if (topicsMatch && topicsMatch[1]) {
        topTopics = topicsMatch[1].split(',').map((t) => t.trim()).filter(Boolean);
      }
      summaryText = text.replace(/TOPICS:\s*.*$/im, '').trim();
    } catch (llmErr) {
      logger.warn('Failed to generate AI weekly digest, using fallback:', llmErr);
      summaryText = `Compiled ${memories.length} memory entries between ${startDate.toLocaleDateString()} and ${endDate.toLocaleDateString()}.`;
      topTopics = Array.from(new Set(memories.map((m) => m.source)));
    }
  } else {
    summaryText = `Compiled ${memories.length} memory entries between ${startDate.toLocaleDateString()} and ${endDate.toLocaleDateString()}.`;
    topTopics = Array.from(new Set(memories.map((m) => m.source)));
  }

  // Persist weekly digest in PostgreSQL
  try {
    await prisma.memory.create({
      data: {
        userId,
        title: `Weekly Digest: ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`,
        content: summaryText,
        source: 'NOTE',
        url: `memora://digest/${startDate.toISOString().slice(0, 10)}`,
        metadata: {
          isDigest: true,
          memoriesCount: memories.length,
          topTopics,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        },
      },
    });
  } catch (err) {
    logger.warn('Failed to save weekly digest memory record:', err);
  }

  return {
    memoriesCount: memories.length,
    topTopics,
    summaryGenerated: true,
  };
}
