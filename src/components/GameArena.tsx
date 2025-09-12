import { Tower } from "./Tower";
import { useGameState } from "@/hooks/useGameState";

interface GameArenaProps {
  gameState: ReturnType<typeof useGameState>;
}

export const GameArena = ({ gameState }: GameArenaProps) => {
  return (
    <div className="relative w-full max-w-2xl aspect-[3/4] bg-gradient-arena rounded-lg border-4 border-arena-stone shadow-tower overflow-hidden">
      {/* River with bridges */}
      <div className="absolute inset-x-0 top-1/2 transform -translate-y-1/2 h-16 bg-arena-water opacity-80">
        <div className="absolute inset-0 bg-gradient-to-r from-arena-water/50 to-arena-water"></div>
        
        {/* Bridges */}
        <div className="absolute left-1/4 top-0 w-16 h-full bg-arena-stone rounded-sm border border-arena-stone/50"></div>
        <div className="absolute right-1/4 top-0 w-16 h-full bg-arena-stone rounded-sm border border-arena-stone/50"></div>
      </div>

      {/* Player Towers (Bottom) */}
      {gameState.playerTowers.map((tower) => (
        <Tower key={tower.id} tower={tower} />
      ))}

      {/* Enemy Towers (Top) */}
      {gameState.enemyTowers.map((tower) => (
        <Tower key={tower.id} tower={tower} />
      ))}

      {/* Arena Decorations */}
      <div className="absolute top-4 left-4 w-8 h-8 bg-primary rounded-full animate-pulse opacity-50"></div>
      <div className="absolute top-4 right-4 w-8 h-8 bg-secondary rounded-full animate-pulse opacity-50"></div>
      <div className="absolute bottom-4 left-4 w-8 h-8 bg-primary rounded-full animate-pulse opacity-50"></div>
      <div className="absolute bottom-4 right-4 w-8 h-8 bg-secondary rounded-full animate-pulse opacity-50"></div>
    </div>
  );
};