import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config.js';
export class MultiAgentLoop {
    ai = null;
    constructor() {
        if (config.llm.googleApiKey) {
            this.ai = new GoogleGenerativeAI(config.llm.googleApiKey);
        }
    }
    async execute(input) {
        const conversation = [];
        let currentTaskContext = input.context?.join('\n') || '';
        // Simulate debate loops
        const agents = input.agents || ['researcher', 'critic', 'synthesizer'];
        let roundsUsed = 0;
        for (let round = 1; round <= input.maxRounds; round++) {
            roundsUsed = round;
            for (let i = 0; i < agents.length; i++) {
                const role = agents[i];
                const nextRole = agents[(i + 1) % agents.length];
                const prompt = `You are playing the role of "${role}" in a debate.
The current task is: "${input.task}".
Current discussion states:
${currentTaskContext}

Provide your feedback, critiques, or additions as a "${role}".`;
                const responseText = await this.runAgent(role, prompt, [currentTaskContext]);
                conversation.push({
                    fromAgent: role,
                    toAgent: nextRole,
                    content: responseText,
                    timestamp: new Date().toISOString(),
                });
                currentTaskContext += `\n[${role}]: ${responseText}`;
            }
            // consensus exit check placeholder
            if (round >= 2)
                break;
        }
        return {
            finalResult: currentTaskContext,
            agentConversation: conversation,
            roundsUsed,
            consensusReached: true,
        };
    }
    async runAgent(role, prompt, context) {
        if (!this.ai) {
            return `[Agent ${role} placeholder answer because Google API Key is not set.]`;
        }
        try {
            const model = this.ai.getGenerativeModel({ model: config.llm.model });
            const response = await model.generateContent(prompt);
            return response.response.text();
        }
        catch (err) {
            return `[Agent ${role} error: ${err.message}]`;
        }
    }
}
export default MultiAgentLoop;
//# sourceMappingURL=multiAgent.js.map