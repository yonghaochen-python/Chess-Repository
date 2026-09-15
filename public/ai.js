// The Vs Computer opponent: minimax with alpha-beta pruning, depth 2 (its
// move, then the opponent's best reply, before scoring). Runs entirely in
// the browser - only imports the shared rulebook, never a chess library.
import { generateLegalMoves, applyMove, isKingInCheck } from './rules.js';

const VALUES = { P: 1, N: 3, B: 3, R: 5, Q: 9, K: 0 };

function evaluate(position) {
  let score = 0;
  for (const piece of position.board) {
    if (!piece) continue;
    const value = VALUES[piece.toUpperCase()];
    score += piece === piece.toUpperCase() ? value : -value;
  }
  return score;
}

function minimax(position, depth, alpha, beta) {
  const moves = generateLegalMoves(position);
  if (moves.length === 0) {
    if (!isKingInCheck(position, position.turn)) return 0; // stalemate
    return position.turn === 'w' ? -Infinity : Infinity; // side to move is checkmated
  }
  if (depth === 0) return evaluate(position);

  const maximizing = position.turn === 'w';
  let best = maximizing ? -Infinity : Infinity;
  for (const move of moves) {
    const { position: next } = applyMove(position, move);
    const score = minimax(next, depth - 1, alpha, beta);
    if (maximizing) {
      best = Math.max(best, score);
      alpha = Math.max(alpha, best);
    } else {
      best = Math.min(best, score);
      beta = Math.min(beta, best);
    }
    if (beta <= alpha) break; // alpha-beta pruning: this branch can't change the outcome
  }
  return best;
}

// Picks the computer's move for `position`. `depth` counts plies beyond the
// computer's own move, so depth 2 total = this move + the opponent's reply.
export function chooseComputerMove(position, depth = 2) {
  const moves = generateLegalMoves(position);
  if (moves.length === 0) return null;

  const maximizing = position.turn === 'w';
  let bestMove = moves[0];
  let bestScore = maximizing ? -Infinity : Infinity;
  let alpha = -Infinity;
  let beta = Infinity;

  for (const move of moves) {
    const { position: next } = applyMove(position, move);
    const score = minimax(next, depth - 1, alpha, beta);
    const better = maximizing ? score > bestScore : score < bestScore;
    if (better) {
      bestScore = score;
      bestMove = move;
    }
    if (maximizing) alpha = Math.max(alpha, bestScore);
    else beta = Math.min(beta, bestScore);
  }
  return bestMove;
}
