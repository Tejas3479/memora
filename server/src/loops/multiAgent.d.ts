import { MultiAgentInput, MultiAgentOutput, AgentRole } from '@memora/shared';
export declare class MultiAgentLoop {
    private ai;
    constructor();
    execute(input: MultiAgentInput): Promise<MultiAgentOutput>;
    runAgent(role: AgentRole, prompt: string, context: string[]): Promise<string>;
}
export default MultiAgentLoop;
//# sourceMappingURL=multiAgent.d.ts.map