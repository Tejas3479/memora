import { EvaluationInput, EvaluationOutput } from '@memora/shared';
export declare class EvaluationLoop {
    execute(input: EvaluationInput): Promise<EvaluationOutput>;
    computeMetrics(feedbacks: any[]): {
        precision: number;
        userSatisfaction: number;
    };
}
export default EvaluationLoop;
//# sourceMappingURL=evaluation.d.ts.map