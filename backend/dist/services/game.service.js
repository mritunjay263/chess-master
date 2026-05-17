"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.gameService = exports.GameService = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const game_1 = require("../constants/game");
const logger_1 = require("../utils/logger");
const chess_1 = require("../utils/chess");
const logger = (0, logger_1.createLogger)('game-service');
// ELO calculation functions
const calculateEloChange = (playerElo, opponentElo, result) => {
    // Result: 1.0 for win, 0.5 for draw, 0.0 for loss
    let score;
    if (result === 'win')
        score = 1.0;
    else if (result === 'draw')
        score = 0.5;
    else
        score = 0.0;
    // Expected score based on ELO difference
    const expectedScore = 1.0 / (1.0 + Math.pow(10.0, (opponentElo - playerElo) / 400.0));
    // K factor based on player's ELO (lower K for higher ELO players)
    const kFactor = playerElo < game_1.GAME_CONFIG.ELO_THRESHOLD ? game_1.GAME_CONFIG.K_FACTOR_LOW : game_1.GAME_CONFIG.K_FACTOR_HIGH;
    // Calculate ELO change
    const eloChange = Math.round(kFactor * (score - expectedScore));
    // Ensure ELO doesn't go below minimum
    const newElo = Math.max(game_1.GAME_CONFIG.MIN_ELO, playerElo + eloChange);
    return eloChange;
};
// In-memory stores
const gameSessions = new Map();
const clockStore = new Map();
class GameService {
    io = null;
    setSocketIO(io) { this.io = io; }
    async createGameSession(whitePlayerId, blackPlayerId, gameId, opts) {
        const whiteUser = await prisma_1.default.user.findUnique({ where: { id: whitePlayerId } }).catch(() => null);
        const blackUser = await prisma_1.default.user.findUnique({ where: { id: blackPlayerId } }).catch(() => null);
        const whiteUsername = whiteUser?.username ?? opts?.whiteUsername ?? 'Guest';
        const blackUsername = blackUser?.username ?? opts?.blackUsername ?? 'Guest';
        const whiteElo = whiteUser?.elo ?? opts?.whiteElo ?? 1200;
        const blackElo = blackUser?.elo ?? opts?.blackElo ?? 1200;
        const session = {
            gameId, fen: (0, chess_1.getInitialFen)(), turn: 'w', whitePlayerId, blackPlayerId,
            whitePlayerUsername: whiteUsername, blackPlayerUsername: blackUsername,
            whiteElo, blackElo,
            whiteTime: game_1.GAME_CONFIG.INITIAL_TIME, blackTime: game_1.GAME_CONFIG.INITIAL_TIME,
            moveHistory: [], status: 'in_progress',
        };
        session._startedAt = Date.now();
        gameSessions.set(gameId, session);
        clockStore.set(`clock:${gameId}:${whitePlayerId}`, game_1.GAME_CONFIG.INITIAL_TIME);
        clockStore.set(`clock:${gameId}:${blackPlayerId}`, game_1.GAME_CONFIG.INITIAL_TIME);
        try {
            await prisma_1.default.game.create({ data: {
                    id: gameId,
                    whitePlayerId,
                    blackPlayerId,
                    fen: (0, chess_1.getInitialFen)(),
                    status: 'IN_PROGRESS',
                    whiteTime: game_1.GAME_CONFIG.INITIAL_TIME,
                    blackTime: game_1.GAME_CONFIG.INITIAL_TIME,
                    moves: '[]'
                } });
        }
        catch (e) {
            logger.error('Failed to create game in DB (non-fatal for guests)', { error: e.message });
        }
        return session;
    }
    async getGameSession(gameId) {
        return gameSessions.get(gameId) || null;
    }
    async makeMove(gameId, userId, from, to, promotion) {
        const session = await this.getGameSession(gameId);
        if (!session)
            return { success: false, session: null, error: 'Game not found' };
        if (session.status !== 'in_progress')
            return { success: false, session, error: 'Game not in progress' };
        const isWhitePlayer = userId === session.whitePlayerId;
        if (!isWhitePlayer && userId !== session.blackPlayerId)
            return { success: false, session, error: 'Not a player' };
        const expectedTurn = isWhitePlayer ? 'w' : 'b';
        if (session.turn !== expectedTurn)
            return { success: false, session, error: 'Not your turn' };
        const moveResult = (0, chess_1.validateMove)(session.fen, from, to, promotion);
        if (!moveResult.valid)
            return { success: false, session, error: 'Invalid move' };
        // --- Clock management: decrement moving player's time ---
        const now = Date.now();
        const lastMoveTs = session.moveHistory.length > 0
            ? session.moveHistory[session.moveHistory.length - 1].timestamp
            : session._startedAt ?? now;
        const elapsed = Math.max(0, now - lastMoveTs);
        if (isWhitePlayer) {
            session.whiteTime = Math.max(0, session.whiteTime - elapsed);
        }
        else {
            session.blackTime = Math.max(0, session.blackTime - elapsed);
        }
        // Check for timeout
        if (session.whiteTime <= 0 || session.blackTime <= 0) {
            const timedOutColor = session.whiteTime <= 0 ? 'w' : 'b';
            const updatedSession = {
                ...session,
                status: timedOutColor === 'w' ? 'black_wins' : 'white_wins',
            };
            gameSessions.set(gameId, updatedSession);
            await this.handleGameEnd(gameId, updatedSession, 'timeout');
            return { success: false, session: updatedSession, error: 'Time expired' };
        }
        const moveRecord = { from, to, san: moveResult.san || '', fen: moveResult.fen || session.fen, timestamp: now, promotion, captured: moveResult.captured, check: moveResult.check, piece: expectedTurn === 'w' ? undefined : undefined };
        const updatedSession = { ...session, fen: moveResult.fen, turn: session.turn === 'w' ? 'b' : 'w', moveHistory: [...session.moveHistory, moveRecord] };
        const gameOver = (0, chess_1.isGameOver)(moveResult.fen);
        if (gameOver.over) {
            if (gameOver.result === 'checkmate') {
                updatedSession.status = isWhitePlayer ? 'white_wins' : 'black_wins';
            }
            else if (gameOver.result === 'stalemate') {
                updatedSession.status = 'stalemate';
            }
            else {
                updatedSession.status = 'draw';
            }
        }
        gameSessions.set(gameId, updatedSession);
        // Emit move_made in the format the mobile client expects
        const movePayload = {
            from,
            to,
            promotion,
            san: moveResult.san,
            captured: moveResult.captured ? true : undefined,
            color: expectedTurn,
            piece: undefined,
        };
        this.io?.to(gameId).emit('move_made', {
            matchId: gameId,
            move: movePayload,
            fen: updatedSession.fen,
            turn: updatedSession.turn,
            times: {
                whiteMs: updatedSession.whiteTime,
                blackMs: updatedSession.blackTime,
                serverTimestamp: now,
            },
        });
        if (gameOver.over)
            await this.handleGameEnd(gameId, updatedSession);
        return { success: true, session: updatedSession };
    }
    async handleGameEnd(gameId, session, overrideReason) {
        // Determine winner and reason based on session status
        let winnerColor = null;
        let reason = overrideReason || 'game_over';
        if (session.status === 'white_wins') {
            winnerColor = 'w';
            if (!overrideReason)
                reason = 'checkmate';
        }
        else if (session.status === 'black_wins') {
            winnerColor = 'b';
            if (!overrideReason)
                reason = 'checkmate';
        }
        else if (session.status === 'stalemate') {
            winnerColor = null;
            reason = 'stalemate';
        }
        else if (session.status === 'draw') {
            winnerColor = null;
            reason = overrideReason || 'draw';
        }
        else if (session.status === 'white_resigned') {
            winnerColor = 'b';
            reason = 'resignation';
        }
        else if (session.status === 'black_resigned') {
            winnerColor = 'w';
            reason = 'resignation';
        }
        // Calculate ELO changes
        const isWhiteWinner = winnerColor === 'w';
        const isBlackWinner = winnerColor === 'b';
        const isDraw = winnerColor === null;
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
        // Emit game over event — use matchId and 'w'/'b' format for mobile client
        this.io?.to(gameId).emit('game_over', {
            matchId: gameId,
            winner: winnerColor,
            reason,
            whiteEloChange,
            blackEloChange,
            fen: session.fen,
        });
        // Update database
        try {
            let dbStatus;
            if (session.status === 'white_wins')
                dbStatus = 'WHITE_WINS';
            else if (session.status === 'black_wins')
                dbStatus = 'BLACK_WINS';
            else if (session.status === 'stalemate')
                dbStatus = 'STALEMATE';
            else if (session.status === 'white_resigned' || session.status === 'black_resigned')
                dbStatus = 'RESIGNED';
            else
                dbStatus = 'DRAW';
            // Update white player stats
            const whiteUpdate = {
                gamesPlayed: { increment: 1 },
                elo: Math.max(game_1.GAME_CONFIG.MIN_ELO, session.whiteElo + whiteEloChange),
            };
            if (isWhiteWinner)
                whiteUpdate.wins = { increment: 1 };
            else if (isBlackWinner)
                whiteUpdate.losses = { increment: 1 };
            else
                whiteUpdate.draws = { increment: 1 };
            await prisma_1.default.user.update({
                where: { id: session.whitePlayerId },
                data: whiteUpdate,
            });
            // Update black player stats
            const blackUpdate = {
                gamesPlayed: { increment: 1 },
                elo: Math.max(game_1.GAME_CONFIG.MIN_ELO, session.blackElo + blackEloChange),
            };
            if (isBlackWinner)
                blackUpdate.wins = { increment: 1 };
            else if (isWhiteWinner)
                blackUpdate.losses = { increment: 1 };
            else
                blackUpdate.draws = { increment: 1 };
            await prisma_1.default.user.update({
                where: { id: session.blackPlayerId },
                data: blackUpdate,
            });
            // Update game record (Prisma Game model does not store player ELOs)
            await prisma_1.default.game.update({ where: { id: gameId }, data: {
                    status: dbStatus,
                    winner: winnerColor === 'w' ? session.whitePlayerId : winnerColor === 'b' ? session.blackPlayerId : null,
                    reason,
                    completedAt: new Date(),
                    pgn: '' // We could populate this with actual PGN if needed
                } });
        }
        catch (e) {
            logger.error('Failed to update game', { error: e.message });
        }
    }
    async resign(gameId, userId) {
        const session = await this.getGameSession(gameId);
        if (!session || session.status !== 'in_progress')
            return { success: false, error: 'Game not found' };
        const isWhite = userId === session.whitePlayerId;
        if (userId !== session.whitePlayerId && userId !== session.blackPlayerId)
            return { success: false, error: 'Not a player' };
        const updatedSession = { ...session, status: isWhite ? 'white_resigned' : 'black_resigned' };
        gameSessions.set(gameId, updatedSession);
        await this.handleGameEnd(gameId, updatedSession, 'resignation');
        return { success: true };
    }
    async handleTimeout(gameId, flaggedColor) {
        const session = await this.getGameSession(gameId);
        if (!session || session.status !== 'in_progress')
            return;
        // The flagged color loses
        const updatedSession = {
            ...session,
            status: flaggedColor === 'w' ? 'black_wins' : 'white_wins',
        };
        gameSessions.set(gameId, updatedSession);
        await this.handleGameEnd(gameId, updatedSession, 'timeout');
    }
    async acceptDraw(gameId) {
        const session = await this.getGameSession(gameId);
        if (!session || session.status !== 'in_progress')
            return;
        const updatedSession = { ...session, status: 'draw' };
        gameSessions.set(gameId, updatedSession);
        await this.handleGameEnd(gameId, updatedSession, 'draw_agreed');
    }
    async getGameHistory(userId, limit = 20, offset = 0) {
        const games = await prisma_1.default.game.findMany({ where: { OR: [{ whitePlayerId: userId }, { blackPlayerId: userId }], status: { not: 'IN_PROGRESS' } }, orderBy: { completedAt: 'desc' }, take: limit, skip: offset, include: { whitePlayer: true, blackPlayer: true } });
        return games.map((g) => ({ id: g.id, opponent: userId === g.whitePlayerId ? g.blackPlayer : g.whitePlayer, isWhite: userId === g.whitePlayerId, result: g.winner === userId ? 'win' : g.winner ? 'loss' : 'draw', eloChange: 0, completedAt: g.completedAt }));
    }
    async getActiveGame(userId) {
        for (const [gameId, session] of gameSessions) {
            if (session.status === 'in_progress' && (session.whitePlayerId === userId || session.blackPlayerId === userId)) {
                return session;
            }
        }
        return null;
    }
}
exports.GameService = GameService;
exports.gameService = new GameService();
//# sourceMappingURL=game.service.js.map