import { v4 as uuidv4 } from 'uuid';
import prisma from '../config/prisma';
import { GAME_CONFIG } from '../constants/game';
import { createLogger } from '../utils/logger';
import { validateMove, getInitialFen, isGameOver } from '../utils/chess';
import { notificationService } from './notification.service';

const logger = createLogger('game-service');

// ELO calculation functions
const calculateEloChange = (playerElo: number, opponentElo: number, result: string): number => {
  // Result: 1.0 for win, 0.5 for draw, 0.0 for loss
  let score: number;
  if (result === 'win') score = 1.0;
  else if (result === 'draw') score = 0.5;
  else score = 0.0;

  // Expected score based on ELO difference
  const expectedScore = 1.0 / (1.0 + Math.pow(10.0, (opponentElo - playerElo) / 400.0));

  // K factor based on player's ELO (lower K for higher ELO players)
  const kFactor = playerElo < GAME_CONFIG.ELO_THRESHOLD ? GAME_CONFIG.K_FACTOR_LOW : GAME_CONFIG.K_FACTOR_HIGH;

  // Calculate ELO change
  const eloChange = Math.round(kFactor * (score - expectedScore));

  // Ensure ELO doesn't go below minimum
  const newElo = Math.max(GAME_CONFIG.MIN_ELO, playerElo + eloChange);

  return eloChange;
};

// In-memory stores
const gameSessions = new Map<string, any>();
const clockStore = new Map<string, number>();

export interface GameSession {
  gameId: string; fen: string; turn: 'w' | 'b';
  whitePlayerId: string; blackPlayerId: string;
  whitePlayerUsername: string; blackPlayerUsername: string;
  whiteElo: number; blackElo: number;
  whiteTime: number; blackTime: number;
  moveHistory: any[]; status: string;
}

export class GameService {
  private io: any = null;
  setSocketIO(io: any) { this.io = io; }

  async createGameSession(whitePlayerId: string, blackPlayerId: string, gameId: string, opts?: { whiteUsername?: string; blackUsername?: string; whiteElo?: number; blackElo?: number }): Promise<GameSession> {
    const whiteUser = await prisma.user.findUnique({ where: { id: whitePlayerId } }).catch(() => null);
    const blackUser = await prisma.user.findUnique({ where: { id: blackPlayerId } }).catch(() => null);
    
    const whiteUsername = whiteUser?.username ?? opts?.whiteUsername ?? 'Guest';
    const blackUsername = blackUser?.username ?? opts?.blackUsername ?? 'Guest';
    const whiteElo = whiteUser?.elo ?? opts?.whiteElo ?? 1200;
    const blackElo = blackUser?.elo ?? opts?.blackElo ?? 1200;
    
    const session: GameSession = {
      gameId, fen: getInitialFen(), turn: 'w', whitePlayerId, blackPlayerId,
      whitePlayerUsername: whiteUsername, blackPlayerUsername: blackUsername,
      whiteElo, blackElo,
      whiteTime: GAME_CONFIG.INITIAL_TIME, blackTime: GAME_CONFIG.INITIAL_TIME,
      moveHistory: [], status: 'in_progress',
    };
    gameSessions.set(gameId, session);
    clockStore.set(`clock:${gameId}:${whitePlayerId}`, GAME_CONFIG.INITIAL_TIME);
    clockStore.set(`clock:${gameId}:${blackPlayerId}`, GAME_CONFIG.INITIAL_TIME);
    
    try {
      await prisma.game.create({ data: { 
        id: gameId, 
        whitePlayerId, 
        blackPlayerId, 
        fen: getInitialFen(), 
        status: 'IN_PROGRESS', 
        whiteTime: GAME_CONFIG.INITIAL_TIME, 
        blackTime: GAME_CONFIG.INITIAL_TIME, 
        moves: '[]' 
      } });
    } catch (e) {
      logger.error('Failed to create game in DB (non-fatal for guests)', { error: (e as Error).message });
    }
    
    return session;
  }

  async getGameSession(gameId: string): Promise<GameSession | null> {
    return gameSessions.get(gameId) || null;
  }

  async makeMove(gameId: string, userId: string, from: string, to: string, promotion?: string) {
    const session = await this.getGameSession(gameId);
    if (!session) return { success: false, session: null as any, error: 'Game not found' };
    if (session.status !== 'in_progress') return { success: false, session, error: 'Game not in progress' };
    const isWhitePlayer = userId === session.whitePlayerId;
    if (!isWhitePlayer && userId !== session.blackPlayerId) return { success: false, session, error: 'Not a player' };
    const expectedTurn = isWhitePlayer ? 'w' : 'b';
    if (session.turn !== expectedTurn) return { success: false, session, error: 'Not your turn' };
    const moveResult = validateMove(session.fen, from, to, promotion);
    if (!moveResult.valid) return { success: false, session, error: 'Invalid move' };
    
    const moveRecord = { from, to, san: moveResult.san || '', fen: moveResult.fen || session.fen, timestamp: Date.now(), promotion };
    const updatedSession: GameSession = { ...session, fen: moveResult.fen!, turn: session.turn === 'w' ? 'b' : 'w', moveHistory: [...session.moveHistory, moveRecord] };
    const gameOver = isGameOver(moveResult.fen!);
    if (gameOver.over) {
      if (gameOver.result === 'checkmate') {
        // The player who just moved delivered checkmate
        updatedSession.status = isWhitePlayer ? 'white_wins' : 'black_wins';
      } else if (gameOver.result === 'stalemate') {
        updatedSession.status = 'stalemate';
      } else {
        updatedSession.status = 'draw';
      }
    }

    gameSessions.set(gameId, updatedSession);
    this.io?.to(gameId).emit('game_state', {
      gameId,
      fen: updatedSession.fen,
      turn: updatedSession.turn,
      whiteTime: updatedSession.whiteTime,
      blackTime: updatedSession.blackTime,
      moveHistory: updatedSession.moveHistory,
      status: updatedSession.status,
      lastMove: {
        from,
        to,
        promotion,
        captured: moveResult.captured,
        check: moveResult.check
      }
    });

    if (gameOver.over) await this.handleGameEnd(gameId, updatedSession);
    return { success: true, session: updatedSession };
  }

  async handleGameEnd(gameId: string, session: GameSession) {
    // Determine winner and reason based on session status
    let winner: 'white' | 'black' | 'draw' = 'draw';
    let reason: string = 'game_over';

    if (session.status === 'white_wins') {
      winner = 'white';
      reason = 'checkmate';
    } else if (session.status === 'black_wins') {
      winner = 'black';
      reason = 'checkmate';
    } else if (session.status === 'stalemate') {
      winner = 'draw';
      reason = 'stalemate';
    } else if (session.status === 'draw') {
      winner = 'draw';
      reason = 'draw'; // This could be insufficient material, fifty-move rule, etc.
    } else if (session.status === 'white_resigned') {
      winner = 'black';
      reason = 'resignation';
    } else if (session.status === 'black_resigned') {
      winner = 'white';
      reason = 'resignation';
    }

    // Calculate ELO changes
    const isWhiteWinner = winner === 'white';
    const isBlackWinner = winner === 'black';
    const isDraw = winner === 'draw';

    const whiteEloChange = isWhiteWinner
      ? calculateEloChange(session.whiteElo, session.blackElo, 'win')
      : isBlackWinner
        ? calculateEloChange(session.whiteElo, session.blackElo, 'loss')
        : calculateEloChange(session.whiteElo, session.blackElo, 'draw');

    const blackEloChange = isBlackWinner
      ? calculateEloChange(session.blackElo, session.whiteElo, 'win')
      : isWhiteWinner
        ? calculateEloChange(session.blackElo, session.whiteElo, 'loss')
        : calculateEloChange(session.blackElo, session.whiteElo, 'draw');

    // Emit game over event with proper data
    this.io?.to(gameId).emit('game_over', {
      gameId,
      winner,
      reason,
      whiteEloChange,
      blackEloChange,
      fen: session.fen
    });

    // Update database
    try {
      let dbStatus: string;
      if (session.status === 'white_wins') dbStatus = 'WHITE_WINS';
      else if (session.status === 'black_wins') dbStatus = 'BLACK_WINS';
      else if (session.status === 'stalemate') dbStatus = 'STALEMATE';
      else if (session.status === 'white_resigned' || session.status === 'black_resigned') dbStatus = 'RESIGNED';
      else dbStatus = 'DRAW';

      // Update white player stats
      const whiteUpdate: any = {
        gamesPlayed: { increment: 1 },
        elo: Math.max(GAME_CONFIG.MIN_ELO, session.whiteElo + whiteEloChange),
      };
      if (isWhiteWinner) whiteUpdate.wins = { increment: 1 };
      else if (isBlackWinner) whiteUpdate.losses = { increment: 1 };
      else whiteUpdate.draws = { increment: 1 };

      await prisma.user.update({
        where: { id: session.whitePlayerId },
        data: whiteUpdate,
      });

      // Update black player stats
      const blackUpdate: any = {
        gamesPlayed: { increment: 1 },
        elo: Math.max(GAME_CONFIG.MIN_ELO, session.blackElo + blackEloChange),
      };
      if (isBlackWinner) blackUpdate.wins = { increment: 1 };
      else if (isWhiteWinner) blackUpdate.losses = { increment: 1 };
      else blackUpdate.draws = { increment: 1 };

      await prisma.user.update({
        where: { id: session.blackPlayerId },
        data: blackUpdate,
      });

      // Update game record (Prisma Game model does not store player ELOs)
      await prisma.game.update({ where: { id: gameId }, data: {
        status: dbStatus,
        winner: winner === 'white' ? session.whitePlayerId : winner === 'black' ? session.blackPlayerId : null,
        reason,
        completedAt: new Date(),
        pgn: '' // We could populate this with actual PGN if needed
      } });
    } catch (e) { logger.error('Failed to update game', { error: (e as Error).message }); }
  }

  async resign(gameId: string, userId: string) {
    const session = await this.getGameSession(gameId);
    if (!session || session.status !== 'in_progress') return { success: false, error: 'Game not found' };
    const isWhite = userId === session.whitePlayerId;
    if (userId !== session.whitePlayerId && userId !== session.blackPlayerId) return { success: false, error: 'Not a player' };
    const updatedSession: GameSession = { ...session, status: isWhite ? 'white_resigned' : 'black_resigned' };
    gameSessions.set(gameId, updatedSession);
    await this.handleGameEnd(gameId, updatedSession);
    return { success: true };
  }

  async getGameHistory(userId: string, limit = 20, offset = 0) {
    const games = await prisma.game.findMany({ where: { OR: [{ whitePlayerId: userId }, { blackPlayerId: userId }], status: { not: 'IN_PROGRESS' } }, orderBy: { completedAt: 'desc' }, take: limit, skip: offset, include: { whitePlayer: true, blackPlayer: true } });
    return games.map((g: any) => ({ id: g.id, opponent: userId === g.whitePlayerId ? g.blackPlayer : g.whitePlayer, isWhite: userId === g.whitePlayerId, result: g.winner === userId ? 'win' : g.winner ? 'loss' : 'draw', eloChange: 0, completedAt: g.completedAt }));
  }

  async getActiveGame(userId: string): Promise<GameSession | null> {
    for (const [gameId, session] of gameSessions) {
      if (session.status === 'in_progress' && (session.whitePlayerId === userId || session.blackPlayerId === userId)) {
        return session;
      }
    }
    return null;
  }
}
export const gameService = new GameService();