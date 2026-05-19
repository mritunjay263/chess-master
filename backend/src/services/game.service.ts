import { v4 as uuidv4 } from 'uuid';
import prisma from '../config/prisma';
import { GAME_CONFIG } from '../constants/game';
import { createLogger } from '../utils/logger';
import { validateMove, getInitialFen, isGameOver } from '../utils/chess';

const logger = createLogger('game-service');

const calcEloChange = (
  playerElo: number,
  opponentElo: number,
  result: 'win' | 'draw' | 'loss',
): number => {
  const score = result === 'win' ? 1 : result === 'draw' ? 0.5 : 0;
  const expected = 1 / (1 + Math.pow(10, (opponentElo - playerElo) / 400));
  const k =
    playerElo < ((GAME_CONFIG as any).ELO_THRESHOLD ?? 2000)
      ? ((GAME_CONFIG as any).K_FACTOR_LOW  ?? 32)
      : ((GAME_CONFIG as any).K_FACTOR_HIGH ?? 16);
  return Math.round(k * (score - expected));
};

const gameSessions = new Map<string, GameSession>();

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
  moveHistory: MoveRecord[];
  status: string;
  _startedAt?: number;
}

interface MoveRecord {
  from: string;
  to: string;
  san: string;
  fen: string;
  flags: string;
  timestamp: number;
  promotion?: string;
  captured?: string;  // FIX: string piece letter, not boolean
}

export class GameService {
  private io: any = null;
  setSocketIO(io: any) { this.io = io; }

  async createGameSession(
    whitePlayerId: string,
    blackPlayerId: string,
    gameId = uuidv4(),
    opts?: {
      whiteUsername?: string;
      blackUsername?: string;
      whiteElo?: number;
      blackElo?: number;
    },
  ): Promise<GameSession> {
    const [wu, bu] = await Promise.all([
      prisma.user.findUnique({ where: { id: whitePlayerId } }).catch(() => null),
      prisma.user.findUnique({ where: { id: blackPlayerId } }).catch(() => null),
    ]);
    const session: GameSession = {
      gameId,
      fen: getInitialFen(),
      turn: 'w',
      whitePlayerId,
      blackPlayerId,
      whitePlayerUsername: wu?.username ?? opts?.whiteUsername ?? 'Guest',
      blackPlayerUsername: bu?.username ?? opts?.blackUsername ?? 'Guest',
      whiteElo: wu?.elo ?? opts?.whiteElo ?? 1200,
      blackElo:  bu?.elo  ?? opts?.blackElo  ?? 1200,
      whiteTime: GAME_CONFIG.INITIAL_TIME,
      blackTime: GAME_CONFIG.INITIAL_TIME,
      moveHistory: [],
      status: 'in_progress',
      _startedAt: Date.now(),
    };
    gameSessions.set(gameId, session);
    try {
      await prisma.game.create({
        data: {
          id: gameId,
          whitePlayerId,
          blackPlayerId,
          fen: getInitialFen(),
          status: 'IN_PROGRESS',
          whiteTime: GAME_CONFIG.INITIAL_TIME,
          blackTime: GAME_CONFIG.INITIAL_TIME,
          moves: '[]',
        },
      });
    } catch (e) {
      logger.warn('DB create game failed (non-fatal for guests)', {
        error: (e as Error).message,
      });
    }
    return session;
  }

  async getGameSession(gameId: string): Promise<GameSession | null> {
    return gameSessions.get(gameId) ?? null;
  }

  async makeMove(
    gameId: string,
    userId: string,
    from: string,
    to: string,
    promotion?: string,
  ): Promise<{ success: boolean; error?: string }> {
    const session = gameSessions.get(gameId);
    if (!session)                        return { success: false, error: 'Game not found' };
    if (session.status !== 'in_progress') return { success: false, error: 'Game not in progress' };

    const isWhite = userId === session.whitePlayerId;
    if (!isWhite && userId !== session.blackPlayerId)
      return { success: false, error: 'Not a player' };

    const expectedTurn: 'w' | 'b' = isWhite ? 'w' : 'b';
    if (session.turn !== expectedTurn)
      return { success: false, error: 'Not your turn' };

    const mv = validateMove(session.fen, from, to, promotion);
    if (!mv.valid) return { success: false, error: 'Invalid move' };

    // Clock deduction
    const now  = Date.now();
    const last =
      session.moveHistory.length > 0
        ? session.moveHistory[session.moveHistory.length - 1].timestamp
        : (session._startedAt ?? now);
    const elapsed = Math.max(0, now - last);
    if (isWhite) session.whiteTime = Math.max(0, session.whiteTime - elapsed);
    else         session.blackTime = Math.max(0, session.blackTime - elapsed);

    if (session.whiteTime <= 0 || session.blackTime <= 0) {
      const lost: 'w' | 'b' = session.whiteTime <= 0 ? 'w' : 'b';
      await this.handleTimeout(gameId, lost);
      return { success: false, error: 'Time expired' };
    }

    // FIX: captured is string|undefined from ChessMoveResult, flags is string
    const record: MoveRecord = {
      from,
      to,
      san:       mv.san   ?? '',
      fen:       mv.fen   ?? session.fen,
      flags:     mv.flags ?? '',
      timestamp: now,
      promotion,
      captured:  mv.captured,   // string piece letter or undefined — types now match
    };

    session.fen  = mv.fen!;
    session.turn = session.turn === 'w' ? 'b' : 'w';
    session.moveHistory.push(record);
    gameSessions.set(gameId, session);

    // Emit move_made with flat shape frontend expects
    const movePayload = {
      from,
      to,
      san:       mv.san,
      flags:     mv.flags ?? '',   // FIX: flags now exists on ChessMoveResult
      piece:     expectedTurn,
      captured:  mv.captured,
      promotion,
    };

    this.io?.to(gameId).emit('move_made',   movePayload);
    this.io?.to(gameId).emit('timer_sync',  {
      white: session.whiteTime,
      black: session.blackTime,
    });

    const over = isGameOver(session.fen);
    if (over.over) {
      session.status =
        over.result === 'checkmate'
          ? (isWhite ? 'white_wins' : 'black_wins')
          : over.result === 'stalemate'
          ? 'stalemate'
          : 'draw';
      gameSessions.set(gameId, session);
      await this.handleGameEnd(gameId, session);
    }

    return { success: true };
  }

  async handleGameEnd(
    gameId: string,
    session: GameSession,
    overrideReason?: string,
  ) {
    let winner: 'w' | 'b' | null = null;
    let reason = overrideReason ?? 'game_over';

    if      (session.status === 'white_wins')      { winner = 'w'; reason = reason === 'game_over' ? 'checkmate'   : reason; }
    else if (session.status === 'black_wins')      { winner = 'b'; reason = reason === 'game_over' ? 'checkmate'   : reason; }
    else if (session.status === 'white_resigned')  { winner = 'b'; reason = 'resignation'; }
    else if (session.status === 'black_resigned')  { winner = 'w'; reason = 'resignation'; }
    else if (session.status === 'stalemate')       { winner = null; reason = 'stalemate'; }
    else if (session.status === 'draw')            { winner = null; reason = overrideReason ?? 'draw'; }

    const wChange = calcEloChange(
      session.whiteElo, session.blackElo,
      winner === 'w' ? 'win' : winner === 'b' ? 'loss' : 'draw',
    );
    const bChange = calcEloChange(
      session.blackElo, session.whiteElo,
      winner === 'b' ? 'win' : winner === 'w' ? 'loss' : 'draw',
    );

    // Emit game_over in shape { result: { winner, reason } } that useSocket.ts expects
    this.io?.to(gameId).emit('game_over', {
      result:        { winner, reason },
      whiteEloChange: wChange,
      blackEloChange: bChange,
    });

    try {
      const dbStatus =
        session.status === 'white_wins'      ? 'WHITE_WINS'
        : session.status === 'black_wins'    ? 'BLACK_WINS'
        : session.status === 'stalemate'     ? 'STALEMATE'
        : (session.status === 'white_resigned' ||
           session.status === 'black_resigned') ? 'RESIGNED'
        : 'DRAW';

      await Promise.all([
        prisma.user.update({
          where: { id: session.whitePlayerId },
          data: {
            gamesPlayed: { increment: 1 },
            elo: Math.max(
              (GAME_CONFIG as any).MIN_ELO ?? 100,
              session.whiteElo + wChange,
            ),
            ...(winner === 'w'
              ? { wins:   { increment: 1 } }
              : winner === 'b'
              ? { losses: { increment: 1 } }
              : { draws:  { increment: 1 } }),
          },
        }).catch(() => {}),
        prisma.user.update({
          where: { id: session.blackPlayerId },
          data: {
            gamesPlayed: { increment: 1 },
            elo: Math.max(
              (GAME_CONFIG as any).MIN_ELO ?? 100,
              session.blackElo + bChange,
            ),
            ...(winner === 'b'
              ? { wins:   { increment: 1 } }
              : winner === 'w'
              ? { losses: { increment: 1 } }
              : { draws:  { increment: 1 } }),
          },
        }).catch(() => {}),
        prisma.game.update({
          where: { id: gameId },
          data: {
            status:      dbStatus,
            winner:      winner === 'w' ? session.whitePlayerId
                       : winner === 'b' ? session.blackPlayerId
                       : null,
            reason,
            completedAt: new Date(),
            pgn:         '',
          },
        }).catch(() => {}),
      ]);
    } catch (e) {
      logger.error('DB game end update failed', { error: (e as Error).message });
    }
  }

  async resign(gameId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    const session = gameSessions.get(gameId);
    if (!session || session.status !== 'in_progress')
      return { success: false, error: 'Game not active' };
    if (userId !== session.whitePlayerId && userId !== session.blackPlayerId)
      return { success: false, error: 'Not a player' };
    session.status =
      userId === session.whitePlayerId ? 'white_resigned' : 'black_resigned';
    gameSessions.set(gameId, session);
    await this.handleGameEnd(gameId, session, 'resignation');
    return { success: true };
  }

  async handleTimeout(gameId: string, flaggedColor: 'w' | 'b') {
    const session = gameSessions.get(gameId);
    if (!session || session.status !== 'in_progress') return;
    session.status = flaggedColor === 'w' ? 'black_wins' : 'white_wins';
    gameSessions.set(gameId, session);
    await this.handleGameEnd(gameId, session, 'timeout');
  }

  async acceptDraw(gameId: string) {
    const session = gameSessions.get(gameId);
    if (!session || session.status !== 'in_progress') return;
    session.status = 'draw';
    gameSessions.set(gameId, session);
    await this.handleGameEnd(gameId, session, 'draw_agreed');
  }

  async getGameHistory(
    userId: string,
    limit  = 20,
    offset = 0,
  ) {
    const games = await prisma.game.findMany({
      where: {
        OR: [{ whitePlayerId: userId }, { blackPlayerId: userId }],
        status: { not: 'IN_PROGRESS' },
      },
      orderBy: { completedAt: 'desc' },
      take:    limit,
      skip:    offset,
      include: { whitePlayer: true, blackPlayer: true },
    });
    return games.map((g: any) => ({
      id: g.id,
      opponent:    userId === g.whitePlayerId ? g.blackPlayer : g.whitePlayer,
      isWhite:     userId === g.whitePlayerId,
      result:      g.winner === userId ? 'win' : g.winner ? 'loss' : 'draw',
      completedAt: g.completedAt,
    }));
  }

  async getActiveGame(userId: string): Promise<GameSession | null> {
    for (const session of gameSessions.values()) {
      if (
        session.status === 'in_progress' &&
        (session.whitePlayerId === userId || session.blackPlayerId === userId)
      ) {
        return session;
      }
    }
    return null;
  }
}

export const gameService = new GameService();
