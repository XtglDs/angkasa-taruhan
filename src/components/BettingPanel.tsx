import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface BettingPanelProps {
  onPlaceBet: (amount: number, autoCashout?: number) => Promise<boolean>;
  onCashOut: () => Promise<number | undefined>;
  canBet: boolean;
  canCashout: boolean;
  currentBet: number;
  multiplier: number;
}

const QUICK_BETS = [2000, 10000, 50000, 200000];

export function BettingPanel({ 
  onPlaceBet, 
  onCashOut, 
  canBet, 
  canCashout, 
  currentBet, 
  multiplier 
}: BettingPanelProps) {
  const { user } = useAuth();
  const [betAmount, setBetAmount] = useState(10000);
  const [autoCashout, setAutoCashout] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handlePlaceBet = async () => {
    if (!user || betAmount <= 0) return;
    
    setIsLoading(true);
    try {
      const autoCashoutValue = autoCashout ? parseFloat(autoCashout) : undefined;
      const success = await onPlaceBet(betAmount, autoCashoutValue);
      if (success) {
        toast.success(`Taruhan dipasang: ${formatCurrency(betAmount)}`);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal memasang taruhan');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCashOut = async () => {
    setIsLoading(true);
    try {
      const payout = await onCashOut();
      if (payout) {
        toast.success(`Cashout berhasil! Menang: ${formatCurrency(payout)}`);
      }
    } catch (error) {
      toast.error('Gagal cashout');
    } finally {
      setIsLoading(false);
    }
  };

  const adjustBetAmount = (multiplier: number) => {
    setBetAmount(prev => Math.max(1000, Math.round(prev * multiplier)));
  };

  if (!user) return null;

  return (
    <Card className="bg-card/95 backdrop-blur border-border">
      <CardHeader>
        <CardTitle className="text-lg">Panel Taruhan</CardTitle>
        <div className="text-sm text-muted-foreground">
          Saldo: {formatCurrency(user.balance)}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick bet buttons */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {QUICK_BETS.map(amount => (
            <Button
              key={amount}
              variant="outline"
              size="sm"
              onClick={() => setBetAmount(amount)}
              className={betAmount === amount ? 'border-primary' : ''}
            >
              {amount >= 1000 ? `${amount/1000}K` : amount}
            </Button>
          ))}
        </div>

        {/* Custom bet amount */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Jumlah Taruhan</label>
          <div className="flex gap-2">
            <Input
              type="number"
              value={betAmount}
              onChange={(e) => setBetAmount(Number(e.target.value))}
              min={1000}
              max={user.balance}
              className="flex-1"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => adjustBetAmount(2)}
              disabled={!canBet}
            >
              2×
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => adjustBetAmount(0.5)}
              disabled={!canBet}
            >
              ½
            </Button>
          </div>
        </div>

        {/* Auto cashout */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Auto Cashout (Opsional)</label>
          <Input
            type="number"
            value={autoCashout}
            onChange={(e) => setAutoCashout(e.target.value)}
            placeholder="Contoh: 2.00"
            step="0.01"
            min="1.01"
          />
        </div>

        {/* Action buttons */}
        <div className="space-y-2">
          {currentBet > 0 ? (
            <div className="space-y-2">
              <div className="text-sm text-center">
                Taruhan aktif: {formatCurrency(currentBet)}
                <br />
                Potensi menang: {formatCurrency(Math.floor(currentBet * multiplier))}
              </div>
              <Button
                onClick={handleCashOut}
                disabled={!canCashout || isLoading}
                className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
                size="lg"
              >
                {isLoading ? 'Processing...' : `CASH OUT ${multiplier.toFixed(2)}x`}
              </Button>
            </div>
          ) : (
            <Button
              onClick={handlePlaceBet}
              disabled={!canBet || isLoading || betAmount > user.balance}
              className="w-full"
              size="lg"
            >
              {isLoading ? 'Processing...' : `PASANG TARUHAN ${formatCurrency(betAmount)}`}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}