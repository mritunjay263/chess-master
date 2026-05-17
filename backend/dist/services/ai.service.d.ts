declare class AIService {
    /**
     * Get the best move for the current position
     * Uses simple minimax with alpha-beta pruning
     */
    getBestMove(fen: string, depth?: number, skillLevel?: number): Promise<{
        from: string;
        to: string;
        evaluation: number;
    } | null>;
    /**
     * Get multiple move suggestions with evaluations
     */
    getMoveSuggestions(fen: string, count?: number): Promise<Array<{
        from: string;
        to: string;
        evaluation: number;
        variation: string;
    }>>;
    private generateAllMoves;
    private minimax;
    private evaluateBoard;
    private getSANVariation;
}
export declare const aiService: AIService;
export {};
//# sourceMappingURL=ai.service.d.ts.map