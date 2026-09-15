# Chezz — Product Spec

## What this is

Chezz is a full, legal game of chess, playable in a web browser, in three modes: **Hot-seat**, **Vs Computer**, and **Online**. "Full and legal" means every standard chess rule is enforced, not just the basic moves:

- All six piece types — **pawn**, **knight**, **bishop**, **rook**, **queen**, **king** — move exactly as they do in real chess.
- **Check** (a king under attack), **checkmate** (a check with no legal way out — the game ends), and **stalemate** (no legal move available, but the king isn't in check — the game ends in a draw) are all detected automatically.
- **Castling** — a special once-per-game move where the king and a rook swap positions for safety, under several conditions (neither piece has moved yet, no pieces in between, the king isn't in or moving through check).
- **En passant** — a special pawn-capture rule for a specific situation with pawns that have just moved two squares.
- **Promotion** — when a pawn reaches the far end of the board, it becomes a queen, rook, bishop, or knight, and the player picks which.

**The bar for "done": an illegal move must be impossible to make** — not allowed and then rejected with an error, but never offered as an option in the first place (no square to drag to, no button to click).

## No Figma designs

There is no Figma file (a design-mockup tool) for this project — this was confirmed earlier, so the look described below is built directly from the written description here, not traced from a reference file.

## The three modes

### 1. Hot-seat
Two people share one device and one screen, taking turns making moves for White and Black.

### 2. Vs Computer
The player plays one color; the browser calculates and plays the other side automatically.

- **Default: the player is White** (moves first). This wasn't explicitly chosen when asked, so it's the assumed default — say so if Black, or a color choice each game, is wanted instead.
- The computer "thinks" using **minimax with alpha-beta pruning**, a standard way for a program to pick a good move: it looks ahead at possible move sequences, scores how good each resulting position looks (based on which pieces are on the board and their standard point values), and picks the move that leads to its best guaranteed outcome, assuming the opponent also plays well. "Alpha-beta pruning" is an optimization that skips checking sequences that can't possibly change the outcome, so it doesn't waste time. **Depth 2** means it looks two moves ahead (its move, then the opponent's best reply) before scoring.
- The computer must always reply with a legal move within **2 seconds**.
- This runs entirely in the browser — no external chess engine, no server call, no internet dependency for this mode.

### 3. Online
Two people on two different devices type the same **room code** and play against each other live, with a **display name** each — no accounts, logins, or passwords anywhere in this app.

- Whoever joins the room code first plays White; the second person to join plays Black; anyone joining after that just watches (a "spectator").
- The server is the only authority on the game: every move is checked against the same rulebook the browser uses, on the server, before either player is told it happened. A player's browser cannot make an illegal move "stick" even if it tried.
- Refreshing the page rejoins the same game in progress, rather than losing it or starting a new one.
- A "New game" button resets the board for both players in that room.

## The look

Simplified at the user's request, to get the site live sooner:

- **Flat board, Wooden theme only**: a plain, flat (not tilted/3D) board styled with wood-toned colors for the squares and pieces. No perspective tilt, no shading tricks to fake physical depth.
- Since there's only one theme, there's no theme picker — every game just looks wooden by default. Black & White and a Howl's Moving Castle–inspired theme remain possible later, but aren't planned right now.

**Dropped from scope entirely:** the three-dimensional look/tilt, free-rotating the board, auto-orienting it to the current player's side, and sound effects (wood-knock/capture sounds). All were cut by the user to prioritize shipping the working site. The board is simply flat and always shown the same way (White at the bottom) for every viewer, in every mode.

## Explicitly out of scope

These were specifically excluded and should not get built even if they'd seem like natural additions:

- Accounts, logins, passwords, or any user database.
- Clocks or time limits.
- Ratings or rankings.
- Draw by threefold repetition or the fifty-move rule (real chess has these; this app doesn't need to).
- Opening books (pre-programmed "best" opening moves for the computer).
- Move export (e.g. saving a game's move list to a file).
- React or any other frontend framework — plain HTML, CSS, and JavaScript only.

## One optional "extra," to be built last, if at all

The spec allowed for exactly one bonus feature, to be built only after everything above works, and only if requested: undo (hot-seat only), captured-pieces-and-material-count display, or a resign button (online only). **Default: none of these are planned** right now — this wasn't chosen when asked, so nothing extra is on the roadmap unless it's requested later. None of them require changing the shared rulebook (`rules.js`), so any one of them can be added later without disturbing anything already built.

## How it's built, in plain terms

- **One shared rulebook.** All chess rules live in exactly one file, `rules.js`, used by all three modes and by the server — so the rules can never disagree with themselves between, say, the computer opponent and an online game.
- **The computer opponent lives in the browser**, not on a server — it's just JavaScript code running on the visitor's own device.
- **Online games live in one small, persistent "room."** Each room code corresponds to one **Durable Object** — a Cloudflare feature that's essentially a tiny, dedicated piece of server memory-plus-storage for exactly one room, that remembers the game even if everyone disconnects and comes back later.
