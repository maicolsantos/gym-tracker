# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Project Overview

Gym Tracker ("Tracker de Ginásio") — a Portuguese-language calendar app for tracking gym workout days. Built with Next.js 16 (App Router) and scaffolded from v0.app. Data is persisted in browser localStorage (no backend/database).

## Commands

- `bun dev` — start dev server
- `bun run build` — production build (TypeScript errors are ignored via `next.config.mjs`)
- `bun run lint` — run ESLint

## Architecture

- **Runtime**: Next.js 16 with React 19, using the App Router (`app/` directory). Single-page app with one route (`app/page.tsx`).
- **UI**: shadcn/ui (new-york style) with Radix primitives. Components live in `components/ui/`. Tailwind CSS v4 via `@tailwindcss/postcss`. Design tokens are CSS custom properties defined in `app/globals.css` using oklch colors.
- **Core component**: `components/calendar.tsx` — the main Calendar component. It's a client component that handles all state (month navigation, date toggling) and persists selected workout dates to `localStorage` under the key `gym-workout-dates`.
- **Path aliases**: `@/*` maps to the project root (configured in `tsconfig.json`).
- **Package manager**: Bun (see `bun.lock`).
- **Styling utility**: `cn()` from `lib/utils.ts` merges Tailwind classes via `clsx` + `tailwind-merge`.

## Conventions

- UI text is in **Portuguese (pt-BR)**.
- Icons come from `lucide-react`.
