// The chess rulebook. Every mode (hot-seat, vs-computer, online) and the
// server import ONLY this file for anything about what a legal chess move
// is. No other file is allowed to know a chess rule.
//
// Board representation: a flat array of 64 squares, index = rank*8 + file,
// where file 0 = 'a'..7 = 'h' and rank 0 = '1'..7 = '8'. So a1 = 0, h1 = 7,
// a8 = 56, h8 = 63. A square holds either null (empty) or a one-letter piece
// code: P N B R Q K for White, p n b r q k for Black.

const FILES = 'abcdefgh';

function fileOf(sq) { return sq % 8; }
function rankOf(sq) { return Math.floor(sq / 8); }
function squareAt(file, rank) { return rank * 8 + file; }
function inBounds(file, rank) { return file >= 0 && file < 8 && rank >= 0 && rank < 8; }

export function squareToAlgebraic(sq) {
  return FILES[fileOf(sq)] + (rankOf(sq) + 1);
}

export function algebraicToSquare(s) {
  const file = FILES.indexOf(s[0]);
  const rank = Number(s[1]) - 1;
  return squareAt(file, rank);
}

function pieceColor(piece) {
  if (!piece) return null;
  return piece === piece.toUpperCase() ? 'w' : 'b';
}

export function createInitialPosition() {
  const board = new Array(64).fill(null);
  const backRank = ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R'];
  for (let file = 0; file < 8; file++) {
    board[squareAt(file, 0)] = backRank[file];
    board[squareAt(file, 1)] = 'P';
    board[squareAt(file, 6)] = 'p';
    board[squareAt(file, 7)] = backRank[file].toLowerCase();
  }
  return {
    board,
    turn: 'w',
    castling: { K: true, Q: true, k: true, q: true },
    ep: null,
  };
}

export function clonePosition(pos) {
  return {
    board: pos.board.slice(),
    turn: pos.turn,
    castling: { ...pos.castling },
    ep: pos.ep,
  };
}

const KNIGHT_OFFSETS = [
  [1, 2], [2, 1], [2, -1], [1, -2],
  [-1, -2], [-2, -1], [-2, 1], [-1, 2],
];
const KING_OFFSETS = [
  [1, 0], [1, 1], [0, 1], [-1, 1],
  [-1, 0], [-1, -1], [0, -1], [1, -1],
];
const BISHOP_DIRS = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
const ROOK_DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const QUEEN_DIRS = [...BISHOP_DIRS, ...ROOK_DIRS];

// True if `byColor` has a piece that attacks `sq` on this board. Used both
// for "is a king in check" and for "does castling pass through an attacked
// square" - it never looks at whose turn it is, only at piece placement.
function isSquareAttacked(board, sq, byColor) {
  const file = fileOf(sq);
  const rank = rankOf(sq);

  const pawnDir = byColor === 'w' ? 1 : -1; // direction a byColor pawn moves
  const pawnCode = byColor === 'w' ? 'P' : 'p';
  for (const df of [-1, 1]) {
    const f = file + df;
    const r = rank - pawnDir;
    if (inBounds(f, r) && board[squareAt(f, r)] === pawnCode) return true;
  }

  const knightCode = byColor === 'w' ? 'N' : 'n';
  for (const [df, dr] of KNIGHT_OFFSETS) {
    const f = file + df, r = rank + dr;
    if (inBounds(f, r) && board[squareAt(f, r)] === knightCode) return true;
  }

  const kingCode = byColor === 'w' ? 'K' : 'k';
  for (const [df, dr] of KING_OFFSETS) {
    const f = file + df, r = rank + dr;
    if (inBounds(f, r) && board[squareAt(f, r)] === kingCode) return true;
  }

  const bishopCode = byColor === 'w' ? 'B' : 'b';
  const rookCode = byColor === 'w' ? 'R' : 'r';
  const queenCode = byColor === 'w' ? 'Q' : 'q';
  for (const [df, dr] of QUEEN_DIRS) {
    let f = file + df, r = rank + dr;
    const isDiagonal = df !== 0 && dr !== 0;
    while (inBounds(f, r)) {
      const piece = board[squareAt(f, r)];
      if (piece) {
        if (isDiagonal && (piece === bishopCode || piece === queenCode)) return true;
        if (!isDiagonal && (piece === rookCode || piece === queenCode)) return true;
        break;
      }
      f += df; r += dr;
    }
  }

  return false;
}

function findKing(board, color) {
  const kingCode = color === 'w' ? 'K' : 'k';
  return board.indexOf(kingCode);
}

export function isKingInCheck(pos, color) {
  const kingSquare = findKing(pos.board, color);
  const opponent = color === 'w' ? 'b' : 'w';
  return isSquareAttacked(pos.board, kingSquare, opponent);
}

// Generates every pseudo-legal move for the side to move: obeys how each
// piece moves and can't capture its own pieces, but does NOT yet check
// whether the move leaves the mover's own king in check.
function generatePseudoMoves(pos) {
  const { board, turn } = pos;
  const opponent = turn === 'w' ? 'b' : 'w';
  const moves = [];

  for (let from = 0; from < 64; from++) {
    const piece = board[from];
    if (!piece || pieceColor(piece) !== turn) continue;
    const type = piece.toUpperCase();
    const file = fileOf(from);
    const rank = rankOf(from);

    if (type === 'P') {
      const dir = turn === 'w' ? 1 : -1;
      const startRank = turn === 'w' ? 1 : 6;
      const promoRank = turn === 'w' ? 7 : 0;

      const oneRank = rank + dir;
      if (inBounds(file, oneRank) && !board[squareAt(file, oneRank)]) {
        const to = squareAt(file, oneRank);
        addPawnAdvance(moves, from, to, null, oneRank === promoRank);
        if (rank === startRank) {
          const twoRank = rank + 2 * dir;
          if (!board[squareAt(file, twoRank)]) {
            moves.push({ from, to: squareAt(file, twoRank), captured: null, promotion: null, flag: 'double' });
          }
        }
      }
      for (const df of [-1, 1]) {
        const f = file + df;
        if (!inBounds(f, oneRank)) continue;
        const to = squareAt(f, oneRank);
        const target = board[to];
        if (target && pieceColor(target) === opponent) {
          addPawnAdvance(moves, from, to, target, oneRank === promoRank);
        } else if (pos.ep === to) {
          moves.push({ from, to, captured: board[squareAt(f, rank)], promotion: null, flag: 'ep' });
        }
      }
    } else if (type === 'N' || type === 'K') {
      const offsets = type === 'N' ? KNIGHT_OFFSETS : KING_OFFSETS;
      for (const [df, dr] of offsets) {
        const f = file + df, r = rank + dr;
        if (!inBounds(f, r)) continue;
        const to = squareAt(f, r);
        const target = board[to];
        if (!target || pieceColor(target) === opponent) {
          moves.push({ from, to, captured: target, promotion: null, flag: 'normal' });
        }
      }
      if (type === 'K') addCastlingMoves(pos, moves, from);
    } else {
      const dirs = type === 'B' ? BISHOP_DIRS : type === 'R' ? ROOK_DIRS : QUEEN_DIRS;
      for (const [df, dr] of dirs) {
        let f = file + df, r = rank + dr;
        while (inBounds(f, r)) {
          const to = squareAt(f, r);
          const target = board[to];
          if (!target) {
            moves.push({ from, to, captured: null, promotion: null, flag: 'normal' });
          } else {
            if (pieceColor(target) === opponent) {
              moves.push({ from, to, captured: target, promotion: null, flag: 'normal' });
            }
            break;
          }
          f += df; r += dr;
        }
      }
    }
  }

  return moves;
}

function addPawnAdvance(moves, from, to, captured, isPromotion) {
  if (isPromotion) {
    for (const promotion of ['q', 'r', 'b', 'n']) {
      moves.push({ from, to, captured, promotion, flag: 'normal' });
    }
  } else {
    moves.push({ from, to, captured, promotion: null, flag: 'normal' });
  }
}

function addCastlingMoves(pos, moves, kingSquare) {
  const { board, turn, castling } = pos;
  const opponent = turn === 'w' ? 'b' : 'w';
  const home = turn === 'w' ? 0 : 56; // a-file home rank square for this color

  const kingsideRight = turn === 'w' ? castling.K : castling.k;
  if (kingsideRight) {
    const between = [home + 5, home + 6];
    const kingPath = [home + 4, home + 5, home + 6];
    if (between.every((sq) => !board[sq]) && kingPath.every((sq) => !isSquareAttacked(board, sq, opponent))) {
      moves.push({ from: kingSquare, to: home + 6, captured: null, promotion: null, flag: 'castleK' });
    }
  }

  const queensideRight = turn === 'w' ? castling.Q : castling.q;
  if (queensideRight) {
    const between = [home + 1, home + 2, home + 3];
    const kingPath = [home + 4, home + 3, home + 2];
    if (between.every((sq) => !board[sq]) && kingPath.every((sq) => !isSquareAttacked(board, sq, opponent))) {
      moves.push({ from: kingSquare, to: home + 2, captured: null, promotion: null, flag: 'castleQ' });
    }
  }
}

// Applies a move with no legality checking and no result reporting - the
// minimal, fast version used internally by move generation and perft.
function makeMove(pos, move) {
  const board = pos.board.slice();
  const piece = board[move.from];
  const color = pieceColor(piece);
  const castling = { ...pos.castling };
  let captured = move.captured;

  board[move.from] = null;
  if (move.flag === 'ep') {
    const capturedSquare = squareAt(fileOf(move.to), rankOf(move.from));
    board[capturedSquare] = null;
  }
  board[move.to] = move.promotion ? (color === 'w' ? move.promotion.toUpperCase() : move.promotion.toLowerCase()) : piece;

  if (move.flag === 'castleK') {
    const home = color === 'w' ? 0 : 56;
    board[home + 5] = board[home + 7];
    board[home + 7] = null;
  } else if (move.flag === 'castleQ') {
    const home = color === 'w' ? 0 : 56;
    board[home + 3] = board[home + 0];
    board[home + 0] = null;
  }

  if (piece === 'K') { castling.K = false; castling.Q = false; }
  if (piece === 'k') { castling.k = false; castling.q = false; }
  if (move.from === 0 || move.to === 0) castling.Q = false;
  if (move.from === 7 || move.to === 7) castling.K = false;
  if (move.from === 56 || move.to === 56) castling.q = false;
  if (move.from === 63 || move.to === 63) castling.k = false;

  const ep = move.flag === 'double' ? (move.from + move.to) / 2 : null;
  const turn = color === 'w' ? 'b' : 'w';

  return { board, turn, castling, ep, captured };
}

// Every fully legal move available to the side to move: a pseudo-legal move
// survives only if it doesn't leave the mover's own king in check.
export function generateLegalMoves(pos) {
  const pseudo = generatePseudoMoves(pos);
  const legal = [];
  for (const move of pseudo) {
    const next = makeMove(pos, move);
    if (!isSquareAttacked(next.board, findKing(next.board, pos.turn), next.turn)) {
      legal.push(move);
    }
  }
  return legal;
}

export function generateLegalMovesFrom(pos, squareIndex) {
  return generateLegalMoves(pos).filter((m) => m.from === squareIndex);
}

export function getGameStatus(pos) {
  const inCheck = isKingInCheck(pos, pos.turn);
  const hasMoves = generateLegalMoves(pos).length > 0;
  if (hasMoves) return 'ongoing';
  return inCheck ? 'checkmate' : 'stalemate';
}

// The public, full-detail move application: what the UI, the AI, and the
// server all call. Never mutates `pos` - always returns a new position.
export function applyMove(pos, move) {
  const next = makeMove(pos, move);
  const position = { board: next.board, turn: next.turn, castling: next.castling, ep: next.ep };
  const isCheck = isKingInCheck(position, position.turn);
  const opponentHasMoves = generateLegalMoves(position).length > 0;
  return {
    position,
    captured: next.captured,
    isCheck,
    isCheckmate: isCheck && !opponentHasMoves,
    isStalemate: !isCheck && !opponentHasMoves,
    isCastle: move.flag === 'castleK' ? 'K' : move.flag === 'castleQ' ? 'Q' : null,
    isEnPassant: move.flag === 'ep',
    isPromotion: !!move.promotion,
  };
}

// Move-count test used to prove this file is correct: perft(start, 1) must
// be 20, perft(start, 2) must be 400, perft(start, 3) must be 8902.
export function perft(pos, depth) {
  if (depth === 0) return 1;
  const moves = generateLegalMoves(pos);
  if (depth === 1) return moves.length;
  let count = 0;
  for (const move of moves) {
    const next = makeMove(pos, move);
    count += perft({ board: next.board, turn: next.turn, castling: next.castling, ep: next.ep }, depth - 1);
  }
  return count;
}
