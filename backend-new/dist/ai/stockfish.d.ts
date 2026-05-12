type MessageHandler = (msg: string) => void;
/**
 * StockfishEngine: lightweight wrapper around Stockfish running in a Worker
 * or via the `stockfish` npm package. Provides an async `calculate` method
 * that returns the bestmove and streams `info` events.
 */
export declare class StockfishEngine {
    private pathOrFactory?;
    private proc;
    private emitter;
    private started;
    constructor(pathOrFactory?: string | undefined);
    private createProcess;
    private handleMessage;
    on(event: 'line' | 'bestmove' | 'info' | 'uciok' | 'readyok', handler: MessageHandler): void;
    off(event: string, handler?: MessageHandler): void;
    start(): void;
    stop(): void;
    send(cmd: string): void;
    calculate(fen: string, depth?: number, movetime?: number, options?: {
        ponder?: boolean;
    }): Promise<{
        bestmove: string;
        info: string[];
    }>;
    setOption(name: string, value: string | number | boolean): void;
}
export default StockfishEngine;
//# sourceMappingURL=stockfish.d.ts.map