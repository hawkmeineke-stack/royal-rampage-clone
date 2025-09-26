import { useState, useEffect } from 'react';
import type { Tower as TowerType } from '@/hooks/useGameState';
import { cn } from '@/lib/utils';

interface TowerProps {
  tower: TowerType;
}

export const Tower = ({ tower }: TowerProps) => {
  const [isShaking, setIsShaking] = useState(false);
  const healthPercentage = (tower.health / tower.maxHealth) * 100;
  const isDestroyed = tower.health <= 0;

  // Shake animation when taking damage
  useEffect(() => {
    if (tower.health < tower.maxHealth && !isDestroyed) {
      setIsShaking(true);
      const timer = setTimeout(() => setIsShaking(false), 300);
      return () => clearTimeout(timer);
    }
  }, [tower.health, isDestroyed]);

  const towerSize = tower.type === 'king' ? 'w-16 h-20' : 'w-12 h-16';
  const towerColor = tower.team === 'player' ? 'team-blue' : 'team-red';
  const isKingActivated = tower.type === 'king' && tower.isActivated;

  return (
    <div
      className={cn(
        "absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-200",
        isShaking && "animate-tower-damage",
        isDestroyed && "opacity-50 grayscale",
        isKingActivated && "animate-pulse"
      )}
      style={{
        left: `${tower.position.x}%`,
        top: `${tower.position.y}%`,
      }}
    >
      {/* Tower Structure */}
      <div className={cn(
        towerSize,
        `bg-arena-stone border-2 border-${towerColor} rounded-t-lg relative shadow-tower`,
        "flex items-center justify-center"
      )}>
        {/* Tower Icon */}
        <div className={cn(
          "text-2xl font-bold",
          tower.team === 'player' ? 'text-team-blue' : 'text-team-red'
        )}>
          {tower.type === 'king' ? '👑' : '🏰'}
        </div>

        {/* Health Bar Background */}
        <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 w-full bg-muted rounded-full h-2 border border-border">
          {/* Health Bar Fill */}
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              healthPercentage > 50 ? 'bg-accent' : 
              healthPercentage > 25 ? 'bg-secondary' : 'bg-destructive'
            )}
            style={{ width: `${Math.max(0, healthPercentage)}%` }}
          />
        </div>

        {/* Health Text */}
        <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 text-xs font-bold text-foreground whitespace-nowrap">
          {tower.health}/{tower.maxHealth}
        </div>

        {/* Crown for King Tower */}
        {tower.type === 'king' && (
          <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 text-lg animate-pulse">
            ✨
          </div>
        )}

        {/* Activation Indicator for King Tower */}
        {isKingActivated && (
          <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 text-sm animate-bounce">
            ⚡
          </div>
        )}

        {/* Destruction Effect */}
        {isDestroyed && (
          <div className="absolute inset-0 flex items-center justify-center text-xl animate-pulse">
            💥
          </div>
        )}
      </div>
    </div>
  );
};