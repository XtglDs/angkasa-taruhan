import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api, type GameHistory } from '@/services/api';

export function GameStats() {
  const [gameHistory, setGameHistory] = useState<GameHistory[]>([]);

  useEffect(() => {
    const loadGameHistory = async () => {
      try {
        const history = await api.getGameHistory();
        setGameHistory(history.slice(-10).reverse()); // Last 10 games, newest first
      } catch (error) {
        console.error('Failed to load game history:', error);
      }
    };

    loadGameHistory();
    
    // Refresh every 30 seconds
    const interval = setInterval(loadGameHistory, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="bg-card/95 backdrop-blur border-border">
      <CardHeader>
        <CardTitle className="text-lg">Riwayat Game</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {gameHistory.length > 0 ? (
            gameHistory.map((game) => (
              <div
                key={game.game_id}
                className={`flex justify-between items-center p-2 rounded-md ${
                  game.multiplier < 2 
                    ? 'bg-destructive/10 text-destructive' 
                    : game.multiplier < 5
                    ? 'bg-yellow-500/10 text-yellow-500'
                    : 'bg-accent/10 text-accent'
                }`}
              >
                <span className="font-mono font-bold">
                  {game.multiplier.toFixed(2)}x
                </span>
                <span className="text-xs text-muted-foreground">
                  {new Date(game.created_at).toLocaleTimeString('id-ID', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            ))
          ) : (
            <div className="text-center text-muted-foreground py-4">
              Tidak ada riwayat game
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}