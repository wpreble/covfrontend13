# Replit.md

## Overview

This is a Vue 3 frontend application for a Solana blockchain-based platform called "Covenant Vault." The app provides a dashboard for managing AI agents, payments, compute resources, and building — all tied to Solana wallet authentication. The frontend communicates with a backend API server (expected on port 3000) and interacts with the Solana blockchain via Anchor IDL for on-chain program calls.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: Vue 3 with Composition API, built with Vite 7
- **State Management**: Pinia stores (currently a placeholder counter store exists)
- **Routing**: Vue Router 4 with hash/web history, includes route guards for authentication
- **Styling**: Plain CSS with CSS custom properties (dark theme, no UI framework)
- **TypeScript**: Full TypeScript support with `vue-tsc` for type checking
- **Dev Tools**: Vite plugin for Vue DevTools integration

### Authentication
- JWT-based authentication stored in `localStorage`
- Route guard checks for JWT presence before allowing access to protected routes (`/agents`, `/payments`, `/compute`, `/build`)
- Unauthenticated users are redirected to `/sign` (the Auth view)
- Auth-related API calls are proxied to the backend at `/auth` and `/protected`

### Solana Blockchain Integration
- **Anchor Framework** (`@coral-xyz/anchor` v0.32): Used for interacting with the on-chain Covenant Vault program
- **Solana Web3.js** (v1): Core Solana SDK for wallet connections and transaction handling
- **Program Address**: `BUam43b33sLJvKqb3u7jSwUb3JisLDzAYDN4ECNmsGSU`
- **IDL**: Located at `web/src/idl/covenant_vault.json`, defines on-chain instructions like `charge_user` with PDA-based config accounts
- **bs58**: Used for base58 encoding/decoding (common in Solana for keypairs/signatures)

### API Proxy Configuration
The Vite dev server proxies these paths to the backend at `http://localhost:3000`:
- `/agents` — Agent management endpoints
- `/solana` — Solana-related backend operations
- `/auth` — Authentication endpoints
- `/user` — User management endpoints
- `/protected` — Protected/authenticated endpoints

### Views / Pages
- **Auth** (`/sign`) — Login/wallet authentication page
- **Agents** (`/agents`) — Agent management with Covenant-themed agents (Covenant Claw CMO, Growth Hacker, Sentinel, Micro Chat, Ops Automator). FAB button opens Deploy Agent modal with template selection, conduit code upload, compute selection, and endpoint generation.
- **Payments** (`/payments`) — Payment/billing interface
- **Compute** (`/compute`) — Compute resource management with Deploy/Command tabs
- **CovenantClaw** (`/covenantclaw`) — Autonomous AI assistant with 3-phase flow (Welcome, Onboarding, Active chat) and Monitor tab with real-time system logs
- Legacy `/command` redirects to `/compute`, `/build` redirects to `/covenantclaw`

### Development Server
- Runs on port **5000** with host `0.0.0.0` (accessible externally)
- All hosts allowed (`allowedHosts: true`)

### Project Structure
```
web/
├── src/
│   ├── main.ts          # App entry point (Vue + Pinia + Router)
│   ├── App.vue           # Root component
│   ├── assets/main.css   # Global dark-theme styles
│   ├── idl/              # Solana Anchor IDL definitions
│   ├── router/index.ts   # Route definitions with auth guards
│   ├── stores/           # Pinia state stores
│   ├── components/       # AgentCreate, AgentDetail, AgentEditModal, Header
│   └── views/            # Page components (Agents, Payments, Compute, CovenantClaw, Auth)
├── index.html            # HTML entry point
├── vite.config.ts        # Vite configuration with proxy setup
└── package.json          # Dependencies and scripts
```

### Backend Expectations
The frontend expects a separate backend server running on port 3000. This backend is not included in the repository but handles:
- User authentication and JWT issuance
- Agent CRUD operations
- Solana transaction preparation/submission
- User data management

## External Dependencies

### Blockchain
- **Solana Mainnet/Devnet**: On-chain program interaction via `@solana/web3.js` and `@coral-xyz/anchor`
- **Covenant Vault Program**: Custom Solana program at address `BUam43b33sLJvKqb3u7jSwUb3JisLDzAYDN4ECNmsGSU`

### Backend API
- Expected at `http://localhost:3000` — handles auth, user data, agent management, and Solana operations
- No database is directly used by the frontend; all persistence is handled by the backend

### NPM Packages (Key Runtime)
- `vue` (3.5) — UI framework
- `pinia` (3.0) — State management
- `vue-router` (4.6) — Client-side routing
- `@coral-xyz/anchor` (0.32) — Solana Anchor client
- `@solana/web3.js` (1.98) — Solana blockchain SDK
- `bs58` (6.0) — Base58 encoding for Solana keys/signatures