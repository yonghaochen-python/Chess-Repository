// Glue for Vs Computer mode: the human plays White, the browser plays
// Black using ai.js. The human's move enforcement is identical to
// hot-seat; after it, the computer replies automatically.
import { createInitialPosition, generateLegalMovesFrom, applyMove } from './rules.js';
import { renderBoard } from './board.js';
import { chooseComputerMove } from './ai.js';

const PROMOTION_SYMBOLS = { q: '♛', r: '♜', b: '♝', n: '♞' };
const HUMAN_COLOR = 'w';

export function startVsComputer() {
  const boardEl = document.getElementById('board');
  const statusEl = document.getElementById('status');
  const newGameBtn = document.getElementById('new-game');
  const promotionPicker = document.getElementById('promotion-picker');

  let position = createInitialPosition();
  let selected = null;
  let legalTargets = [];
  let gameOver = false;
  let pendingPromotion = null;

  function colorName(color) {
    return color === 'w' ? 'White' : 'Black';
  }

  function describeStatus(result) {
    if (!result) return "White to move (you're White).";
    if (result.isCheckmate) return `Checkmate — ${colorName(result.position.turn === 'w' ? 'b' : 'w')} wins!`;
    if (result.isStalemate) return 'Stalemate — the game is a draw.';
    if (result.isCheck) return `${colorName(result.position.turn)} is in check.`;
    return position.turn === HUMAN_COLOR ? 'Your move.' : "Computer is thinking...";
  }

  function render() {
    renderBoard(boardEl, position, { selected, legalTargets, flipped: false, onSquareClick: handleSquareClick });
    promotionPicker.hidden = !pendingPromotion;
  }

  function handleSquareClick(square) {
    if (gameOver || pendingPromotion || position.turn !== HUMAN_COLOR) return;

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

    if (!gameOver && position.turn !== HUMAN_COLOR) {
      // A tiny delay lets "Computer is thinking..." actually paint first.
      setTimeout(() => {
        const computerMove = chooseComputerMove(position, 2);
        commitMove(computerMove);
      }, 50);
    }
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
}
