"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.eloService = exports.EloService = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const game_1 = require("../constants/game");
class EloService {
    calculateExpected(playerElo, opponentElo) {
        return 1 / (1 + Math.pow(10, (opponentElo - playerElo) / 400));
    }
    calculateKFactor(elo) { return elo < game_1.GAME_CONFIG.ELO_THRESHOLD ? game_1.GAME_CONFIG.K_FACTOR_LOW : game_1.GAME_CONFIG.K_FACTOR_HIGH; }
    calculateEloChange(playerElo, opponentElo, actual) {
        const expected = this.calculateExpected(playerElo, opponentElo);
        return Math.round(this.calculateKFactor(playerElo) * (actual - expected));
    }
    async updateElo(winnerId, loserId, isDraw, whiteId, blackId, whiteElo, blackElo) {
        let whiteChange = 0, blackChange = 0;
        if (isDraw) {
            whiteChange = this.calculateEloChange(whiteElo, blackElo, 0.5);
            blackChange = this.calculateEloChange(blackElo, whiteElo, 0.5);
        }
        else if (winnerId === whiteId) {
            whiteChange = this.calculateEloChange(whiteElo, blackElo, 1);
            blackChange = this.calculateEloChange(blackElo, whiteElo, 0);
        }
        else if (winnerId === blackId) {
            whiteChange = this.calculateEloChange(whiteElo, blackElo, 0);
            blackChange = this.calculateEloChange(blackElo, whiteElo, 1);
        }
        const newWhiteElo = Math.max(game_1.GAME_CONFIG.MIN_ELO, whiteElo + whiteChange);
        const newBlackElo = Math.max(game_1.GAME_CONFIG.MIN_ELO, blackElo + blackChange);
        await prisma_1.default.user.update({ where: { id: whiteId }, data: { elo: newWhiteElo, wins: winnerId === whiteId ? { increment: 1 } : undefined, losses: loserId === whiteId ? { increment: 1 } : undefined, draws: isDraw ? { increment: 1 } : undefined, gamesPlayed: { increment: 1 } } });
        await prisma_1.default.user.update({ where: { id: blackId }, data: { elo: newBlackElo, wins: winnerId === blackId ? { increment: 1 } : undefined, losses: loserId === blackId ? { increment: 1 } : undefined, draws: isDraw ? { increment: 1 } : undefined, gamesPlayed: { increment: 1 } } });
        return { whiteElo: newWhiteElo, blackElo: newBlackElo, whiteChange, blackChange };
    }
    async getLeaderboard(limit = 50) {
        return prisma_1.default.user.findMany({ orderBy: { elo: 'desc' }, take: limit, select: { id: true, username: true, elo: true, wins: true, losses: true, draws: true, gamesPlayed: true } });
    }
}
exports.EloService = EloService;
exports.eloService = new EloService();
//# sourceMappingURL=elo.service.js.map