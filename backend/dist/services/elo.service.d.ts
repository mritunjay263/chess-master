export declare class EloService {
    calculateExpected(playerElo: number, opponentElo: number): number;
    calculateKFactor(elo: number): number;
    calculateEloChange(playerElo: number, opponentElo: number, actual: number): number;
    updateElo(winnerId: string | null, loserId: string | null, isDraw: boolean, whiteId: string, blackId: string, whiteElo: number, blackElo: number): Promise<{
        whiteElo: number;
        blackElo: number;
        whiteChange: number;
        blackChange: number;
    }>;
    getLeaderboard(limit?: number): Promise<{
        username: string;
        id: string;
        elo: number;
        wins: number;
        losses: number;
        draws: number;
        gamesPlayed: number;
    }[]>;
}
export declare const eloService: EloService;
//# sourceMappingURL=elo.service.d.ts.map