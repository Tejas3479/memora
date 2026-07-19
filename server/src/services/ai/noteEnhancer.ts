import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../../config.js';
import { retry } from '../../lib/utils.js';
import { geminiBreaker } from '../../lib/circuitBreaker.js';

export interface EnhancedNote {
  cleanedContent: string;
  actionItems: string[];
  keyDecisions: string[];
  participants: string[];
  topics: string[];
  summary: string;
}

export class NoteEnhancer {
  private ai: GoogleGenerativeAI | null = null;

  constructor() {
    if (config.llm.googleApiKey) {
      this.ai = new GoogleGenerativeAI(config.llm.googleApiKey);
    }
  }

  public async enhance(
    rawNote: string,
    context?: { meetingTitle?: string; participants?: string[]; date?: string },
  ): Promise<EnhancedNote> {
    if (!rawNote || rawNote.trim() === '') {
      throw new Error('Note content cannot be empty');
    }

    if (!this.ai) {
      return this.fallbackEnhance(rawNote, context);
    }

    try {
      const model = this.ai.getGenerativeModel({ model: config.llm.model });
      const prompt = `You are a professional note-taking assistant. Enhance the following raw notes:
"${rawNote}"

Context:
Title: ${context?.meetingTitle || 'Untitled Note'}
Participants: ${(context?.participants || []).join(', ') || 'Unknown'}
Date: ${context?.date || 'Today'}

Format the output strictly as a JSON object matching this TypeScript interface:
{
  cleanedContent: string; // Markdown formatted, structured and readable version of the notes
  actionItems: string[];  // List of task assignments or action items extracted
  keyDecisions: string[]; // List of decisions made during discussions
  participants: string[]; // List of people mentioned
  topics: string[];       // General topics/tags discussed
  summary: string;        // One-sentence summary of the note
}`;

      const response = await geminiBreaker.execute(() =>
        retry(
          () => model.generateContent(prompt),
          { attempts: 3, delay: 1000, backoff: 'exponential' }
        )
      );
      const text = response.response.text();
      
      // Clean JSON markers if returned
      const jsonStart = text.indexOf('{');
      const jsonEnd = text.lastIndexOf('}') + 1;
      const jsonStr = text.slice(jsonStart, jsonEnd);

      return JSON.parse(jsonStr) as EnhancedNote;
    } catch (err) {
      console.error('[NoteEnhancer] Error enhancing note, falling back:', err);
      return this.fallbackEnhance(rawNote, context);
    }
  }

  public async extractActionItems(text: string): Promise<string[]> {
    const res = await this.enhance(text);
    return res.actionItems;
  }

  public async summarize(text: string, maxLength = 100): Promise<string> {
    const res = await this.enhance(text);
    if (res.summary.length <= maxLength) return res.summary;
    return res.summary.slice(0, maxLength - 3) + '...';
  }

  private fallbackEnhance(
    rawNote: string,
    context?: { meetingTitle?: string; participants?: string[]; date?: string },
  ): EnhancedNote {
    // Regex based simple extraction
    const lines = rawNote.split('\n');
    const actionItems: string[] = [];
    const keyDecisions: string[] = [];
    
    for (const line of lines) {
      const lower = line.toLowerCase();
      if (lower.includes('todo') || lower.includes('action:') || lower.startsWith('- [ ]')) {
        actionItems.push(line.replace(/^(todo|action:|- \[\s\])\s*/i, '').trim());
      }
      if (lower.includes('decide') || lower.includes('decision:')) {
        keyDecisions.push(line.replace(/^(decide|decision:)\s*/i, '').trim());
      }
    }

    return {
      cleanedContent: `# ${context?.meetingTitle || 'Note'}\n\n${rawNote}`,
      actionItems,
      keyDecisions,
      participants: context?.participants || [],
      topics: ['general'],
      summary: `Note created on ${context?.date || new Date().toLocaleDateString()}`,
    };
  }
}
export default NoteEnhancer;
