import { cn } from '@/lib/utils';
import type { Troop } from '@/hooks/useGameState';

interface TroopUnitProps {
  troop: Troop;
}

export const TroopUnit = ({ troop }: TroopUnitProps) => {
  const healthPercentage = (troop.health / troop.maxHealth) * 100;
  
  return (
    <div
      className={cn(
        "absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-100",
        troop.state === 'attacking' && "animate-bounce",
        troop.health <= 0 && "opacity-0"
      )}
      style={{
        left: `${troop.position.x}%`,
        top: `${troop.position.y}%`,
      }}
    >
      {/* Troop Icon */}
      <div className={cn(
        "w-8 h-8 flex items-center justify-center rounded-full border-2 text-lg relative",
        troop.team === 'player' ? 'border-team-blue bg-team-blue/20' : 'border-team-red bg-team-red/20',
        troop.state === 'attacking' && "animate-pulse"
      )}>
        {troop.icon}
        
        {/* Attack indicator */}
        {troop.state === 'attacking' && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-destructive rounded-full animate-ping"></div>
        )}
      </div>

      {/* Health Bar */}
      <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 w-10 bg-muted rounded-full h-1 border border-border">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-300",
            healthPercentage > 50 ? 'bg-accent' : 
            healthPercentage > 25 ? 'bg-secondary' : 'bg-destructive'
          )}
          style={{ width: `${Math.max(0, healthPercentage)}%` }}
        />
      </div>

      {/* Movement direction indicator */}
      {troop.state === 'moving' && (
        <div className={cn(
          "absolute -top-2 left-1/2 transform -translate-x-1/2 text-xs animate-bounce",
          troop.team === 'player' ? 'text-team-blue' : 'text-team-red'
        )}>
          ↑
        </div>
      )}
    </div>
  );
};