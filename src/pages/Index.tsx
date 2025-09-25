import { GameArena } from "@/components/GameArena";
import { ElixirBar } from "@/components/ElixirBar";
import { CardHand } from "@/components/CardHand";
import { useGameState } from "@/hooks/useGameState";

const Index = () => {
  const gameState = useGameState();

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      <header className="text-center py-4 bg-gradient-primary">
        <h1 className="text-3xl font-bold text-primary-foreground">Royal Clash Arena</h1>
      </header>

      <main className="flex-1 flex flex-col relative">
        {/* Game Arena */}
        <div className="flex-1 flex items-center justify-center p-4">
          <GameArena gameState={gameState} />
        </div>

        {/* Bottom UI - Fixed positioning for better visibility */}
        <div className="bg-card border-t-2 border-primary p-6 min-h-[120px]">
          <div className="max-w-6xl mx-auto flex items-center justify-between gap-6">
            {/* Elixir Counter */}
            <div className="flex items-center gap-4">
              <ElixirBar elixir={gameState.elixir} />
              <span className="text-2xl font-bold text-secondary animate-elixir-glow">
                {gameState.elixir}/10
              </span>
            </div>

            {/* Timer */}
            <div className="text-center">
              <div className={`text-lg font-bold ${gameState.gameStatus === 'overtime' ? 'text-destructive animate-pulse' : 'text-primary'}`}>
                {gameState.gameStatus === 'overtime' 
                  ? `${Math.floor(gameState.overtimeRemaining / 60)}:${(gameState.overtimeRemaining % 60).toString().padStart(2, '0')}`
                  : `${Math.floor(gameState.timeRemaining / 60)}:${(gameState.timeRemaining % 60).toString().padStart(2, '0')}`
                }
              </div>
              <div className="text-sm text-muted-foreground">
                {gameState.gameStatus === 'overtime' ? 'OVERTIME' : 'Time Remaining'}
              </div>
            </div>

            {/* Card Hand */}
            <CardHand
              cards={gameState.hand}
              nextCard={gameState.nextCard}
              onCardPlay={gameState.playCard}
              selectedCard={gameState.selectedCard}
            />
          </div>
        </div>
      </main>

      {/* Game Status */}
      {gameState.gameStatus !== 'playing' && gameState.gameStatus !== 'overtime' && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur flex items-center justify-center">
          <div className="bg-card p-8 rounded-lg shadow-card border border-border text-center">
            <h2 className="text-4xl font-bold mb-4 text-primary">
              {gameState.gameStatus === 'victory' ? '🎉 Victory!' : '💀 Defeat!'}
            </h2>
            <p className="text-muted-foreground mb-6">
              {gameState.gameStatus === 'victory' 
                ? 'You destroyed the enemy King Tower!' 
                : 'Your King Tower was destroyed!'}
            </p>
            <button
              onClick={gameState.resetGame}
              className="bg-gradient-primary px-6 py-3 rounded-lg text-primary-foreground font-bold hover:opacity-90 transition-opacity"
            >
              Play Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;