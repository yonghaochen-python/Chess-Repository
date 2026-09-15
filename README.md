# Chezz

Chezz is a browser-based chess game with three ways to play:

- **Hot-seat** — two people take turns on one screen.
- **Vs Computer** — you play one color, the browser plays the other.
- **Online** — two people on two different devices type the same room code and play live.

Built by Yonghao Chen, with Claude Code doing the implementation.

## What's in this repo

- [`ProductSpec.md`](./ProductSpec.md) — what the app does, mode by mode, and what's deliberately left out.
- [`FEATUREROADMAP_workplan.md`](./FEATUREROADMAP_workplan.md) — the build checklist, in order, with a "definition of done" for every item.

## Running it on your own computer

This app runs on **Cloudflare Workers** — a Cloudflare service that runs small pieces of code close to whoever's using them, instead of on one server someone has to keep running themselves.

1. Install [Node.js](https://nodejs.org) (lets JavaScript run outside a browser) if it isn't already on your machine.
2. In this folder, run:

```bash
npm install
npx wrangler dev
```

`wrangler` is Cloudflare's command-line tool (a program controlled by typing commands rather than clicking) for running and deploying Workers. `npx` runs a tool without permanently installing it. `wrangler dev` starts a local copy of the game at `http://localhost:8787` so it can be tried before it's live on the internet.

## Deploying

This repo is connected to a Cloudflare Workers project through GitHub. Every time code is pushed (uploaded) to the `main` branch, Cloudflare automatically rebuilds and redeploys the live site — there is no separate manual deploy step.

## How this project gets built

Work happens one task at a time from `FEATUREROADMAP_workplan.md`. Each finished task is committed (saved as a labeled snapshot) with a message naming it, and pushed (uploaded) straight to `main` — which goes live immediately, since Cloudflare redeploys on every push to `main`. No branches or pull requests for this project.
