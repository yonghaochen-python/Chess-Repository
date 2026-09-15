// The only thing this Worker does: route /ws/:roomCode to that room's
// Durable Object. Every other path is served as a static file by the
// "assets" config in wrangler.jsonc without ever reaching this code.
import { Room } from './room.js';

export { Room };

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const match = url.pathname.match(/^\/ws\/([A-Za-z0-9]{1,12})$/);
    if (!match) {
      return new Response('Not found', { status: 404 });
    }

    const roomCode = match[1].toUpperCase();
    const room = env.ROOM.getByName(roomCode);
    return room.fetch(request);
  },
};
