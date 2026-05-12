"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.matchmakingService = exports.MatchmakingService = void 0;
const logger_1 = require("../utils/logger");
const uuid_1 = require("uuid");
const logger = (0, logger_1.createLogger)('matchmaking-service');
// In-memory queue
let matchmakingQueue = [];
class MatchmakingService {
    async addToQueue(player) {
        const inQueue = matchmakingQueue.some(p => p.userId === player.userId);
        if (inQueue)
            return false;
        matchmakingQueue.push(player);
        logger.info('Player added to queue', { userId: player.userId, queueLength: matchmakingQueue.length });
        return true;
    }
    async removeFromQueue(userId) {
        matchmakingQueue = matchmakingQueue.filter(p => p.userId !== userId);
        logger.info('Player removed from queue', { userId });
    }
    async getQueuePosition(userId) {
        const index = matchmakingQueue.findIndex(p => p.userId === userId);
        return index === -1 ? -1 : matchmakingQueue.length - index;
    }
    async matchPlayers() {
        if (matchmakingQueue.length < 2)
            return null;
        const player1 = matchmakingQueue.shift();
        const player2 = matchmakingQueue.shift();
        const gameId = (0, uuid_1.v4)();
        const isWhiteRandom = Math.random() > 0.5;
        const white = isWhiteRandom ? player1 : player2;
        const black = isWhiteRandom ? player2 : player1;
        logger.info('Players matched', { gameId, white: white.userId, black: black.userId });
        return { white, black, gameId };
    }
    async getQueueLength() { return matchmakingQueue.length; }
    async getQueueInfo() { return [...matchmakingQueue]; }
}
exports.MatchmakingService = MatchmakingService;
exports.matchmakingService = new MatchmakingService();
//# sourceMappingURL=matchmaking.service.js.map