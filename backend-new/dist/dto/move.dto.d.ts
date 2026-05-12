import { z } from 'zod';
export declare const moveDto: z.ZodObject<{
    gameId: z.ZodString;
    from: z.ZodString;
    to: z.ZodString;
    promotion: z.ZodOptional<z.ZodEnum<["q", "r", "b", "n"]>>;
}, "strip", z.ZodTypeAny, {
    gameId: string;
    from: string;
    to: string;
    promotion?: "n" | "b" | "r" | "q" | undefined;
}, {
    gameId: string;
    from: string;
    to: string;
    promotion?: "n" | "b" | "r" | "q" | undefined;
}>;
export type MoveDto = z.infer<typeof moveDto>;
//# sourceMappingURL=move.dto.d.ts.map