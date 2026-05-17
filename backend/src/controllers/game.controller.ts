import { Request, Response } from 'express';
import { gameService } from '../services/game.service';
import { matchmakingService } from '../services/matchmaking.service';
import { createLogger } from '../utils/logger';

const logger = createLogger('game-controller');

export const gameController = {
  async test(req: Request, res: Response) {
    try {
      logger.info('Test endpoint hit', { method: req.method, body: req.body });
      res.json({ success: true, message: 'Backend is reachable', timestamp: new Date().toISOString() });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  },
  async joinQueue(req: Request, res: Response) {
    try { 
      const userId = (req as any).user!.userId;
      const { username, elo } = req.body;
      logger.info('joinQueue request', { userId, username, elo, bodyKeys: Object.keys(req.body) });
      
      if (!username || elo === undefined) {
        logger.warn('joinQueue missing username or elo', { userId, username, elo });
        res.status(400).json({ error: 'Missing username or elo in request body' }); 
        return;
      }
      
      // Auto-remove the player first to ensure a clean state
      await matchmakingService.removeFromQueue(userId);
      logger.info('joinQueue cleaned up existing queue entry', { userId });
      
      const added = await matchmakingService.addToQueue({ userId, username, elo, timestamp: Date.now() }); 
      if (!added) { 
        logger.info('joinQueue rejected - could not add', { userId }); 
        res.status(400).json({ error: 'Failed to join queue' }); 
        return; 
      } 
      const position = await matchmakingService.getQueuePosition(userId); 
      logger.info('joinQueue success', { userId, position });
      res.json({ message: 'Joined queue', position }); 
    }
    catch (error) { 
      logger.error('joinQueue error', { error: (error as Error).message, stack: (error as Error).stack }); 
      res.status(500).json({ error: (error as Error).message }); 
    }
  },
  async leaveQueue(req: Request, res: Response) { 
    try { 
      const userId = (req as any).user!.userId;
      await matchmakingService.removeFromQueue(userId); 
      res.json({ message: 'Left queue' }); 
    } catch (error) { res.status(500).json({ error: (error as Error).message }); } 
  },
  async getQueueStatus(req: Request, res: Response) { 
    try { 
      const queueLength = await matchmakingService.getQueueLength(); 
      const position = req.query.userId ? await matchmakingService.getQueuePosition(req.query.userId as string) : -1; 
      res.json({ queueLength, position }); 
    } catch (error) { res.status(500).json({ error: (error as Error).message }); } 
  },
  async getGame(req: Request, res: Response) { 
    try { 
      const session = await gameService.getGameSession(req.params.gameId); 
      if (!session) { res.status(404).json({ error: 'Game not found' }); return; } 
      res.json(session); 
    } catch (error) { res.status(500).json({ error: (error as Error).message }); } 
  },
  async makeMove(req: Request, res: Response) { 
    try { 
      const result = await gameService.makeMove(req.params.gameId, (req as any).user!.userId, req.body.from, req.body.to, req.body.promotion); 
      if (!result.success) { res.status(400).json({ error: result.error }); return; } 
      res.json(result.session); 
    } catch (error) { res.status(500).json({ error: (error as Error).message }); } 
  },
  async resign(req: Request, res: Response) { 
    try { 
      const result = await gameService.resign(req.params.gameId, (req as any).user!.userId); 
      if (!result.success) { res.status(400).json({ error: result.error }); return; } 
      res.json({ success: true }); 
    } catch (error) { res.status(500).json({ error: (error as Error).message }); } 
  },
  async getHistory(req: Request, res: Response) { 
    try { 
      const history = await gameService.getGameHistory((req as any).user!.userId, parseInt(req.query.limit as string) || 20, parseInt(req.query.offset as string) || 0); 
      res.json(history); 
    } catch (error) { res.status(500).json({ error: (error as Error).message }); } 
  },
  async getActiveGame(req: Request, res: Response) { 
    try { 
      const session = await gameService.getActiveGame((req as any).user!.userId); 
      if (!session) { res.status(404).json({ error: 'No active game' }); return; } 
      res.json(session); 
    } catch (error) { res.status(500).json({ error: (error as Error).message }); } 
  },
  async getQueueDebug(req: Request, res: Response) {
    try {
      const queueInfo = await matchmakingService.getQueueInfo();
      const queueLength = await matchmakingService.getQueueLength();
      logger.info('getQueueDebug called', { queueLength, playerCount: queueInfo.length });
      res.json({ queueLength, players: queueInfo.map(p => ({ userId: p.userId, username: p.username, elo: p.elo })) });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  },
};