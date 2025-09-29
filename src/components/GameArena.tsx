import { Tower } from "./Tower";
import { TroopUnit } from "./TroopUnit";
import { TroopVisionRadius } from "./TroopVisionRadius";
import { useGameState } from "@/hooks/useGameState";

interface GameArenaProps {
  gameState: ReturnType<typeof useGameState>;
}

export const GameArena = ({ gameState }: GameArenaProps) => {
  const handleArenaClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (gameState.selectedCard === null) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    gameState.placeCard(x, y);
  };

  return (
    <div 
      className="relative w-full max-w-2xl aspect-[3/4] bg-gradient-arena rounded-lg border-4 border-arena-stone shadow-tower overflow-hidden cursor-crosshair"
      onClick={handleArenaClick}
    >
      {/* River with bridges */}
      <div className="absolute inset-x-0 top-1/2 transform -translate-y-1/2 h-16 bg-gradient-to-r from-blue-400/60 to-blue-600/60 border-y-2 border-blue-300/50">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-300/20 to-transparent"></div>
        
        {/* Bridges */}
        <div className="absolute left-[26%] top-0 w-12 h-full bg-stone-400/90 rounded-sm border border-stone-600/50 shadow-md">
          <div className="absolute inset-1 bg-stone-300/50 rounded-sm"></div>
        </div>
        <div className="absolute right-[26%] top-0 w-12 h-full bg-stone-400/90 rounded-sm border border-stone-600/50 shadow-md">
          <div className="absolute inset-1 bg-stone-300/50 rounded-sm"></div>
        </div>
      </div>

      {/* Placement Guide */}
      {gameState.selectedCard !== null && (
        <>
          {/* Show troop placement area (player's side of river, excluding river itself) */}
          {gameState.hand[gameState.selectedCard]?.type === 'troop' && (
            <>
              <div className="absolute inset-x-0 bottom-0 h-1/2 bg-team-blue/10 border-t-2 border-team-blue/30 pointer-events-none">
                <div className="absolute top-2 left-1/2 transform -translate-x-1/2 text-xs text-team-blue font-bold">
                  Click to place troop (avoid river)
                </div>
              </div>
              {/* Show river restriction overlay */}
              <div className="absolute inset-x-0 top-1/2 transform -translate-y-1/2 h-16 bg-destructive/20 border-2 border-destructive/50 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-xs text-destructive font-bold">
                  River - Use Bridges
                </div>
              </div>
            </>
          )}
          {/* Show full map for spell placement */}
          {gameState.hand[gameState.selectedCard]?.type === 'spell' && (
            <div className="absolute inset-0 bg-destructive/10 border-2 border-destructive/30 pointer-events-none">
              <div className="absolute top-2 left-1/2 transform -translate-x-1/2 text-xs text-destructive font-bold">
                Click anywhere to cast spell
              </div>
            </div>
          )}
        </>
      )}

      {/* Player Towers (Bottom) */}
      {gameState.playerTowers.map((tower) => (
        <Tower key={tower.id} tower={tower} />
      ))}

      {/* Enemy Towers (Top) */}
      {gameState.enemyTowers.map((tower) => (
        <Tower key={tower.id} tower={tower} />
      ))}

      {/* Vision Radius (only show for selected troops in debug) */}
      {gameState.troops.map((troop) => (
        <TroopVisionRadius 
          key={`vision-${troop.id}`} 
          troop={troop} 
          showVision={false} // Set to true for debugging
        />
      ))}

      {/* Troops */}
      {gameState.troops.map((troop) => (
        <TroopUnit key={troop.id} troop={troop} />
      ))}

      {/* Spell Effects */}
      {gameState.spellEffects.map((effect) => (
        <div
          key={effect.id}
          className={`absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-none ${
            effect.type === 'fireball' 
              ? 'text-6xl animate-ping' 
              : 'text-4xl animate-bounce'
          }`}
          style={{
            left: `${effect.position.x}%`,
            top: `${effect.position.y}%`,
          }}
        >
          {effect.type === 'fireball' ? '💥' : '⚡'}
        </div>
      ))}

      {/* Overtime Indicator */}
      {gameState.gameStatus === 'overtime' && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-destructive/90 text-destructive-foreground px-4 py-2 rounded-lg font-bold text-lg animate-pulse pointer-events-none">
          OVERTIME: {Math.floor(gameState.overtimeRemaining / 60)}:{(gameState.overtimeRemaining % 60).toString().padStart(2, '0')}
        </div>
      )}

      {/* Arena Decorations */}
      <div className="absolute top-4 left-4 w-8 h-8 bg-primary rounded-full animate-pulse opacity-50"></div>
      <div className="absolute top-4 right-4 w-8 h-8 bg-secondary rounded-full animate-pulse opacity-50"></div>
      <div className="absolute bottom-4 left-4 w-8 h-8 bg-primary rounded-full animate-pulse opacity-50"></div>
      <div className="absolute bottom-4 right-4 w-8 h-8 bg-secondary rounded-full animate-pulse opacity-50"></div>
    </div>
  );
};