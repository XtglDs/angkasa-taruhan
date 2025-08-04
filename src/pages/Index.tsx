import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AuthModal } from '@/components/AuthModal';
import { GameDisplay } from '@/components/GameDisplay';
import { BettingPanel } from '@/components/BettingPanel';
import { GameStats } from '@/components/GameStats';
import { useAuth } from '@/hooks/useAuth';
import { useGameEngine } from '@/hooks/useGameEngine';
import { toast } from 'sonner';

const Index = () => {
  const { user, logout } = useAuth();
  const { gameState, placeBet, cashOut } = useGameEngine();
  const [showAuthModal, setShowAuthModal] = useState(!user);

  const handleLogout = () => {
    logout();
    setShowAuthModal(true);
    toast.success('Logout berhasil');
  };

  if (!user) {
    return (
      <>
        <div className="cosmic-bg min-h-screen flex items-center justify-center p-4">
          <div className="star-field"></div>
          <div className="text-center space-y-6 z-10 relative">
            <div className="space-y-2">
              <h1 className="text-4xl md:text-6xl font-bold text-primary">
                🚀 Spaceman Crash
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground">
                Game crash multiplier terbaik di Indonesia
              </p>
            </div>
            <Button 
              onClick={() => setShowAuthModal(true)}
              size="lg"
              className="text-lg px-8 py-6"
            >
              Mulai Bermain
            </Button>
          </div>
        </div>
        <AuthModal 
          isOpen={showAuthModal} 
          onClose={() => setShowAuthModal(false)} 
        />
      </>
    );
  }

  return (
    <div className="cosmic-bg min-h-screen">
      <div className="star-field"></div>
      
      {/* Header */}
      <header className="relative z-10 flex justify-between items-center p-4 border-b border-border/20">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-primary">🚀 Spaceman</h1>
          <div className="hidden md:block text-sm text-muted-foreground">
            Selamat datang, {user.username}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Saldo</div>
            <div className="font-bold text-primary">
              {new Intl.NumberFormat('id-ID', {
                style: 'currency',
                currency: 'IDR',
                minimumFractionDigits: 0,
              }).format(user.balance)}
            </div>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            Keluar
          </Button>
        </div>
      </header>

      {/* Main Game Area */}
      <main className="relative z-10 container mx-auto p-4 space-y-6">
        {/* Game Display */}
        <GameDisplay
          multiplier={gameState.multiplier}
          isActive={gameState.isActive}
          crashed={gameState.crashed}
          countdown={gameState.countdown}
        />

        {/* Game Controls */}
        <div className="grid md:grid-cols-2 gap-6">
          <BettingPanel
            onPlaceBet={placeBet}
            onCashOut={cashOut}
            canBet={!gameState.isActive && !gameState.isBetting && gameState.countdown > 0}
            canCashout={gameState.canCashout && gameState.isActive && !gameState.crashed}
            currentBet={gameState.currentBet}
            multiplier={gameState.multiplier}
          />
          <GameStats />
        </div>
      </main>
    </div>
  );
};

export default Index;
