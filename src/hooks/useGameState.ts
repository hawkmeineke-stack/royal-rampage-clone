import { useState, useEffect, useCallback } from 'react';

export interface Card {
  id: string;
  name: string;
  cost: number;
  type: 'troop' | 'spell';
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface Tower {
  id: string;
  type: 'king' | 'princess';
  health: number;
  maxHealth: number;
  team: 'player' | 'enemy';
  position: { x: number; y: number };
}

interface GameState {
  elixir: number;
  hand: Card[];
  nextCard: Card;
  deck: Card[];
  playerTowers: Tower[];
  enemyTowers: Tower[];
  gameStatus: 'playing' | 'victory' | 'defeat';
}

const CARDS: Card[] = [
  { id: 'archers', name: 'Archers', cost: 3, type: 'troop', icon: '🏹', rarity: 'common' },
  { id: 'knight', name: 'Knight', cost: 3, type: 'troop', icon: '⚔️', rarity: 'common' },
  { id: 'fireball', name: 'Fireball', cost: 4, type: 'spell', icon: '🔥', rarity: 'rare' },
  { id: 'giant', name: 'Giant', cost: 5, type: 'troop', icon: '👹', rarity: 'rare' },
  { id: 'wizard', name: 'Wizard', cost: 5, type: 'troop', icon: '🧙', rarity: 'rare' },
  { id: 'skeletons', name: 'Skeletons', cost: 1, type: 'troop', icon: '💀', rarity: 'common' },
  { id: 'arrows', name: 'Arrows', cost: 3, type: 'spell', icon: '🏹', rarity: 'common' },
  { id: 'barbarians', name: 'Barbarians', cost: 5, type: 'troop', icon: '🪓', rarity: 'common' },
];

const createInitialTowers = (): { playerTowers: Tower[], enemyTowers: Tower[] } => {
  const playerTowers: Tower[] = [
    { id: 'player-king', type: 'king', health: 2000, maxHealth: 2000, team: 'player', position: { x: 50, y: 85 } },
    { id: 'player-princess-left', type: 'princess', health: 1000, maxHealth: 1000, team: 'player', position: { x: 25, y: 75 } },
    { id: 'player-princess-right', type: 'princess', health: 1000, maxHealth: 1000, team: 'player', position: { x: 75, y: 75 } },
  ];

  const enemyTowers: Tower[] = [
    { id: 'enemy-king', type: 'king', health: 2000, maxHealth: 2000, team: 'enemy', position: { x: 50, y: 15 } },
    { id: 'enemy-princess-left', type: 'princess', health: 1000, maxHealth: 1000, team: 'enemy', position: { x: 25, y: 25 } },
    { id: 'enemy-princess-right', type: 'princess', health: 1000, maxHealth: 1000, team: 'enemy', position: { x: 75, y: 25 } },
  ];

  return { playerTowers, enemyTowers };
};

const shuffleDeck = (deck: Card[]): Card[] => {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export const useGameState = () => {
  const [gameState, setGameState] = useState<GameState>(() => {
    const { playerTowers, enemyTowers } = createInitialTowers();
    const deck = shuffleDeck([...CARDS, ...CARDS]); // Double deck for more cards
    
    return {
      elixir: 5,
      hand: deck.slice(0, 4),
      nextCard: deck[4],
      deck: deck.slice(5),
      playerTowers,
      enemyTowers,
      gameStatus: 'playing' as const,
    };
  });

  // Elixir regeneration
  useEffect(() => {
    if (gameState.gameStatus !== 'playing') return;

    const interval = setInterval(() => {
      setGameState(prev => ({
        ...prev,
        elixir: Math.min(10, prev.elixir + 1)
      }));
    }, 2800);

    return () => clearInterval(interval);
  }, [gameState.gameStatus]);

  // Check for game end conditions
  useEffect(() => {
    const playerKingTower = gameState.playerTowers.find(t => t.type === 'king');
    const enemyKingTower = gameState.enemyTowers.find(t => t.type === 'king');

    if (playerKingTower?.health <= 0) {
      setGameState(prev => ({ ...prev, gameStatus: 'defeat' }));
    } else if (enemyKingTower?.health <= 0) {
      setGameState(prev => ({ ...prev, gameStatus: 'victory' }));
    }
  }, [gameState.playerTowers, gameState.enemyTowers]);

  const playCard = useCallback((cardIndex: number) => {
    const card = gameState.hand[cardIndex];
    if (!card || gameState.elixir < card.cost || gameState.gameStatus !== 'playing') return;

    setGameState(prev => {
      const newHand = [...prev.hand];
      const newDeck = [...prev.deck];
      
      // Move next card to hand
      newHand[cardIndex] = prev.nextCard;
      
      // Get new next card from deck
      const nextCard = newDeck.length > 0 ? newDeck[0] : CARDS[Math.floor(Math.random() * CARDS.length)];
      const remainingDeck = newDeck.length > 0 ? newDeck.slice(1) : [];

      return {
        ...prev,
        elixir: prev.elixir - card.cost,
        hand: newHand,
        nextCard,
        deck: remainingDeck,
      };
    });

    // Simulate random tower damage for demonstration
    if (Math.random() > 0.5) {
      const damage = Math.floor(Math.random() * 200) + 100;
      setGameState(prev => ({
        ...prev,
        enemyTowers: prev.enemyTowers.map(tower => ({
          ...tower,
          health: Math.max(0, tower.health - damage)
        }))
      }));
    }
  }, [gameState.hand, gameState.elixir, gameState.gameStatus]);

  const resetGame = useCallback(() => {
    const { playerTowers, enemyTowers } = createInitialTowers();
    const deck = shuffleDeck([...CARDS, ...CARDS]);
    
    setGameState({
      elixir: 5,
      hand: deck.slice(0, 4),
      nextCard: deck[4],
      deck: deck.slice(5),
      playerTowers,
      enemyTowers,
      gameStatus: 'playing',
    });
  }, []);

  return {
    ...gameState,
    playCard,
    resetGame,
  };
};