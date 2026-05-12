"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clockService = exports.ClockService = void 0;
const game_1 = require("../constants/game");
const clockStore = new Map();
class ClockService {
    async initializeClock(gameId, userId) {
        clockStore.set(`clock:${gameId}:${userId}`, game_1.GAME_CONFIG.INITIAL_TIME);
    }
    async getTime(gameId, userId) {
        return clockStore.get(`clock:${gameId}:${userId}`) || game_1.GAME_CONFIG.INITIAL_TIME;
    }
    async updateClock(gameId, userId, newTime) {
        clockStore.set(`clock:${gameId}:${userId}`, newTime);
    }
    async deleteClock(gameId, userId) {
        clockStore.delete(`clock:${gameId}:${userId}`);
    }
}
exports.ClockService = ClockService;
exports.clockService = new ClockService();
//# sourceMappingURL=clock.service.js.map