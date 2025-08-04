import { useState, useEffect, useCallback, useRef } from 'react';
import { api, type Bet } from '@/services/api';
import { useAuth } from './useAuth';

interface GameState {
  gameId: string;
  multiplier: number;
  isActive: boolean;
  countdown: number;
  crashed: boolean;
  crashPoint: number;
  currentBet: number;
  autoCashout?: number;
  isBetting: boolean;
  canCashout: boolean;
}

export function useGameEngine() {
  const { user, updateBalance } = useAuth();
  const [gameState, setGameState] = useState<GameState>({
    gameId: '',
    multiplier: 1.0,
    isActive: false,
    countdown: 10,
    crashed: false,
    crashPoint: 0,
    currentBet: 0,
    isBetting: false,
    canCashout: false,
  });

  const intervalRef = useRef<NodeJS.Timeout>();
  const startTimeRef = useRef<number>(0);
  const gameStartRef = useRef<number>(0);

  // Generate crash point (1.00x to 100x with bias toward lower values)
  const generateCrashPoint = useCallback(() => {
    const random = Math.random();
    if (random < 0.5) return 1.0 + Math.random() * 2; // 50% chance: 1.00x - 3.00x
    if (random < 0.8) return 3.0 + Math.random() * 7; // 30% chance: 3.00x - 10.00x
    if (random < 0.95) return 10.0 + Math.random() * 40; // 15% chance: 10.00x - 50.00x
    return 50.0 + Math.random() * 50; // 5% chance: 50.00x - 100.00x
  }, []);

  const placeBet = useCallback(async (amount: number, autoCashout?: number) => {
    if (!user || gameState.isActive || gameState.isBetting) return false;

    if (user.balance < amount) {
      throw new Error('Saldo tidak mencukupi');
    }

    try {
      setGameState(prev => ({ ...prev, isBetting: true }));
      
      // Deduct bet amount from balance
      await updateBalance(user.balance - amount);
      
      setGameState(prev => ({
        ...prev,
        currentBet: amount,
        autoCashout,
        isBetting: true,
      }));

      return true;
    } catch (error) {
      setGameState(prev => ({ ...prev, isBetting: false }));
      throw error;
    }
  }, [user, gameState.isActive, gameState.isBetting, updateBalance]);

  const cashOut = useCallback(async () => {
    if (!user || !gameState.canCashout || gameState.crashed) return;

    const payout = Math.floor(gameState.currentBet * gameState.multiplier);
    
    try {
      // Record the bet with cashout
      await api.createBet({
        game_id: gameState.gameId,
        user_id: user.id,
        bet_amount: gameState.currentBet,
        auto_cashout: gameState.autoCashout,
        status: 'cashed_out',
        multiplier_result: gameState.multiplier,
        payout,
      });

      // Add payout to balance
      await updateBalance(user.balance + payout);

      setGameState(prev => ({
        ...prev,
        isBetting: false,
        canCashout: false,
        currentBet: 0,
        autoCashout: undefined,
      }));

      return payout;
    } catch (error) {
      console.error('Cashout failed:', error);
      throw error;
    }
  }, [user, gameState, updateBalance, api]);

  const startNewGame = useCallback(() => {
    const newGameId = Date.now().toString();
    const crashPoint = generateCrashPoint();
    
    setGameState(prev => ({
      ...prev,
      gameId: newGameId,
      multiplier: 1.0,
      isActive: true,
      countdown: 0,
      crashed: false,
      crashPoint,
      canCashout: prev.isBetting,
    }));

    startTimeRef.current = Date.now();
    gameStartRef.current = Date.now();
  }, [generateCrashPoint]);

  const startCountdown = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      countdown: 10,
      isActive: false,
      crashed: false,
      multiplier: 1.0,
    }));

    const countdownInterval = setInterval(() => {
      setGameState(prev => {
        if (prev.countdown <= 1) {
          clearInterval(countdownInterval);
          startNewGame();
          return prev;
        }
        return { ...prev, countdown: prev.countdown - 1 };
      });
    }, 1000);
  }, [startNewGame]);

  // Game loop
  useEffect(() => {
    if (gameState.isActive && !gameState.crashed) {
      intervalRef.current = setInterval(() => {
        const elapsed = (Date.now() - startTimeRef.current) / 1000;
        const newMultiplier = 1.0 + elapsed * 0.1; // Grows 0.1x per second

        setGameState(prev => {
          // Check for crash
          if (newMultiplier >= prev.crashPoint) {
            // Game crashed
            if (prev.isBetting && user) {
              // Record the losing bet
              api.createBet({
                game_id: prev.gameId,
                user_id: user.id,
                bet_amount: prev.currentBet,
                auto_cashout: prev.autoCashout,
                status: 'crashed',
                multiplier_result: prev.crashPoint,
                payout: 0,
              });

              // Record game history
              api.createGameHistory({
                game_id: prev.gameId,
                multiplier: prev.crashPoint,
                crash_time: Date.now() - gameStartRef.current,
                player_count: 1, // Simplified
                created_at: new Date().toISOString(),
              });
            }

            return {
              ...prev,
              crashed: true,
              multiplier: prev.crashPoint,
              canCashout: false,
              isBetting: false,
              currentBet: 0,
              autoCashout: undefined,
            };
          }

          // Check for auto-cashout
          if (prev.autoCashout && newMultiplier >= prev.autoCashout && prev.canCashout) {
            setTimeout(() => cashOut(), 0);
          }

          return {
            ...prev,
            multiplier: newMultiplier,
          };
        });
      }, 100); // Update every 100ms for smooth animation

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [gameState.isActive, gameState.crashed, user, cashOut]);

  // Start the first countdown when component mounts
  useEffect(() => {
    startCountdown();
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [startCountdown]);

  // Handle game end and start new countdown
  useEffect(() => {
    if (gameState.crashed) {
      setTimeout(() => {
        startCountdown();
      }, 3000); // Wait 3 seconds after crash before starting countdown
    }
  }, [gameState.crashed, startCountdown]);

  return {
    gameState,
    placeBet,
    cashOut,
  };
}