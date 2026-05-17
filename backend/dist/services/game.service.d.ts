export interface GameSession {
    gameId: string;
    fen: string;
    turn: 'w' | 'b';
    whitePlayerId: string;
    blackPlayerId: string;
    whitePlayerUsername: string;
    blackPlayerUsername: string;
    whiteElo: number;
    blackElo: number;
    whiteTime: number;
    blackTime: number;
    moveHistory: any[];
    status: string;
}
export declare class GameService {
    private io;
    setSocketIO(io: any): void;
    createGameSession(whitePlayerId: string, blackPlayerId: string, gameId: string, opts?: {
        whiteUsername?: string;
        blackUsername?: string;
        whiteElo?: number;
        blackElo?: number;
    }): Promise<GameSession>;
    getGameSession(gameId: string): Promise<GameSession | null>;
    makeMove(gameId: string, userId: string, from: string, to: string, promotion?: string): Promise<{
        success: boolean;
        session: any;
        error: string;
    } | {
        success: boolean;
        session: GameSession;
        error?: undefined;
    }>;
    handleGameEnd(gameId: string, session: GameSession, overrideReason?: string): Promise<void>;
    resign(gameId: string, userId: string): Promise<{
        success: boolean;
        error: string;
    } | {
        success: boolean;
        error?: undefined;
    }>;
    handleTimeout(gameId: string, flaggedColor: 'w' | 'b'): Promise<void>;
    acceptDraw(gameId: string): Promise<void>;
    getGameHistory(userId: string, limit?: number, offset?: number): Promise<{
        id: any;
        opponent: any;
        isWhite: boolean;
        result: string;
        eloChange: number;
        completedAt: any;
    }[]>;
    getActiveGame(userId: string): Promise<GameSession | null>;
}
export declare const gameService: GameService;
//# sourceMappingURL=game.service.d.ts.map