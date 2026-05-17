export declare class ClockService {
    initializeClock(gameId: string, userId: string): Promise<void>;
    getTime(gameId: string, userId: string): Promise<number>;
    updateClock(gameId: string, userId: string, newTime: number): Promise<void>;
    deleteClock(gameId: string, userId: string): Promise<void>;
}
export declare const clockService: ClockService;
//# sourceMappingURL=clock.service.d.ts.map