// Glue for Hot-seat mode: two people, one screen, taking turns. Owns the
// current position and wires board.js's clicks into rules.js's moves.
import { createInitialPosition, generateLegalMovesFrom, applyMove } from './rules.js';
import { renderBoard } from './board.js';

const boardEl = document.getElementById('board');
const statusEl = document.getElementById('status');
const newGameBtn = document.getElementById('new-game');
const promotionPicker = document.getElementById('promotion-picker');

const PROMOTION_SYMBOLS = { q: '♛', r: '♜', b: '♝', n: '♞' };

let position = createInitialPosition();
let selected = null;
let legalTargets = [];
let gameOver = false;
let pendingPromotion = null; // { from, to, moves }

function colorName(color) {
  return color === 'w' ? 'White' : 'Black';
}

function describeStatus(result) {
  if (!result) return `${colorName(position.turn)} to move.`;
  if (result.isCheckmate) return `Checkmate — ${colorName(result.position.turn === 'w' ? 'b' : 'w')} wins!`;
  if (result.isStalemate) return 'Stalemate — the game is a draw.';
  if (result.isCheck) return `${colorName(result.position.turn)} is in check.`;
  return `${colorName(result.position.turn)} to move.`;
}

function render() {
  renderBoard(boardEl, position, { selected, legalTargets, flipped: false, onSquareClick: handleSquareClick });
  promotionPicker.hidden = !pendingPromotion;
}

function handleSquareClick(square) {
  if (gameOver || pendingPromotion) return;

  if (selected !== null && legalTargets.includes(square)) {
    const moves = generateLegalMovesFrom(position, selected).filter((m) => m.to === square);
    selected = null;
    legalTargets = [];
    if (moves.length > 1) {
      pendingPromotion = { moves };
      renderPromotionPicker();
      render();
      return;
    }
    commitMove(moves[0]);
    return;
  }

  const piece = position.board[square];
  const isOwnPiece = piece && (piece === piece.toUpperCase() ? 'w' : 'b') === position.turn;
  if (isOwnPiece) {
    selected = square;
    legalTargets = generateLegalMovesFrom(position, square).map((m) => m.to);
  } else {
    selected = null;
    legalTargets = [];
  }
  render();
}

function commitMove(move) {
  const result = applyMove(position, move);
  position = result.position;
  gameOver = result.isCheckmate || result.isStalemate;
  statusEl.textContent = describeStatus(result);
  render();
}

function renderPromotionPicker() {
  promotionPicker.innerHTML = '';
  for (const move of pendingPromotion.moves) {
    const btn = document.createElement('button');
    btn.textContent = PROMOTION_SYMBOLS[move.promotion];
    btn.addEventListener('click', () => {
      pendingPromotion = null;
      commitMove(move);
    });
    promotionPicker.appendChild(btn);
  }
}

newGameBtn.addEventListener('click', () => {
  position = createInitialPosition();
  selected = null;
  legalTargets = [];
  gameOver = false;
  pendingPromotion = null;
  statusEl.textContent = describeStatus(null);
  render();
});

statusEl.textContent = describeStatus(null);
render();
