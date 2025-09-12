import { cn } from '@/lib/utils';

interface ElixirBarProps {
  elixir: number;
}

export const ElixirBar = ({ elixir }: ElixirBarProps) => {
  return (
    <div className="relative w-24 h-8 bg-muted rounded-full border-2 border-secondary overflow-hidden shadow-elixir">
      {/* Elixir Fill */}
      <div
        className="absolute bottom-0 left-0 w-full bg-gradient-elixir transition-all duration-500 ease-out rounded-full"
        style={{ height: `${(elixir / 10) * 100}%` }}
      />
      
      {/* Elixir Drops */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-bold text-secondary-foreground drop-shadow-sm">
          💧
        </span>
      </div>

      {/* Glow Effect */}
      {elixir >= 10 && (
        <div className="absolute inset-0 bg-secondary/20 rounded-full animate-elixir-glow" />
      )}
    </div>
  );
};