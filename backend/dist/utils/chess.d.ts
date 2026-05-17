export interface ChessMoveResult {
    valid: boolean;
    fen?: string;
    pgn?: string;
    san?: string;
    captured?: boolean;
    check?: boolean;
    checkmate?: boolean;
    stalemate?: boolean;
    draw?: boolean;
}
export declare const validateMove: (fen: string, from: string, to: string, promotion?: string) => ChessMoveResult;
export declare const getLegalMoves: (fen: string, square: string) => string[];
export declare const isGameOver: (fen: string) => {
    over: boolean;
    result?: string;
};
export declare const getInitialFen: () => string;
//# sourceMappingURL=chess.d.ts.map