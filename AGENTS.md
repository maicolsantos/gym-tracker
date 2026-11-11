# AGENTS.md

This file provides guidance to Codex, Claude Code, and Antigravity agents when working with code in this repository.

## Project Overview

Gym Tracker ("Tracker de Ginásio") — a Portuguese-language fitness tracker web application. Built with Next.js 16 (App Router), React 19, Tailwind CSS v4, and shadcn/ui.
Data and authentication are powered by **Firebase Auth** (Google login) and **Firestore** (workouts, XP, friendships, shop items), with support for the **Firebase Emulator Suite** for offline development and testing.

## Commands

- `bun dev` — start Next.js dev server
- `bun run build` — production build
- `bun run lint` — run ESLint
- `bun run emulators` — start Firebase Local Emulators (Auth on :9099, Firestore on :8088)
- `bun run test:e2e` — run Playwright end-to-end test suite against Firebase Emulators (24 tests)
- `bun run test:e2e:headed` — run tests with visible Chromium browser window
- `bun run test:e2e:slow` — run tests with visible browser in slow motion (1s delay per action)
- `bun run test:e2e:debug` — run tests with Playwright Inspector (step-by-step debugger)
- `bun run test:e2e:ui` — open Playwright UI test runner

## Architecture & Routes

- **Runtime**: Next.js 16 with React 19 (App Router in `app/`).
- **Routes**:
  - `/` (`app/page.tsx`): Main dashboard / Calendar view, monthly & yearly workout counters, XP flash, year podium.
  - `/workouts` (`app/workouts/page.tsx`): Workout logging, exercise catalogue, sets/reps tracker.
  - `/friends` (`app/friends/page.tsx`): Social ranking (monthly & yearly), friend codes, ranking history dialog.
  - `/profile` (`app/profile/page.tsx`): User profile, badges, gamification shop, dark/light theme toggle, logout.
  - `/privacidade` (`app/privacidade/page.tsx`): Privacy policy and terms.
- **Backend / Persistence**: Firebase Auth + Firestore (`lib/firebase.ts`, `contexts/auth-context.tsx`, `firestore.rules`). Emulators connect automatically when `NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true`.
- **UI & Styling**: shadcn/ui (new-york style) with Radix primitives in `components/ui/`. Tailwind CSS v4 via `@tailwindcss/postcss`. Design tokens in `app/globals.css`.
- **Path aliases**: `@/*` maps to project root.
- **Package manager**: Bun (`bun.lock`).
- **Styling utility**: `cn()` from `lib/utils.ts`.

## Conventions & Rules

- **Language**: UI text is in **Portuguese (pt-BR)**. Code, identifiers, and commit messages are in **English**.
- **Agent Guidelines**: Must adhere to rules in `.claude/rules/` (`git-workflow.md`, `security.md`) and `.claude/agents/` (`e2e-runner.md`, `doc-updater.md`, `tdd-guide.md`).
- **Testing**: Follow guidelines in `.claude/agents/e2e-runner.md`:
  - Prefer semantic locators and `data-testid`.
  - Wait for events/conditions, never `waitForTimeout`.
  - Isolate tests; never share mutable state across tests.
- **Git commits**: Follow `type(scope): message` in English, max 50 chars, no emojis.
