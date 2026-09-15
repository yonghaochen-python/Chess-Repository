// Glue for Online mode: the server (the room's Durable Object) is the only
// authority on the game. This module never applies a move itself - it only
// sends the player's intent and redraws whatever the server broadcasts
// back. That's why every move goes through the network even though the
// same rules.js is available locally (used here only to know which squares
// to highlight as legal targets).
import { generateLegalMovesFrom } from './rules.js';
import { renderBoard } from './board.js';

const PROMOTION_SYMBOLS = { q: '♛', r: '♜', b: '♝', n: '♞' };
const SESSION_KEY = 'chezz-session-id';
const ROOM_KEY = 'chezz-room-code';

export function startOnline() {
  const joinPanel = document.getElementById('online-join');
  const roomInput = document.getElementById('room-code-input');
  const joinBtn = document.getElementById('join-room-btn');
  const game = document.getElementById('game');
  const roomCodeDisplay = document.getElementById('room-code-display');
  const boardEl = document.getElementById('board');
  const statusEl = document.getElementById('status');
  const newGameBtn = document.getElementById('new-game');
  const promotionPicker = document.getElementById('promotion-picker');

  let ws = null;
  let position = null;
  let status = 'ongoing';
  let myColor = null; // 'w' | 'b' | 'spectator'
  let selected = null;
  let legalTargets = [];
  let pendingPromotion = null;

  function getSessionId() {
    let id = localStorage.getItem(SESSION_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(SESSION_KEY, id);
    }
    return id;
  }

  joinBtn.addEventListener('click', () => {
    const code = roomInput.value.trim().toUpperCase();
    if (!code) return;
    connect(code);
  });

  // A page refresh opens a brand new WebSocket, but the same session id
  // (and, if we remember the room code too) lets the server recognize us
  // as the same player and rejoin the game already in progress.
  const savedRoomCode = localStorage.getItem(ROOM_KEY);
  if (savedRoomCode) {
    connect(savedRoomCode);
  }

  function connect(roomCode) {
    const sessionId = getSessionId();
    const proto = location.protocol === 'https:' ? 'wss' : 'ws';
    ws = new WebSocket(`${proto}://${location.host}/ws/${roomCode}?sessionId=${sessionId}`);

    ws.addEventListener('open', () => {
      localStorage.setItem(ROOM_KEY, roomCode);
      joinPanel.hidden = true;
      game.hidden = false;
      roomCodeDisplay.hidden = false;
      roomCodeDisplay.textContent = `Room: ${roomCode}`;
    });

    ws.addEventListener('message', (event) => handleMessage(JSON.parse(event.data)));

    ws.addEventListener('close', () => {
      statusEl.textContent = 'Disconnected. Refresh the page to rejoin this room.';
    });
  }

  function handleMessage(msg) {
    if (msg.type === 'welcome') {
      myColor = msg.payload.yourColor;
      position = msg.payload.position;
      status = msg.payload.status;
      selected = null;
      legalTargets = null;
      render();
    } else if (msg.type === 'state') {
      position = msg.payload.position;
      status = msg.payload.status;
      selected = null;
      legalTargets = null;
      pendingPromotion = null;
      render();
    } else if (msg.type === 'error') {
      statusEl.textContent = msg.payload.message;
    }
  }

  function colorName(color) {
    return color === 'w' ? 'White' : 'Black';
  }

  function describeStatus() {
    if (myColor === 'spectator') return `Watching. ${colorName(position.turn)} to move.`;
    if (status === 'checkmate') return `Checkmate — ${colorName(position.turn === 'w' ? 'b' : 'w')} wins!`;
    if (status === 'stalemate') return 'Stalemate — the game is a draw.';
    if (position.turn === myColor) return "Your move.";
    return `Waiting for ${colorName(position.turn)}...`;
  }

  function render() {
    statusEl.textContent = describeStatus();
    const canInteract = myColor !== 'spectator' && status === 'ongoing' && position.turn === myColor;
    renderBoard(boardEl, position, {
      selected,
      legalTargets: legalTargets || [],
      flipped: false,
      onSquareClick: canInteract ? handleSquareClick : () => {},
    });
    promotionPicker.hidden = !pendingPromotion;
  }

  function handleSquareClick(square) {
    if (pendingPromotion) return;

    if (selected !== null && (legalTargets || []).includes(square)) {
      const moves = generateLegalMovesFrom(position, selected).filter((m) => m.to === square);
      const from = selected;
      selected = null;
      legalTargets = [];
      if (moves.length > 1) {
        pendingPromotion = { from, moves };
        renderPromotionPicker();
        render();
        return;
      }
      sendMove(moves[0]);
      return;
    }

    const piece = position.board[square];
    const isOwnPiece = piece && (piece === piece.toUpperCase() ? 'w' : 'b') === myColor;
    if (isOwnPiece) {
      selected = square;
      legalTargets = generateLegalMovesFrom(position, square).map((m) => m.to);
    } else {
      selected = null;
      legalTargets = [];
    }
    render();
  }

  function sendMove(move) {
    ws.send(JSON.stringify({ type: 'move', payload: { from: move.from, to: move.to, promotion: move.promotion || null } }));
  }

  function renderPromotionPicker() {
    promotionPicker.innerHTML = '';
    for (const move of pendingPromotion.moves) {
      const btn = document.createElement('button');
      btn.textContent = PROMOTION_SYMBOLS[move.promotion];
      btn.addEventListener('click', () => {
        pendingPromotion = null;
        sendMove(move);
      });
      promotionPicker.appendChild(btn);
    }
  }

  newGameBtn.addEventListener('click', () => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'new_game', payload: {} }));
    }
  });
}
