Multiplayer Skill-Based Dino Game – Backend Architecture Specification
======================================================================
Target stack
------------
- Runtime: Node.js (LTS)
- Language: TypeScript
- Realtime transport: Socket.IO over WebSocket (no Express)
- Persistence: In-memory for live matches; external gambling platform owns accounts / balances
- Client engine: Phaser (front-end, outside of this document but relevant for protocol design)
- Deployment: Multiple stateless game server instances behind load balancer
1. Problem statement and constraints
-----------------------------------
This document describes the backend architecture for a real-time, multiplayer, skill-based “Chrome Dino”-style game usedKey requirements:
1. The game is launched from a gambling platform via a link/button. The platform:
 - Authenticates the user.
 - Handles bet selection and placement.
 - Generates a session/token or signed payload for the game iframe.
2. The game runs inside an iframe and communicates with the backend (game server) via Socket.IO.
3. Multiple players join matches and compete in the same game instance.
4. The backend is authoritative: it computes physics, collisions, scores, and outcomes.
5. The backend calculates the monetary winnings for the winning player(s) based on data provided by the platform.
6. The frontend uses client-side prediction for player movement to compensate for latency.
 The backend supports this via deterministic game state, reconciliation, and timestamped events.
7. The backend is a pure “game engine service”:
 - It does NOT manage user balances or final settlement in the database.
 - Instead, it exposes well-defined APIs/event payloads for the platform to perform settlement.
8. The system must be horizontally scalable, with multiple stateless game server instances.
2. High-level architecture
--------------------------
2.1 Components
- Game Client (Phaser, in iframe)
 - Render loop, input capture (jump events).
 - Client-side prediction & reconciliation based on authoritative snapshots.
 - Connects to game server via Socket.IO.
- Game Server (Node.js + TypeScript + Socket.IO)
 - Authoritative game simulation:
 - Dino physics, obstacles, collisions, scoring.
 - Match lifecycle:
 - Match creation, player join/leave, match start, match end.
 - Latency handling:
 - Timestamped player inputs.
 - Fixed-timestep simulation.
 - State snapshots broadcast to clients.
 - Result calculation:
 - Determine winner(s).
 - Compute winnings based on bet configuration received from platform.
 - Platform integration:
 - Communicates match outcome to gambling platform via HTTP or message queue (MQ).
- Gambling Platform Backend (external system)
 - User authentication and session management.
 - Bet selection and validation (stake, odds, game configuration).
 - Wallet management and payments.
 - Game history and regulatory auditing.
 - It passes a signed payload to the game via the iframe URL (e.g. JWT or HMAC signed query).
