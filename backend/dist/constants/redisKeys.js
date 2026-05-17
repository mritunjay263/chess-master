"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.REDIS_KEYS = void 0;
exports.REDIS_KEYS = {
    MATCHMAKING_QUEUE: 'matchmaking:queue',
    GAME_SESSION: (gameId) => `game:${gameId}`,
    PLAYER_CLOCK: (gameId, userId) => `clock:${gameId}:${userId}`,
    PLAYER_PRESENCE: (userId) => `presence:${userId}`,
    USER_SOCKET: (userId) => `user_socket:${userId}`,
};
//# sourceMappingURL=redisKeys.js.map