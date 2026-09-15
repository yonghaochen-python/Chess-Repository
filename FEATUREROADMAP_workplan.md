# Chezz — Feature Roadmap / Workplan

## How to use this document

Every task below is a checkbox with what it needs first (**Depends on**), which files it touches (**Files**), and exactly how to know it's finished (**Definition of done**). Tasks are grouped into phases, and phases are ordered so **Hot-seat ships live on the internet first**, then **Vs Computer**, then **Online** — matching the order requested.

This is designed to be picked up one task at a time, in any session: say which unchecked task (by number) to run next, and only that task's dependencies need to already be checked off. When a task is finished, its box gets checked here as part of that task's own commit.

Each task (after the very first setup commit) gets its own branch, commit, push, and pull request — nothing merges into `main` (which goes live immediately) without confirming first.

---

## Phase 0 — Foundation

Nothing user-visible yet; this phase proves the rulebook is correct and the deployment pipeline actually works, before building anything on top of either.

- [ ] **0.1 — Scaffold the project**
  - Depends on: nothing
  - Files: `package.json`, `.gitignore`, empty `public/`, `src/`, `tests/` folders
  - Definition of done: `npm install` runs with no errors; the folder layout matches the "How it's built" section of `ProductSpec.md`.

- [ ] **0.2 — Write the rulebook (`rules.js`) and prove it with a move-count test**
  - Depends on: 0.1
  - Files: `public/rules.js`, `tests/perft.js`
  - Definition of done: running `node tests/perft.js` reports that, from the starting position, there are exactly **20** legal move sequences 1 move deep, **400** two moves deep, and **8,902** three moves deep, with no mismatches. This must pass before any board, AI, or server code is written.

- [ ] **0.3 — Deploy a placeholder page to prove the Cloudflare pipeline works**
  - Depends on: 0.1
  - Files: `wrangler.jsonc`, `public/index.html` (placeholder only)
  - Definition of done: pushing to `main` results in a working public URL (shown in the Cloudflare dashboard) that loads the placeholder page — confirms static hosting and auto-deploy both work before anything real is riding on them.

## Phase 1 — Hot-seat (ships live first)

- [ ] **1.1 — Playable board with full rule enforcement**
  - Depends on: 0.2, 0.3
  - Files: `public/board.js`, `public/hotseat.js`, `public/index.html`, `public/style.css`
  - Definition of done: two people can play a complete legal game start to finish on one screen — castling, en passant, promotion (with a piece choice offered), check, checkmate, and stalemate all correctly enforced — and there is no way to attempt an illegal move (no illegal square is ever offered as a target).

- [ ] **1.2 — Three-dimensional board and pieces**
  - Depends on: 1.1
  - Files: `public/style.css`, `public/board.js`
  - Definition of done: in a live game, the board reads as tilted/three-dimensional and pieces are shaded to look like physical objects, not flat icons.

- [ ] **1.3 — Theme system: Black & White, Wooden, Howl's-inspired**
  - Depends on: 1.2
  - Files: `public/themes.js`, `public/assets/themes/*`
  - Definition of done: a theme picker instantly swaps board and piece appearance; all three themes are complete (no missing images) and visually distinct.

- [ ] **1.4 — Free rotation when idle, auto-orient on your turn**
  - Depends on: 1.2
  - Files: `public/board.js`, `public/style.css`
  - Definition of done: dragging the board while it isn't your turn freely rotates/tilts it; the moment it becomes your turn, it snaps to face you with your pieces at the bottom.

- [ ] **1.5 — Move and capture sound effects**
  - Depends on: 1.1
  - Files: `public/sounds.js`, `public/assets/sounds/*`
  - Definition of done: a wood-knock sound plays on every move; a distinct "knocked over" sound plays on every capture.

## Phase 2 — Vs Computer

- [ ] **2.1 — Computer opponent (minimax, alpha-beta pruning, depth 2)**
  - Depends on: 1.1
  - Files: `public/ai.js`, `public/vscomputer.js`
  - Definition of done: from any legal position reachable in a real game, the computer always replies with a legal move in under 2 seconds.

## Phase 3 — Online

- [ ] **3.1 — Durable Object room + WebSocket protocol**
  - Depends on: 0.2
  - Files: `src/worker.js`, `src/room.js`, `wrangler.jsonc`
  - Definition of done: a room, identified by a room code, is backed by one Durable Object; every move sent to it is checked against `rules.js` on the server before being accepted; the position is saved after every move (no timers of any kind).

- [ ] **3.2 — Online client: join by code, reconnect on refresh, New Game**
  - Depends on: 3.1, 1.1
  - Files: `public/online.js`, `public/index.html`
  - Definition of done: two devices entering the same room code see each other's moves live; the first to join is White, the second is Black, anyone after that just watches; refreshing the page rejoins the same game instead of losing it; a "New game" button resets the board for both players.

- [ ] **3.3 — Bring theme, 3D look, and sound into Online mode**
  - Depends on: 3.2, 1.2, 1.3, 1.5
  - Files: `public/online.js`, `src/room.js`
  - Definition of done: the room creator's theme choice is sent to the server, stored with the room, and applied for everyone who joins that room; look, rotation, and sound behave the same as in Hot-seat.

---

## Open items carried from earlier discussion

- **Vs Computer color** — defaulting to the player as White (see `ProductSpec.md`); say the word to change it to Black or to a per-game choice.
- **Optional "extra" feature** — none planned (see `ProductSpec.md`); undo, captured-pieces/material count, and a resign button are all still available to add later without touching `rules.js`, if wanted.
