"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GAME_STATUS = exports.GAME_CONFIG = void 0;
exports.GAME_CONFIG = {
    INITIAL_TIME: 600000, INCREMENT: 0, K_FACTOR_LOW: 32, K_FACTOR_HIGH: 16,
    ELO_THRESHOLD: 2100, MIN_ELO: 100,
};
exports.GAME_STATUS = {
    IN_PROGRESS: 'IN_PROGRESS', WHITE_WINS: 'WHITE_WINS', BLACK_WINS: 'BLACK_WINS',
    DRAW: 'DRAW', STALEMATE: 'STALEMATE', CHECKMATE: 'CHECKMATE', TIME_OUT: 'TIME_OUT', RESIGNED: 'RESIGNED',
};
//# sourceMappingURL=game.js.map