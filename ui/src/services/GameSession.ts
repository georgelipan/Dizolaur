import type { SessionData, GameConfig, MatchState } from '../types';

export class GameSession {
  private static instance: GameSession;

  private sessionData: SessionData;
  private gameConfig: GameConfig | null = null;
  private matchState: MatchState | null = null;
  private playerCount: number = 0;

  private constructor() {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token') || 'demo-token-' + Date.now();

    // Validate bet amount from URL (server should override this)
    const rawBet = parseFloat(params.get('bet') || '10');
    const betAmount = (Number.isFinite(rawBet) && rawBet > 0 && rawBet <= 10000) ? rawBet : 10;

    const rawCurrency = params.get('currency') || 'USD';
    // Sanitize currency to alphanumeric only (max 5 chars)
    const currency = rawCurrency.replace(/[^a-zA-Z0-9]/g, '').substring(0, 5) || 'USD';

    this.sessionData = {
      token,
      betAmount,
      currency,
    };

    // Clear token from URL to prevent leaking via Referer header
    if (params.has('token')) {
      const cleanUrl = new URL(window.location.href);
      cleanUrl.searchParams.delete('token');
      window.history.replaceState({}, '', cleanUrl.toString());
    }
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

  public setBetAmount(amount: number): void {
    this.sessionData.betAmount = amount;
  }

  public getBetAmount(): number {
    return this.sessionData.betAmount || 0;
  }

  public setCurrency(currency: string): void {
    this.sessionData.currency = currency;
  }

  public getCurrency(): string {
    return this.sessionData.currency || 'USD';
  }

  public reset(): void {
    this.gameConfig = null;
    this.matchState = null;
    this.playerCount = 0;
    this.sessionData.playerId = undefined;
    this.sessionData.matchId = undefined;
  }
}
