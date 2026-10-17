# 🏡 Happy Home — Chore Tracker

A cheerful pastel home chores management app built with React + Vite.

## Features

- 📅 **Daily view** — see today's tasks with a progress bar and check them off
- 🗓️ **Calendar** — week & month views with task indicators
- 📋 **Task management** — custom emojis, areas, cleaning depth, flexible repeat intervals (every N days/weeks/months/years)
- 🗂️ **Areas** — color-coded rooms/zones (Kitchen, Bathroom, etc.)
- 👥 **Multi-user households** — invite family members by email to share tasks
- 🔐 **Auth UI** — Google sign-in (UI demo) + email/password sign-up

## Getting Started

```bash
npm install
npm run dev
```

## Deploy to Vercel

```bash
npm run build
# or connect the repo directly in vercel.com
```

## Tech Stack

- React 18
- Vite
- localStorage (swap for Firebase/Supabase for real shared data)

## Roadmap

- [ ] Firebase/Supabase backend for real auth & shared data
- [ ] Push notifications for due tasks
- [ ] Assign tasks to specific household members
- [ ] Dark mode
