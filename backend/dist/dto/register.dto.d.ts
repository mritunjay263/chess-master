import { z } from 'zod';
export declare const registerDto: z.ZodObject<{
    email: z.ZodString;
    username: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    username: string;
    password: string;
}, {
    email: string;
    username: string;
    password: string;
}>;
export type RegisterDto = z.infer<typeof registerDto>;
//# sourceMappingURL=register.dto.d.ts.map