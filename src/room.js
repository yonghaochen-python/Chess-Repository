// One Durable Object instance per room code. It is the only authority on
// an online game: every move is checked against the same rulebook the
// browser uses before anyone is told it happened. No timers anywhere -
// the position is written to storage after every change, so a page
// refresh (which opens a fresh socket) just reads the current state back.
import { createInitialPosition, generateLegalMoves, applyMove, getGameStatus } from '../public/rules.js';

export class Room {
  constructor(ctx, env) {
    this.ctx = ctx;
    this.env = env;
    this.state = null;
  }

  async loadState() {
    if (this.state) return this.state;
    const stored = await this.ctx.storage.get('state');
    this.state = stored || {
      position: createInitialPosition(),
      whiteSessionId: null,
      blackSessionId: null,
    };
    return this.state;
  }

  async saveState() {
    await this.ctx.storage.put('state', this.state);
  }

  colorFor(sessionId) {
    if (this.state.whiteSessionId === sessionId) return 'w';
    if (this.state.blackSessionId === sessionId) return 'b';
    if (!this.state.whiteSessionId) {
      this.state.whiteSessionId = sessionId;
      return 'w';
    }
    if (!this.state.blackSessionId) {
      this.state.blackSessionId = sessionId;
      return 'b';
    }
    return 'spectator';
  }

  async fetch(request) {
    if (request.headers.get('Upgrade') !== 'websocket') {
      return new Response('Expected a WebSocket upgrade', { status: 426 });
    }

    await this.loadState();

    const url = new URL(request.url);
    const sessionId = url.searchParams.get('sessionId') || crypto.randomUUID();
    const color = this.colorFor(sessionId);
    await this.saveState();

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    this.ctx.acceptWebSocket(server);
    server.serializeAttachment({ sessionId, color });

    server.send(JSON.stringify({
      type: 'welcome',
      payload: {
        yourColor: color,
        sessionId,
        position: this.state.position,
        status: getGameStatus(this.state.position),
      },
    }));

    return new Response(null, { status: 101, webSocket: client });
  }

  broadcastState() {
    const message = JSON.stringify({
      type: 'state',
      payload: {
        position: this.state.position,
        status: getGameStatus(this.state.position),
      },
    });
    for (const ws of this.ctx.getWebSockets()) {
      ws.send(message);
    }
  }

  async webSocketMessage(ws, raw) {
    await this.loadState();
    const { color } = ws.deserializeAttachment();
    let msg;
    try {
      msg = JSON.parse(raw);
    } catch {
      return;
    }

    if (msg.type === 'move') {
      if (color !== this.state.position.turn) {
        ws.send(JSON.stringify({ type: 'error', payload: { message: 'Not your turn.' } }));
        return;
      }
      const { from, to, promotion } = msg.payload || {};
      const legalMoves = generateLegalMoves(this.state.position);
      const match = legalMoves.find(
        (m) => m.from === from && m.to === to && (m.promotion || null) === (promotion || null),
      );
      if (!match) {
        ws.send(JSON.stringify({ type: 'error', payload: { message: 'Illegal move.' } }));
        return;
      }
      const result = applyMove(this.state.position, match);
      this.state.position = result.position;
      await this.saveState();
      this.broadcastState();
    } else if (msg.type === 'new_game') {
      this.state.position = createInitialPosition();
      await this.saveState();
      this.broadcastState();
    }
  }

  async webSocketClose(ws) {
    ws.close();
  }
}
