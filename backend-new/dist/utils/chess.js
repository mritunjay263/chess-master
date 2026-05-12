"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getInitialFen = exports.isGameOver = exports.getLegalMoves = exports.validateMove = void 0;
const chess_js_1 = require("chess.js");
const validateMove = (fen, from, to, promotion) => {
    const chess = new chess_js_1.Chess(fen);
    const move = { from: from, to: to, promotion };
    try {
        const result = chess.move(move);
        if (!result)
            return { valid: false };
        return {
            valid: true, fen: chess.fen(), pgn: chess.pgn(), san: result.san,
            captured: result.captured !== undefined, check: chess.inCheck(),
            checkmate: chess.isCheckmate(), stalemate: chess.isStalemate(), draw: chess.isDraw(),
        };
    }
    catch {
        return { valid: false };
    }
};
exports.validateMove = validateMove;
const getLegalMoves = (fen, square) => {
    const chess = new chess_js_1.Chess(fen);
    return chess.moves({ square: square, verbose: true }).map((m) => m.to);
};
exports.getLegalMoves = getLegalMoves;
const isGameOver = (fen) => {
    const chess = new chess_js_1.Chess(fen);
    if (!chess.isGameOver())
        return { over: false };
    if (chess.isCheckmate())
        return { over: true, result: 'checkmate' };
    if (chess.isStalemate())
        return { over: true, result: 'stalemate' };
    if (chess.isDraw())
        return { over: true, result: 'draw' };
    return { over: true, result: 'game_over' };
};
exports.isGameOver = isGameOver;
const getInitialFen = () => 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
exports.getInitialFen = getInitialFen;
//# sourceMappingURL=chess.js.map