interface TimeControl {
    key: string;
    label: string;
    baseSeconds: number;
    incrementSeconds: number;
}
interface MatchmakingPlayer {
    userId: string;
    username: string;
    elo: number;
    timestamp: number;
    socketId?: string;
    timeControl?: TimeControl;
}
export declare class MatchmakingService {
    addToQueue(player: MatchmakingPlayer): Promise<boolean>;
    removeFromQueue(userId: string): Promise<void>;
    getQueuePosition(userId: string): Promise<number>;
    matchPlayers(): Promise<{
        white: MatchmakingPlayer;
        black: MatchmakingPlayer;
        gameId: string;
    } | null>;
    getQueueLength(): Promise<number>;
    getQueueInfo(): Promise<MatchmakingPlayer[]>;
}
export declare const matchmakingService: MatchmakingService;
export {};
//# sourceMappingURL=matchmaking.service.d.ts.map