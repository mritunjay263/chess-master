import { Chess, Move, Square } from 'chess.js';
import { createLogger } from '../utils/logger';

const logger = createLogger('ai-service');

// Piece values for simple evaluation
const PIECE_VALUES: Record<string, number> = {
  p: 10, n: 30, b: 30, r: 50, q: 90, k: 900,
  P: -10, N: -30, B: -30, R: -50, Q: -90, K: -900,
};

// Simple position bonus/penalty (simplified)
const POSITION_BONUS: Record<string, Record<string, number>> = {
  p: {
    a2: 0, b2: 0, c2: 0, d2: 0, e2: 0, f2: 0, g2: 0, h2: 0,
    a3: 0, b3: 0, c3: 0, d3: 0, e3: 0, f3: 0, g3: 0, h3: 0,
    a4: 0, b4: 0, c4: 0, d4: 0, e4: 0, f4: 0, g4: 0, h4: 0,
    a5: 0, b5: 0, c5: 0, d5: 0, e5: 0, f5: 0, g5: 0, h5: 0,
    a6: -1, b6: -1, c6: -1, d6: -1, e6: -1, f6: -1, g6: -1, h6: -1,
    a7: -2, b7: -2, c7: -2, d7: -2, e7: -2, f7: -2, g7: -2, h7: -2,
    a8: -3, b8: -3, c8: -3, d8: -3, e8: -3, f8: -3, g8: -3, h8: -3,
  },
};

class AIService {
  /**
   * Get the best move for the current position
   * Uses simple minimax with alpha-beta pruning
   */
  async getBestMove(fen: string, depth = 3, skillLevel = 5): Promise<{ from: string; to: string; evaluation: number } | null> {
    const chess = new Chess(fen);

    if (chess.isGameOver()) {
      logger.info('Game is over, no move available');
      return null;
    }

    try {
      const moves = this.generateAllMoves(chess);
      if (moves.length === 0) return null;

      // Adjust depth based on skill level
      const actualDepth = Math.min(depth, Math.max(1, Math.floor(skillLevel / 2)));

      let bestMove: Move | null = null;
      let bestValue = -Infinity;

      for (const move of moves) {
        chess.move(move);
        const moveValue = this.minimax(chess, actualDepth - 1, -Infinity, Infinity, false);
        chess.undo();

        if (moveValue > bestValue) {
          bestValue = moveValue;
          bestMove = chess.move(move) || null;
          chess.undo();
        }
      }

      if (bestMove) {
        return {
          from: bestMove.from,
          to: bestMove.to,
          evaluation: bestValue,
        };
      }

      // Fallback to random move if minimax fails
      const randomMove = moves[Math.floor(Math.random() * moves.length)];
      const moveObj = chess.move(randomMove);
      chess.undo();

      return moveObj ? { from: moveObj.from, to: moveObj.to, evaluation: 0 } : null;
    } catch (error) {
      logger.error('Error getting best move', { error: (error as Error).message });
      return null;
    }
  }

  /**
   * Get multiple move suggestions with evaluations
   */
  async getMoveSuggestions(fen: string, count = 3): Promise<Array<{ from: string; to: string; evaluation: number; variation: string }>> {
    const chess = new Chess(fen);

    if (chess.isGameOver()) {
      return [];
    }

    try {
      const moves = this.generateAllMoves(chess);
      const scoredMoves: Array<{ from: string; to: string; evaluation: number; variation: string }> = [];

      for (const move of moves) {
        chess.move(move);
        const evaluation = this.evaluateBoard(chess);
        const variation = this.getSANVariation(chess, move);
        scoredMoves.push({ from: move.slice(0, 2), to: move.slice(2, 4), evaluation, variation });
        chess.undo();
      }

      // Sort by evaluation (descending for white, ascending for black)
      const turn = chess.turn();
      scoredMoves.sort((a, b) => (turn === 'w' ? b.evaluation - a.evaluation : a.evaluation - b.evaluation));

      return scoredMoves.slice(0, count);
    } catch (error) {
      logger.error('Error getting move suggestions', { error: (error as Error).message });
      return [];
    }
  }

  private generateAllMoves(chess: Chess): string[] {
    const moves = chess.moves({ verbose: false });
    return moves as string[];
  }

  private minimax(chess: Chess, depth: number, alpha: number, beta: number, isMaximizing: boolean): number {
    if (depth === 0 || chess.isGameOver()) {
      return this.evaluateBoard(chess);
    }

    const moves = this.generateAllMoves(chess);
    if (moves.length === 0) {
      return this.evaluateBoard(chess);
    }

    if (isMaximizing) {
      let maxEval = -Infinity;
      for (const move of moves) {
        chess.move(move);
        const eval_ = this.minimax(chess, depth - 1, alpha, beta, false);
        chess.undo();
        maxEval = Math.max(maxEval, eval_);
        alpha = Math.max(alpha, eval_);
        if (beta <= alpha) break;
      }
      return maxEval;
    } else {
      let minEval = Infinity;
      for (const move of moves) {
        chess.move(move);
        const eval_ = this.minimax(chess, depth - 1, alpha, beta, true);
        chess.undo();
        minEval = Math.min(minEval, eval_);
        beta = Math.min(beta, eval_);
        if (beta <= alpha) break;
      }
      return minEval;
    }
  }

  private evaluateBoard(chess: Chess): number {
    let evaluation = 0;
    const board = chess.board();

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col];
        if (piece) {
          const square = String.fromCharCode(97 + col) + (8 - row) as Square;
          const value = PIECE_VALUES[piece.color === 'w' ? piece.type : piece.type.toUpperCase()] || 0;
          const positionBonus = POSITION_BONUS[piece.type]?.[square] || 0;
          evaluation += piece.color === 'w' ? value + positionBonus : -value - positionBonus;
        }
      }
    }

    // Bonus for check
    if (chess.inCheck()) {
      evaluation += chess.turn() === 'w' ? -50 : 50;
    }

    return evaluation;
  }

  private getSANVariation(chess: Chess, move: string): string {
    try {
      const result = chess.move(move);
      const san = result?.san || '';
      chess.undo();
      return san;
    } catch {
      return move;
    }
  }
}

export const aiService = new AIService();