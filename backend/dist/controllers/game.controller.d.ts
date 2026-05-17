import { Request, Response } from 'express';
export declare const gameController: {
    test(req: Request, res: Response): Promise<void>;
    joinQueue(req: Request, res: Response): Promise<void>;
    leaveQueue(req: Request, res: Response): Promise<void>;
    getQueueStatus(req: Request, res: Response): Promise<void>;
    getGame(req: Request, res: Response): Promise<void>;
    makeMove(req: Request, res: Response): Promise<void>;
    resign(req: Request, res: Response): Promise<void>;
    getHistory(req: Request, res: Response): Promise<void>;
    getActiveGame(req: Request, res: Response): Promise<void>;
    getQueueDebug(req: Request, res: Response): Promise<void>;
};
//# sourceMappingURL=game.controller.d.ts.map