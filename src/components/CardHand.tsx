import { GameCard } from './GameCard';
import type { Card } from '@/hooks/useGameState';

interface CardHandProps {
  cards: Card[];
  nextCard: Card;
  onCardPlay: (cardIndex: number) => void;
}

export const CardHand = ({ cards, nextCard, onCardPlay }: CardHandProps) => {
  return (
    <div className="flex items-center gap-4">
      {/* Hand Cards */}
      <div className="flex gap-2">
        {cards.map((card, index) => (
          <GameCard
            key={`${card.id}-${index}`}
            card={card}
            onClick={() => onCardPlay(index)}
            isPlayable={true}
          />
        ))}
      </div>

      {/* Next Card Preview */}
      <div className="relative ml-4">
        <div className="text-xs text-muted-foreground text-center mb-1">Next</div>
        <GameCard
          card={nextCard}
          onClick={() => {}}
          isPlayable={false}
          isPreview={true}
        />
      </div>
    </div>
  );
};