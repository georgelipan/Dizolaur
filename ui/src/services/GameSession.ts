import type { SessionData, GameConfig, MatchState } from '../types';

export class GameSession {
  private static instance: GameSession;

  private sessionData: SessionData;
  private gameConfig: GameConfig | null = null;
  private matchState: MatchState | null = null;
  private playerCount: number = 0;

  private constructor() {
    // Get token from URL query params
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token') || 'demo-token-' + Date.now();

    this.sessionData = {
      token,
      betAmount: parseFloat(params.get('bet') || '10'),
      currency: params.get('currency') || 'USD',
    };
  }

  public static getInstance(): GameSession {
    if (!GameSession.instance) {
      GameSession.instance = new GameSession();
    }
    return GameSession.instance;
  }

  public getToken(): string {
    return this.sessionData.token;
  }

  public setPlayerId(playerId: string): void {
    this.sessionData.playerId = playerId;
  }

  public getPlayerId(): string | undefined {
    return this.sessionData.playerId;
  }

  public setMatchId(matchId: string): void {
    this.sessionData.matchId = matchId;
  }

  public getMatchId(): string | undefined {
    return this.sessionData.matchId;
  }

  public setGameConfig(config: GameConfig): void {
    this.gameConfig = config;
  }

  public getGameConfig(): GameConfig | null {
    return this.gameConfig;
  }

  public setMatchState(state: MatchState): void {
    this.matchState = state;
  }

  public getMatchState(): MatchState | null {
    return this.matchState;
  }

  public setPlayerCount(count: number): void {
    this.playerCount = count;
  }

  public getPlayerCount(): number {
    return this.playerCount;
  }

  public getBetAmount(): number {
    return this.sessionData.betAmount || 0;
  }

  public getCurrency(): string {
    return this.sessionData.currency || 'USD';
  }

  public reset(): void {
    this.gameConfig = null;
    this.matchState = null;
    this.playerCount = 0;
  }
}
