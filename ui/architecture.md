Multiplayer Skill-Based Dino Game – Frontend (UI) Architecture Specification
=============================================================================
Technology decision
-------------------
Given the game type (a 2D Chrome-Dino-style endless runner, multiplayer, inside an iframe), we choose:
- Phaser 3 + TypeScript + Socket.IO client
Rationale:
- Phaser is optimized for 2D arcade-style games and provides:
 - Robust game loop and timing.
 - Scene management (boot, preload, game, UI, results).
 - Sprite, animation, camera, and physics helpers.
 - Asset loading (images, atlas, sounds) and input handling.
- Using plain TypeScript with raw Canvas/WebGL would require:
 - Writing your own mini game framework (loop, scene system, etc.).
 - More boilerplate and more edge cases to handle (timing, pause/resume, scaling).
- For this project, minimising infrastructure code and focusing on gameplay and networking is more valuable.
- Phaser integrates well with TypeScript via type definitions and class-based scenes.
This document defines the UI architecture assuming Phaser 3 with TypeScript.
1. Context and runtime environment
----------------------------------
1.1 Execution context
- The game runs in a browser inside an iframe, embedded by the gambling platform.
- The iframe URL contains a launch token or the token is provided via postMessage.
- The game communicates with:
 - Game server: via Socket.IO client (WebSocket transport).
 - Platform parent window (optional): via postMessage for non-critical events (analytics, close game, etc.).
1.2 Constraints
- Must be mobile and desktop friendly.
- Must handle network latency and jitter using client-side prediction and server reconciliation.
- Must render the game at 60 FPS where possible, independent of server tick rate.
- Must display betting information (stake, potential winnings) and match state (waiting, starting, running, ended).
- Must handle multiple matches sequentially (e.g., replay or “play again”).
2. High-level frontend architecture
-----------------------------------
2.1 Layers overview
The frontend is split into logical layers:
1. Platform Integration Layer
 - Handles launch token retrieval (query string or postMessage).
 - Optionally notifies parent window about match results, errors, and exit events.
2. Networking Layer
 - Wraps Socket.IO client.
 - Manages connection / reconnection.
 - Exposes typed events and ensures all messages conform to agreed DTOs.
 - Dispatches events to game scenes (match_start, state_update, match_end, error).
3. Game Session Layer
 - Stores session-level data:
 - playerId, betAmount, currency, gameConfigId, roundId.
 - matchId, current match status.
 - Coordinates between networking and visual scenes.
 - Provides an API to start/join matches.
4. Prediction & Reconciliation Layer
 - Buffers local inputs with sequence numbers.
Applieslocalpredictiontoplayercharacter