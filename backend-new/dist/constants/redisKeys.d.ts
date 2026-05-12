export declare const REDIS_KEYS: {
    MATCHMAKING_QUEUE: string;
    GAME_SESSION: (gameId: string) => string;
    PLAYER_CLOCK: (gameId: string, userId: string) => string;
    PLAYER_PRESENCE: (userId: string) => string;
    USER_SOCKET: (userId: string) => string;
};
//# sourceMappingURL=redisKeys.d.ts.map