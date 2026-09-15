// Renders an 8x8 board into a container and reports clicks upward. Knows
// nothing about chess rules - it only draws whatever position it's given
// and tells its caller which square was clicked.

const SYMBOLS = {
  P: '♙', N: '♘', B: '♗', R: '♖', Q: '♕', K: '♔',
  p: '♟', n: '♞', b: '♝', r: '♜', q: '♛', k: '♚',
};

function fileOf(sq) { return sq % 8; }
function rankOf(sq) { return Math.floor(sq / 8); }

// `flipped`: when true, square 63 (h8) is drawn top-left instead of a1 -
// this is how the board will later face whichever color is "you".
export function renderBoard(container, position, { selected, legalTargets, flipped, onSquareClick }) {
  container.innerHTML = '';
  const targets = legalTargets || [];

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const rank = flipped ? row : 7 - row;
      const file = flipped ? 7 - col : col;
      const square = rank * 8 + file;

      const el = document.createElement('div');
      const isLight = (file + rank) % 2 === 1;
      el.className = `square ${isLight ? 'light' : 'dark'}`;
      if (square === selected) el.classList.add('selected');
      if (targets.includes(square)) el.classList.add('legal-target');

      const piece = position.board[square];
      if (piece) {
        el.textContent = SYMBOLS[piece];
        el.classList.add(piece === piece.toUpperCase() ? 'white-piece' : 'black-piece');
      }

      el.addEventListener('click', () => onSquareClick(square));
      container.appendChild(el);
    }
  }
}
