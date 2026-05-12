declare class Logger {
    private context;
    constructor(context: string);
    private log;
    debug(m: string, x?: any): void;
    info(m: string, x?: any): void;
    warn(m: string, x?: any): void;
    error(m: string, x?: any): void;
}
export declare const createLogger: (ctx: string) => Logger;
export {};
//# sourceMappingURL=logger.d.ts.map