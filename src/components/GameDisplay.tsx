import { useEffect, useState } from 'react';
import astronautImage from '@/assets/astronaut.png';

interface GameDisplayProps {
  multiplier: number;
  isActive: boolean;
  crashed: boolean;
  countdown: number;
}

export function GameDisplay({ multiplier, isActive, crashed, countdown }: GameDisplayProps) {
  const [flashCrash, setFlashCrash] = useState(false);

  useEffect(() => {
    if (crashed) {
      setFlashCrash(true);
      setTimeout(() => setFlashCrash(false), 500);
    }
  }, [crashed]);

  return (
    <div className={`cosmic-bg relative h-64 md:h-80 lg:h-96 rounded-xl overflow-hidden border border-border ${flashCrash ? 'animate-crash-flash' : ''}`}>
      <div className="star-field"></div>
      
      {/* Countdown */}
      {!isActive && countdown > 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl md:text-8xl font-bold text-primary animate-pulse">
              {countdown}
            </div>
            <div className="text-lg md:text-xl text-muted-foreground mt-2">
              Game dimulai dalam...
            </div>
          </div>
        </div>
      )}

      {/* Game Active */}
      {isActive && (
        <>
          {/* Astronaut */}
          <div className="absolute left-4 md:left-8 bottom-4 md:bottom-8">
            <img 
              src={astronautImage}
              alt="Astronaut"
              className="astronaut w-16 h-16 md:w-24 md:h-24 lg:w-32 lg:h-32"
            />
          </div>

          {/* Multiplier Display */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className={`multiplier-text text-4xl md:text-6xl lg:text-8xl font-bold ${
                crashed ? 'text-destructive' : 'text-accent'
              }`}>
                {multiplier.toFixed(2)}x
              </div>
              {crashed && (
                <div className="text-2xl md:text-3xl font-bold text-destructive mt-4 animate-rise">
                  💥 TERTABRAK!
                </div>
              )}
            </div>
          </div>

          {/* Trajectory line */}
          {!crashed && (
            <div className="absolute bottom-8 left-8 right-8">
              <div 
                className="h-1 bg-gradient-to-r from-accent to-primary rounded-full"
                style={{
                  width: `${Math.min((multiplier - 1) * 10, 100)}%`,
                  boxShadow: '0 0 10px currentColor',
                }}
              ></div>
            </div>
          )}
        </>
      )}

      {/* Waiting for next game */}
      {!isActive && countdown === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-2xl md:text-3xl font-bold text-muted-foreground">
              Menunggu game berikutnya...
            </div>
          </div>
        </div>
      )}
    </div>
  );
}