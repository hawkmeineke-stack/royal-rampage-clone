import { useState, useEffect, useCallback } from 'react';

export interface Card {
  id: string;
  name: string;
  cost: number;
  type: 'troop' | 'spell';
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  health?: number;
  damage?: number;
  speed?: number;
  range?: number;
}

export interface Tower {
  id: string;
  type: 'king' | 'princess';
  health: number;
  maxHealth: number;
  team: 'player' | 'enemy';
  position: { x: number; y: number };
}

export interface Troop {
  id: string;
  cardId: string;
  name: string;
  team: 'player' | 'enemy';
  position: { x: number; y: number };
  health: number;
  maxHealth: number;
  damage: number;
  speed: number;
  range: number;
  icon: string;
  target: Tower | null;
  lastAttackTime: number;
  state: 'moving' | 'attacking' | 'dead';
}

interface GameState {
  elixir: number;
  hand: Card[];
  nextCard: Card;
  deck: Card[];
  playerTowers: Tower[];
  enemyTowers: Tower[];
  troops: Troop[];
  gameStatus: 'playing' | 'victory' | 'defeat';
  selectedCard: number | null;
}

const CARDS: Card[] = [
  { id: 'archers', name: 'Archers', cost: 3, type: 'troop', icon: '🏹', rarity: 'common', health: 200, damage: 80, speed: 2, range: 4 },
  { id: 'knight', name: 'Knight', cost: 3, type: 'troop', icon: '⚔️', rarity: 'common', health: 600, damage: 120, speed: 1.5, range: 1 },
  { id: 'fireball', name: 'Fireball', cost: 4, type: 'spell', icon: '🔥', rarity: 'rare', damage: 300 },
  { id: 'giant', name: 'Giant', cost: 5, type: 'troop', icon: '👹', rarity: 'rare', health: 1200, damage: 150, speed: 0.8, range: 1 },
  { id: 'wizard', name: 'Wizard', cost: 5, type: 'troop', icon: '🧙', rarity: 'rare', health: 300, damage: 140, speed: 1.8, range: 3 },
  { id: 'skeletons', name: 'Skeletons', cost: 1, type: 'troop', icon: '💀', rarity: 'common', health: 50, damage: 60, speed: 2.5, range: 1 },
  { id: 'arrows', name: 'Arrows', cost: 3, type: 'spell', icon: '🏹', rarity: 'common', damage: 150 },
  { id: 'barbarians', name: 'Barbarians', cost: 5, type: 'troop', icon: '🪓', rarity: 'common', health: 400, damage: 110, speed: 1.6, range: 1 },
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
      troops: [],
      gameStatus: 'playing' as const,
      selectedCard: null,
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

  // Troop AI and movement
  useEffect(() => {
    if (gameState.gameStatus !== 'playing' || gameState.troops.length === 0) return;

    const interval = setInterval(() => {
      setGameState(prev => {
        const currentTime = Date.now();
        const updatedTroops = prev.troops.map(troop => {
          if (troop.health <= 0) return { ...troop, state: 'dead' as const };

          // Find target if none
          if (!troop.target) {
            const enemyTowers = troop.team === 'player' ? prev.enemyTowers : prev.playerTowers;
            const aliveTowers = enemyTowers.filter(t => t.health > 0);
            if (aliveTowers.length === 0) return troop;

            // Target closest tower
            const closest = aliveTowers.reduce((closest, tower) => {
              const distToTower = Math.sqrt(Math.pow(tower.position.x - troop.position.x, 2) + Math.pow(tower.position.y - troop.position.y, 2));
              const distToClosest = Math.sqrt(Math.pow(closest.position.x - troop.position.x, 2) + Math.pow(closest.position.y - troop.position.y, 2));
              return distToTower < distToClosest ? tower : closest;
            });
            
            return { ...troop, target: closest };
          }

          // Check if target is still alive
          const targetTower = (troop.team === 'player' ? prev.enemyTowers : prev.playerTowers).find(t => t.id === troop.target?.id);
          if (!targetTower || targetTower.health <= 0) {
            return { ...troop, target: null };
          }

          const distanceToTarget = Math.sqrt(
            Math.pow(targetTower.position.x - troop.position.x, 2) + 
            Math.pow(targetTower.position.y - troop.position.y, 2)
          );

          // Attack if in range
          if (distanceToTarget <= troop.range * 2) {
            if (currentTime - troop.lastAttackTime > 1000) { // Attack every second
              // Deal damage to target
              const damage = troop.damage;
              if (troop.team === 'player') {
                prev.enemyTowers = prev.enemyTowers.map(t => 
                  t.id === targetTower.id ? { ...t, health: Math.max(0, t.health - damage) } : t
                );
              } else {
                prev.playerTowers = prev.playerTowers.map(t => 
                  t.id === targetTower.id ? { ...t, health: Math.max(0, t.health - damage) } : t
                );
              }
              
              return { ...troop, state: 'attacking' as const, lastAttackTime: currentTime };
            }
            return { ...troop, state: 'attacking' as const };
          }

          // Move towards target
          const moveX = (targetTower.position.x - troop.position.x) / distanceToTarget * troop.speed * 0.5;
          const moveY = (targetTower.position.y - troop.position.y) / distanceToTarget * troop.speed * 0.5;

          return {
            ...troop,
            position: {
              x: troop.position.x + moveX,
              y: troop.position.y + moveY
            },
            state: 'moving' as const
          };
        }).filter(troop => troop.state !== 'dead');

        return { ...prev, troops: updatedTroops };
      });
    }, 100);

    return () => clearInterval(interval);
  }, [gameState.troops.length, gameState.gameStatus]);

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

  const selectCard = useCallback((cardIndex: number) => {
    const card = gameState.hand[cardIndex];
    if (!card || gameState.elixir < card.cost || gameState.gameStatus !== 'playing') return;

    setGameState(prev => ({
      ...prev,
      selectedCard: prev.selectedCard === cardIndex ? null : cardIndex
    }));
  }, [gameState.hand, gameState.elixir, gameState.gameStatus]);

  const placeCard = useCallback((x: number, y: number) => {
    if (gameState.selectedCard === null) return;
    
    const card = gameState.hand[gameState.selectedCard];
    if (!card || gameState.elixir < card.cost) return;

    // Only allow placement in player's half (bottom 60% of arena)
    if (y < 40) return;

    if (card.type === 'troop') {
      const troopId = `${card.id}-${Date.now()}`;
      const newTroop: Troop = {
        id: troopId,
        cardId: card.id,
        name: card.name,
        team: 'player',
        position: { x, y },
        health: card.health || 100,
        maxHealth: card.health || 100,
        damage: card.damage || 50,
        speed: card.speed || 1,
        range: card.range || 1,
        icon: card.icon,
        target: null,
        lastAttackTime: 0,
        state: 'moving'
      };

      setGameState(prev => {
        const newHand = [...prev.hand];
        const newDeck = [...prev.deck];
        
        // Move next card to hand
        newHand[gameState.selectedCard!] = prev.nextCard;
        
        // Get new next card from deck
        const nextCard = newDeck.length > 0 ? newDeck[0] : CARDS[Math.floor(Math.random() * CARDS.length)];
        const remainingDeck = newDeck.length > 0 ? newDeck.slice(1) : [];

        return {
          ...prev,
          elixir: prev.elixir - card.cost,
          hand: newHand,
          nextCard,
          deck: remainingDeck,
          troops: [...prev.troops, newTroop],
          selectedCard: null,
        };
      });
    }
  }, [gameState.selectedCard, gameState.hand, gameState.elixir]);

  const playCard = useCallback((cardIndex: number) => {
    selectCard(cardIndex);
  }, [selectCard]);

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
      troops: [],
      gameStatus: 'playing',
      selectedCard: null,
    });
  }, []);

  return {
    ...gameState,
    playCard,
    placeCard,
    resetGame,
  };
};