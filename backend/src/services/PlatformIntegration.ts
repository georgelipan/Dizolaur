import type { MatchResult } from '../types/index.js';
import { hashToken } from '../utils/hash.js';

export class PlatformIntegration {
  private callbackUrl: string | null;
  private apiKey: string | null;

  constructor(callbackUrl?: string, apiKey?: string) {
    this.callbackUrl = callbackUrl ?? null;
    this.apiKey = apiKey ?? null;
  }

  /**
   * Send match results to the gambling platform for settlement
   */
  public async sendMatchResult(result: MatchResult): Promise<boolean> {
    if (!this.callbackUrl) {
      console.warn('No platform callback URL configured');
      return false;
    }

    try {
      const response = await fetch(this.callbackUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey && { 'X-API-Key': this.apiKey }),
        },
        body: JSON.stringify({
          type: 'match_result',
          data: result,
          timestamp: Date.now(),
        }),
      });

      if (!response.ok) {
        console.error(
          `Failed to send match result to platform: ${response.statusText}`
        );
        return false;
      }

      console.log(`Match result sent to platform for match ${result.matchId}`);
      return true;
    } catch (error) {
      console.error('Error sending match result to platform:', error);
      return false;
    }
  }

  /**
   * Verify session token with the gambling platform
   * This would typically validate a JWT or HMAC signature
   */
  public async verifySession(token: string): Promise<{
    valid: boolean;
    playerId?: string;
    platformUserId?: string;
    betData?: {
      stake: number;
      currency: string;
    };
  }> {
    // TODO: Implement actual token verification
    // For now, this is a placeholder that decodes a simple token format

    try {
      // In production, this would:
      // 1. Verify JWT signature or HMAC
      // 2. Check token expiration
      // 3. Validate against platform API

      // Placeholder implementation - accept any non-empty token
      if (!token || token.length < 5) {
        console.warn('Invalid token: too short');
        return { valid: false };
      }

      // Generate consistent playerId from token hash
      // Same token = same playerId (prevents duplicate players on reconnect)
      const tokenHash = hashToken(token);
      const playerId = `player_${tokenHash}`;

      console.log(`✅ Token verified: ${token.substring(0, 20)}... → ${playerId}`);
      return {
        valid: true,
        playerId,
        platformUserId: `user_${tokenHash}`,
        betData: {
          stake: 10,
          currency: 'USD',
        },
      };
    } catch (error) {
      console.error('Error verifying session:', error);
      return { valid: false };
    }
  }

  /**
   * Notify platform of player disconnect
   */
  public async notifyPlayerDisconnect(
    playerId: string,
    platformUserId: string,
    matchId: string
  ): Promise<void> {
    if (!this.callbackUrl) {
      return;
    }

    try {
      await fetch(this.callbackUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey && { 'X-API-Key': this.apiKey }),
        },
        body: JSON.stringify({
          type: 'player_disconnect',
          data: {
            playerId,
            platformUserId,
            matchId,
            timestamp: Date.now(),
          },
        }),
      });
    } catch (error) {
      console.error('Error notifying platform of disconnect:', error);
    }
  }

  public setCallbackUrl(url: string): void {
    this.callbackUrl = url;
  }

  public setApiKey(key: string): void {
    this.apiKey = key;
  }
}
