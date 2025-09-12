import { cn } from '@/lib/utils';
import type { Card } from '@/hooks/useGameState';

interface GameCardProps {
  card: Card;
  onClick: () => void;
  isPlayable: boolean;
  isPreview?: boolean;
  isSelected?: boolean;
}

export const GameCard = ({ card, onClick, isPlayable, isPreview = false, isSelected = false }: GameCardProps) => {
  const rarityColors = {
    common: 'border-muted',
    rare: 'border-secondary',
    epic: 'border-primary',
    legendary: 'border-destructive',
  };

  const rarityGlow = {
    common: '',
    rare: 'shadow-secondary/20',
    epic: 'shadow-primary/30',
    legendary: 'shadow-destructive/40',
  };

  return (
    <button
      onClick={onClick}
      disabled={!isPlayable || isPreview}
      className={cn(
        "relative bg-card border-2 rounded-lg transition-all duration-200 flex flex-col items-center justify-between p-3 shadow-card",
        isPreview ? "w-16 h-20 opacity-75 scale-75" : "w-20 h-28",
        rarityColors[card.rarity],
        rarityGlow[card.rarity],
        isPlayable && !isPreview && "hover:animate-card-hover cursor-pointer",
        !isPlayable && !isPreview && "opacity-50 cursor-not-allowed",
        isSelected && "ring-4 ring-primary ring-opacity-75 scale-110 shadow-primary/50"
      )}
    >
      {/* Card Icon */}
      <div className={cn(
        "flex items-center justify-center flex-1",
        isPreview ? "text-lg" : "text-2xl"
      )}>
        {card.icon}
      </div>

      {/* Card Name */}
      <div className={cn(
        "text-xs font-semibold text-card-foreground text-center leading-tight",
        isPreview && "text-[8px]"
      )}>
        {isPreview ? card.name.slice(0, 4) : card.name}
      </div>

      {/* Elixir Cost */}
      <div className={cn(
        "absolute -top-2 -right-2 bg-secondary text-secondary-foreground rounded-full font-bold flex items-center justify-center border-2 border-card",
        isPreview ? "w-5 h-5 text-xs" : "w-6 h-6 text-sm"
      )}>
        {card.cost}
      </div>

      {/* Rarity Indicator */}
      <div className={cn(
        "absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-8 h-1 rounded-full",
        card.rarity === 'common' && "bg-muted",
        card.rarity === 'rare' && "bg-secondary",
        card.rarity === 'epic' && "bg-primary",
        card.rarity === 'legendary' && "bg-destructive",
        isPreview && "w-4"
      )} />

      {/* Type Indicator */}
      <div className="absolute top-1 left-1 text-xs opacity-60">
        {card.type === 'spell' ? '✨' : '⚔️'}
      </div>
    </button>
  );
};