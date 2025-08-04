const API_BASE = 'https://api.apispreadsheets.com/data/SGIgCLGtT0ZFRSy2';

export interface User {
  id: string;
  username: string;
  password: string;
  balance: number;
  created_at: string;
}

export interface Bet {
  game_id: string;
  user_id: string;
  bet_amount: number;
  auto_cashout?: number;
  status: 'active' | 'cashed_out' | 'crashed';
  multiplier_result?: number;
  payout?: number;
}

export interface GameHistory {
  game_id: string;
  multiplier: number;
  crash_time: number;
  player_count: number;
  created_at: string;
}

export class SpreadsheetAPI {
  private async makeRequest(method: string, endpoint: string, data?: any) {
    const url = `${API_BASE}${endpoint}`;
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(url, options);
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    return response.json();
  }

  // Users
  async getUsers(): Promise<User[]> {
    const response = await this.makeRequest('GET', '/users');
    return response.data || [];
  }

  async createUser(userData: Omit<User, 'id' | 'created_at'>): Promise<User> {
    const newUser = {
      ...userData,
      id: Date.now().toString(),
      created_at: new Date().toISOString(),
    };
    await this.makeRequest('POST', '/users', newUser);
    return newUser;
  }

  async updateUserBalance(userId: string, balance: number): Promise<void> {
    await this.makeRequest('PUT', '/users', {
      condition: { id: userId },
      data: { balance }
    });
  }

  // Bets
  async getBets(): Promise<Bet[]> {
    const response = await this.makeRequest('GET', '/bets');
    return response.data || [];
  }

  async createBet(betData: Bet): Promise<void> {
    await this.makeRequest('POST', '/bets', betData);
  }

  async updateBet(gameId: string, userId: string, updates: Partial<Bet>): Promise<void> {
    await this.makeRequest('PUT', '/bets', {
      condition: { game_id: gameId, user_id: userId },
      data: updates
    });
  }

  // Game History
  async getGameHistory(): Promise<GameHistory[]> {
    const response = await this.makeRequest('GET', '/game_history');
    return response.data || [];
  }

  async createGameHistory(gameData: GameHistory): Promise<void> {
    await this.makeRequest('POST', '/game_history', gameData);
  }
}

export const api = new SpreadsheetAPI();