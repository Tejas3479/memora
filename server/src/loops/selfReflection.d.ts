import { SelfReflectionInput, SelfReflectionOutput } from '@memora/shared';
export declare class SelfReflectionLoop {
    private ai;
    constructor();
    execute(input: SelfReflectionInput): Promise<SelfReflectionOutput>;
    shouldRun(userId: string, lastRun?: Date): boolean;
}
export default SelfReflectionLoop;
//# sourceMappingURL=selfReflection.d.ts.map