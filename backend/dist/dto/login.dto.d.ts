import { z } from 'zod';
export declare const loginDto: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
export type LoginDto = z.infer<typeof loginDto>;
//# sourceMappingURL=login.dto.d.ts.map