import type { Server, Socket } from 'socket.io';
import { MatchManager } from '../services/MatchManager.js';
import { PlatformIntegration } from '../services/PlatformIntegration.js';
import type { PlayerInput, PlayerSession } from '../types/index.js';
import { MatchState } from '../types/index.js';

export class SocketHandler {
  private io: Server;
  private matchManager: MatchManager;
  private platformIntegration: PlatformIntegration;
  private socketToPlayer: Map<string, string>; // socketId -> playerId
  private broadcastIntervals: Map<string, ReturnType<typeof setInterval>>; // matchId -> interval

  constructor(
    io: Server,
    matchManager: MatchManager,
    platformIntegration: PlatformIntegration
  ) {
    this.io = io;
    this.matchManager = matchManager;
    this.platformIntegration = platformIntegration;
    this.socketToPlayer = new Map();
    this.broadcastIntervals = new Map();
  }

  public initialize(): void {
    this.io.on('connection', (socket) => {
      console.log(`Client connected: ${socket.id}`);

      // Clean up old sockets for same player (prevents duplicates)
      this.cleanupOldSockets(socket);

      this.handleAuthentication(socket);
      this.handlePlayerReady(socket);
      this.handlePlayerInput(socket);
      this.handleDisconnect(socket);
    });
  }

  /** Remove stale socket mappings if the same player reconnects */
  private cleanupOldSockets(_socket: Socket): void {
    // Cleanup happens during authentication once we know the playerId
  }

  private handleAuthentication(socket: Socket): void {
    socket.on('authenticate', async (data: { token: string }) => {
      try {
        // Verify session with platform
        const sessionData = await this.platformIntegration.verifySession(
          data.token
        );

        if (!sessionData.valid || !sessionData.playerId) {
          socket.emit('auth_error', { message: 'Invalid session token' });
          socket.disconnect();
          return;
        }

        // Create player session
        const playerSession: PlayerSession = {
          playerId: sessionData.playerId,
          token: data.token,
          platformUserId: sessionData.platformUserId ?? '',
          betData: sessionData.betData ?? { stake: 0, currency: 'USD' },
          timestamp: Date.now(),
        };

        // Clean up player from any old/finished matches before finding a new one
        const oldMatch = this.matchManager.getMatchForPlayer(playerSession.playerId);
        if (oldMatch && (oldMatch.state === 'FINISHED' || oldMatch.state === 'WAITING')) {
          this.matchManager.removePlayerFromMatch(playerSession.playerId);
        }

        // Find or create a match
        const match = this.matchManager.findOrCreateMatch();

        // Check if this is a reconnection (player still in an active match)
        const isReconnecting = match.getPlayer(playerSession.playerId) !== undefined;

        // Add player to match (or reconnect if exists)
        const player = this.matchManager.addPlayerToMatch(
          match.id,
          playerSession,
          socket.id
        );

        if (!player) {
          socket.emit('auth_error', { message: 'Failed to join match' });
          socket.disconnect();
          return;
        }

        // Clean up old socket mappings for same player (prevents duplicates)
        for (const [oldSocketId, mappedPlayerId] of this.socketToPlayer.entries()) {
          if (mappedPlayerId === player.id && oldSocketId !== socket.id) {
            this.socketToPlayer.delete(oldSocketId);
          }
        }

        // Map socket to player
        this.socketToPlayer.set(socket.id, player.id);

        // Join socket.io room for the match
        socket.join(match.id);

        // Send success response
        socket.emit('authenticated', {
          playerId: player.id,
          matchId: match.id,
          matchState: match.state,
          players: Array.from(match.players.values()).map((p) => ({
            id: p.id,
            state: p.state,
          })),
        });

        // Only notify other players if this is a NEW player (not reconnection)
        if (!isReconnecting) {
          socket.to(match.id).emit('player_joined', {
            playerId: player.id,
            playerCount: match.players.size,
          });
        }

        console.log(
          `Player ${player.id} ${isReconnecting ? 'reconnected to' : 'authenticated and joined'} match ${match.id}`
        );
      } catch (error) {
        console.error('Authentication error:', error);
        socket.emit('auth_error', { message: 'Authentication failed' });
        socket.disconnect();
      }
    });
  }

  private handlePlayerReady(socket: Socket): void {
    socket.on('player_ready', () => {
      const playerId = this.socketToPlayer.get(socket.id);
      if (!playerId) {
        return;
      }

      const match = this.matchManager.getMatchForPlayer(playerId);
      if (!match) {
        return;
      }

      const player = match.getPlayer(playerId);
      if (player) {
        player.setReady();
        console.log(`Player ${playerId} is ready`);

        // Notify all players in the match
        this.io.to(match.id).emit('player_ready', {
          playerId: player.id,
        });

        // Check if match can start
        if (match.canStart()) {
          this.startMatch(match.id);
        }
      }
    });
  }

  private startMatch(matchId: string): void {
    const success = this.matchManager.startMatch(matchId);
    if (!success) {
      return;
    }

    const match = this.matchManager.getMatch(matchId);
    if (!match) {
      return;
    }

    // Notify all players that match is starting
    // Include seed commitment for provable fairness (players can verify after match)
    this.io.to(matchId).emit('match_starting', {
      matchId,
      startTime: match.startTime,
      config: match.config,
      seedCommitment: match.seedCommitment,
    });

    // Start broadcasting game state to clients
    this.startBroadcastLoop(matchId);
  }

  /**
   * Starts broadcasting game state to clients.
   * NOTE: Physics updates happen in the global game loop (server.ts).
   * This only handles snapshot broadcasting and match-end detection.
   */
  private startBroadcastLoop(matchId: string): void {
    const match = this.matchManager.getMatch(matchId);
    if (!match) {
      return;
    }

    const tickInterval = match.config.tickRate;
    const broadcastLoop = setInterval(() => {
      const currentMatch = this.matchManager.getMatch(matchId);
      if (!currentMatch || currentMatch.state !== MatchState.IN_PROGRESS) {
        clearInterval(broadcastLoop);
        this.broadcastIntervals.delete(matchId);

        // Handle match end
        if (currentMatch?.state === MatchState.FINISHED) {
          this.handleMatchEnd(matchId);
        }
        return;
      }

      // Broadcast game snapshot to all players in the match
      const snapshot = currentMatch.getSnapshot();
      this.io.to(matchId).emit('game_update', snapshot);
    }, tickInterval);

    this.broadcastIntervals.set(matchId, broadcastLoop);
  }

  private handlePlayerInput(socket: Socket): void {
    socket.on('player_input', (input: PlayerInput) => {
      const playerId = this.socketToPlayer.get(socket.id);
      if (!playerId) {
        return;
      }

      const match = this.matchManager.getMatchForPlayer(playerId);
      if (!match) {
        return;
      }

      // Ensure input is for the correct player
      if (input.playerId !== playerId) {
        console.warn(`Player ${playerId} sent input for ${input.playerId}`);
        return;
      }

      // Process input through physics engine
      this.matchManager.getPhysicsEngine().processPlayerInput(match, input);
    });
  }

  private handleDisconnect(socket: Socket): void {
    socket.on('disconnect', () => {
      const playerId = this.socketToPlayer.get(socket.id);
      if (!playerId) {
        return;
      }

      console.log(`Player ${playerId} disconnected`);

      const match = this.matchManager.getMatchForPlayer(playerId);
      if (match) {
        const player = match.getPlayer(playerId);

        // Notify platform
        if (player) {
          this.platformIntegration.notifyPlayerDisconnect(
            playerId,
            player.platformUserId,
            match.id
          );
        }

        // Notify other players BEFORE removal (so playerCount is accurate)
        const newCount = match.players.size - 1;
        this.io.to(match.id).emit('player_left', {
          playerId,
          playerCount: newCount,
          matchState: match.state,
        });

        // Remove player from match
        // NOTE: removePlayer() keeps player in Map during IN_PROGRESS (for reconnection)
        this.matchManager.removePlayerFromMatch(playerId);
      }

      this.socketToPlayer.delete(socket.id);
    });
  }

  private async handleMatchEnd(matchId: string): Promise<void> {
    const result = this.matchManager.calculateMatchResult(matchId);
    if (!result) {
      return;
    }

    console.log(`Match ${matchId} ended. Winner: ${result.winnerId}`);

    // Send results to all players
    this.io.to(matchId).emit('match_ended', result);

    // Send results to gambling platform
    await this.platformIntegration.sendMatchResult(result);
  }
}
