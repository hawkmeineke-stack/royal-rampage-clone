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
  target: Tower | Troop | null;
  lastAttackTime: number;
  state: 'moving' | 'attacking' | 'dead';
}

interface GameState {
  elixir: number;
  enemyElixir: number;
  hand: Card[];
  nextCard: Card;
  deck: Card[];
  enemyHand: Card[];
  enemyNextCard: Card;
  enemyDeck: Card[];
  playerTowers: Tower[];
  enemyTowers: Tower[];
  troops: Troop[];
  gameStatus: 'playing' | 'victory' | 'defeat';
  selectedCard: number | null;
}

const CARDS: Card[] = [
  { id: 'archers', name: 'Archers', cost: 3, type: 'troop', icon: '🏹', rarity: 'common', health: 350, damage: 80, speed: 1.0, range: 4 },
  { id: 'knight', name: 'Knight', cost: 3, type: 'troop', icon: '⚔️', rarity: 'common', health: 350, damage: 120, speed: 0.8, range: 1 },
  { id: 'fireball', name: 'Fireball', cost: 4, type: 'spell', icon: '🔥', rarity: 'rare', damage: 300 },
  { id: 'giant', name: 'Giant', cost: 5, type: 'troop', icon: '👹', rarity: 'rare', health: 2000, damage: 150, speed: 0.5, range: 1 },
  { id: 'wizard', name: 'Wizard', cost: 5, type: 'troop', icon: 'ܙ', rarity: 'rare', health: 350, damage: 140, speed: 0.9, range: 3 },
  { id: 'skeletons', name: 'Skeletons', cost: 1, type: 'troop', icon: '💀', rarity: 'common', health: 65, damage: 67, speed: 1.2, range: 1 },
  { id: 'arrows', name: 'Arrows', cost: 3, type: 'spell', icon: '🏹', rarity: 'common', damage: 150 },
  { id: 'barbarians', name: 'Barbarians', cost: 5, type: 'troop', icon: '🪓', rarity: 'common', health: 400, damage: 110, speed: 0.8, range: 1 },
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
    const playerDeck = shuffleDeck([...CARDS, ...CARDS]);
    const enemyDeck = shuffleDeck([...CARDS, ...CARDS]);
    
    return {
      elixir: 5,
      enemyElixir: 5,
      hand: playerDeck.slice(0, 4),
      nextCard: playerDeck[4],
      deck: playerDeck.slice(5),
      enemyHand: enemyDeck.slice(0, 4),
      enemyNextCard: enemyDeck[4],
      enemyDeck: enemyDeck.slice(5),
      playerTowers,
      enemyTowers,
      troops: [],
      gameStatus: 'playing' as const,
      selectedCard: null,
    };
  });

  // Elixir regeneration for both players
  useEffect(() => {
    if (gameState.gameStatus !== 'playing') return;

    const interval = setInterval(() => {
      setGameState(prev => ({
        ...prev,
        elixir: Math.min(10, prev.elixir + 1),
        enemyElixir: Math.min(10, prev.enemyElixir + 1)
      }));
    }, 2800);

    return () => clearInterval(interval);
  }, [gameState.gameStatus]);

  // Enemy AI - place cards
  useEffect(() => {
    if (gameState.gameStatus !== 'playing') return;

    const interval = setInterval(() => {
      setGameState(prev => {
        // Only place cards if enemy has enough elixir and there are affordable cards
        const affordableCards = prev.enemyHand
          .map((card, index) => ({ card, index }))
          .filter(({ card }) => card.cost <= prev.enemyElixir);

        if (affordableCards.length === 0) return prev;

        // 70% chance to place a card each interval (more aggressive)
        if (Math.random() > 0.7) return prev;

        const { card, index } = affordableCards[Math.floor(Math.random() * affordableCards.length)];
        
        if (card.type === 'troop') {
          // Place in enemy territory (top 60% of arena)
          const x = 25 + Math.random() * 50; // Random x between 25-75%
          const y = 10 + Math.random() * 30; // Random y between 10-40%

          const troopId = `${card.id}-enemy-${Date.now()}`;
          const newTroop: Troop = {
            id: troopId,
            cardId: card.id,
            name: card.name,
            team: 'enemy',
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

          const newEnemyHand = [...prev.enemyHand];
          const newEnemyDeck = [...prev.enemyDeck];
          
          // Move next card to hand
          newEnemyHand[index] = prev.enemyNextCard;
          
          // Get new next card from deck
          const nextCard = newEnemyDeck.length > 0 ? newEnemyDeck[0] : CARDS[Math.floor(Math.random() * CARDS.length)];
          const remainingDeck = newEnemyDeck.length > 0 ? newEnemyDeck.slice(1) : [];

          return {
            ...prev,
            enemyElixir: prev.enemyElixir - card.cost,
            enemyHand: newEnemyHand,
            enemyNextCard: nextCard,
            enemyDeck: remainingDeck,
            troops: [...prev.troops, newTroop],
          };
        } else if (card.type === 'spell') {
          // Enemy AI uses spells on player troops or towers
          const targets = [...prev.troops.filter(t => t.team === 'player' && t.health > 0), ...prev.playerTowers.filter(t => t.health > 0)];
          if (targets.length > 0) {
            const target = targets[Math.floor(Math.random() * targets.length)];
            const { x, y } = target.position;
            const damage = card.damage || 0;
            
            // Apply spell damage
            const updatedTroops = prev.troops.map(troop => {
              const distance = Math.sqrt(Math.pow(troop.position.x - x, 2) + Math.pow(troop.position.y - y, 2));
              if (troop.team === 'player' && distance <= 8) { // Area damage radius
                return { ...troop, health: Math.max(0, troop.health - damage) };
              }
              return troop;
            });

            const updatedPlayerTowers = prev.playerTowers.map(tower => {
              const distance = Math.sqrt(Math.pow(tower.position.x - x, 2) + Math.pow(tower.position.y - y, 2));
              if (distance <= 8) {
                return { ...tower, health: Math.max(0, tower.health - damage) };
              }
              return tower;
            });

            const newEnemyHand = [...prev.enemyHand];
            const newEnemyDeck = [...prev.enemyDeck];
            
            newEnemyHand[index] = prev.enemyNextCard;
            const nextCard = newEnemyDeck.length > 0 ? newEnemyDeck[0] : CARDS[Math.floor(Math.random() * CARDS.length)];
            const remainingDeck = newEnemyDeck.length > 0 ? newEnemyDeck.slice(1) : [];

            return {
              ...prev,
              enemyElixir: prev.enemyElixir - card.cost,
              enemyHand: newEnemyHand,
              enemyNextCard: nextCard,
              enemyDeck: remainingDeck,
              troops: updatedTroops,
              playerTowers: updatedPlayerTowers,
            };
          }
        }
        
        return prev;
      });
    }, 1500); // Check every 1.5 seconds (more frequent)

    return () => clearInterval(interval);
  }, [gameState.gameStatus]);

  // Tower AI - princess towers attack troops in range
  useEffect(() => {
    if (gameState.gameStatus !== 'playing' || gameState.troops.length === 0) return;

    const interval = setInterval(() => {
      setGameState(prev => {
        const currentTime = Date.now();
        let updatedTroops = [...prev.troops];
        let updatedPlayerTowers = [...prev.playerTowers];
        let updatedEnemyTowers = [...prev.enemyTowers];

        // Princess towers attack troops in range
        const allTowers = [...prev.playerTowers, ...prev.enemyTowers].filter(t => t.health > 0 && t.type === 'princess');
        
        allTowers.forEach(tower => {
          const enemyTroops = prev.troops.filter(t => 
            t.team !== tower.team && 
            t.health > 0 && 
            t.state !== 'dead'
          );

          // Find closest enemy troop in range
          let closestTroop: Troop | null = null;
          let closestDistance = Infinity;

          enemyTroops.forEach(troop => {
            const distance = Math.sqrt(
              Math.pow(troop.position.x - tower.position.x, 2) + 
              Math.pow(troop.position.y - tower.position.y, 2)
            );
            if (distance <= 12 && distance < closestDistance) { // Tower range
              closestDistance = distance;
              closestTroop = troop;
            }
          });

          // Attack the closest troop
          if (closestTroop) {
            const damage = 150; // Tower damage
            updatedTroops = updatedTroops.map(t => 
              t.id === closestTroop!.id ? { ...t, health: Math.max(0, t.health - damage) } : t
            );
          }
        });

        // Filter out dead troops
        const aliveTroops = updatedTroops.filter(troop => troop.health > 0);

        return { 
          ...prev, 
          troops: aliveTroops,
          playerTowers: updatedPlayerTowers,
          enemyTowers: updatedEnemyTowers
        };
      });
    }, 800); // Tower attack rate

    return () => clearInterval(interval);
  }, [gameState.troops.length, gameState.gameStatus]);

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
            // Giant only targets towers, other troops can target troops first
            if (troop.cardId === 'giant') {
              // Giant only targets towers
              const enemyTowers = troop.team === 'player' ? prev.enemyTowers : prev.playerTowers;
              const aliveTowers = enemyTowers.filter(t => t.health > 0);
              
              if (aliveTowers.length > 0) {
                const closestTower = aliveTowers.reduce((closest, tower) => {
                  const distToTower = Math.sqrt(Math.pow(tower.position.x - troop.position.x, 2) + Math.pow(tower.position.y - troop.position.y, 2));
                  const distToClosest = Math.sqrt(Math.pow(closest.position.x - troop.position.x, 2) + Math.pow(closest.position.y - troop.position.y, 2));
                  return distToTower < distToClosest ? tower : closest;
                });
                return { ...troop, target: closestTower };
              }
            } else {
              // Other troops first check for enemy troops in range
              const enemyTroops = prev.troops.filter(t => 
                t.team !== troop.team && 
                t.health > 0 && 
                t.state !== 'dead'
              );

              let closestEnemy: Troop | Tower | null = null;
              let closestDistance = Infinity;

              // Check enemy troops first - prioritize closer ones
              enemyTroops.forEach(enemyTroop => {
                const distance = Math.sqrt(
                  Math.pow(enemyTroop.position.x - troop.position.x, 2) + 
                  Math.pow(enemyTroop.position.y - troop.position.y, 2)
                );
                // Troops will target other troops within a larger range and prioritize them
                if (distance < closestDistance && distance <= 15) {
                  closestDistance = distance;
                  closestEnemy = enemyTroop;
                }
              });

              // If no enemy troops in range, target towers
              if (!closestEnemy) {
                const enemyTowers = troop.team === 'player' ? prev.enemyTowers : prev.playerTowers;
                const aliveTowers = enemyTowers.filter(t => t.health > 0);
                
                if (aliveTowers.length > 0) {
                  closestEnemy = aliveTowers.reduce((closest, tower) => {
                    const distToTower = Math.sqrt(Math.pow(tower.position.x - troop.position.x, 2) + Math.pow(tower.position.y - troop.position.y, 2));
                    const distToClosest = Math.sqrt(Math.pow(closest.position.x - troop.position.x, 2) + Math.pow(closest.position.y - troop.position.y, 2));
                    return distToTower < distToClosest ? tower : closest;
                  });
                }
              }
              
              return { ...troop, target: closestEnemy };
            }
          }

          // Check if target is still alive
          let target = troop.target;
          
          // Check if target is a troop
          if (target && 'cardId' in target) {
            const targetTroop = prev.troops.find(t => t.id === target.id);
            if (!targetTroop || targetTroop.health <= 0 || targetTroop.state === 'dead') {
              return { ...troop, target: null };
            }
            target = targetTroop;
          } else if (target) {
            // Target is a tower
            const targetTower = (troop.team === 'player' ? prev.enemyTowers : prev.playerTowers).find(t => t.id === target.id);
            if (!targetTower || targetTower.health <= 0) {
              return { ...troop, target: null };
            }
            target = targetTower;
          }

          if (!target) return { ...troop, target: null };

          const distanceToTarget = Math.sqrt(
            Math.pow(target.position.x - troop.position.x, 2) + 
            Math.pow(target.position.y - troop.position.y, 2)
          );

          // Attack if in range
          if (distanceToTarget <= troop.range * 3) {
            if (currentTime - troop.lastAttackTime > 1000) { // Attack every second
              // Attack logic will be handled in a separate state update to avoid mutation
              return { ...troop, state: 'attacking' as const, lastAttackTime: currentTime, target };
            }
            return { ...troop, state: 'attacking' as const, target };
          }

          // Move towards target
          const moveX = (target.position.x - troop.position.x) / distanceToTarget * troop.speed * 0.3;
          const moveY = (target.position.y - troop.position.y) / distanceToTarget * troop.speed * 0.3;

          return {
            ...troop,
            position: {
              x: troop.position.x + moveX,
              y: troop.position.y + moveY
            },
            state: 'moving' as const,
            target
          };
        });

        // Handle combat damage in a separate pass to avoid mutation issues
        let finalTroops = [...updatedTroops];
        
        updatedTroops.forEach(attackingTroop => {
          if (attackingTroop.state === 'attacking' && attackingTroop.target && currentTime - attackingTroop.lastAttackTime >= 1000) {
            const target = attackingTroop.target;
            const damage = attackingTroop.damage;
            
            // Apply damage to target
            if ('cardId' in target) {
              // Target is a troop - find and damage it
              finalTroops = finalTroops.map(t => 
                t.id === target.id ? { ...t, health: Math.max(0, t.health - damage) } : t
              );
            } else {
              // Target is a tower
              if (attackingTroop.team === 'player') {
                prev.enemyTowers = prev.enemyTowers.map(t => 
                  t.id === target.id ? { ...t, health: Math.max(0, t.health - damage) } : t
                );
              } else {
                prev.playerTowers = prev.playerTowers.map(t => 
                  t.id === target.id ? { ...t, health: Math.max(0, t.health - damage) } : t
                );
              }
            }
          }
        });

        // Filter out dead troops
        const aliveTroops = finalTroops.filter(troop => troop.health > 0);

        return { ...prev, troops: aliveTroops };
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
    } else if (card.type === 'spell') {
      // Handle spell cards (fireball, arrows)
      const damage = card.damage || 0;
      
      setGameState(prev => {
        // Apply area damage to all enemy troops and towers within range
        const updatedTroops = prev.troops.map(troop => {
          const distance = Math.sqrt(Math.pow(troop.position.x - x, 2) + Math.pow(troop.position.y - y, 2));
          if (troop.team === 'enemy' && distance <= 8) { // Area damage radius
            return { ...troop, health: Math.max(0, troop.health - damage) };
          }
          return troop;
        });

        const updatedEnemyTowers = prev.enemyTowers.map(tower => {
          const distance = Math.sqrt(Math.pow(tower.position.x - x, 2) + Math.pow(tower.position.y - y, 2));
          if (distance <= 8) {
            return { ...tower, health: Math.max(0, tower.health - damage) };
          }
          return tower;
        });

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
          troops: updatedTroops,
          enemyTowers: updatedEnemyTowers,
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
    const playerDeck = shuffleDeck([...CARDS, ...CARDS]);
    const enemyDeck = shuffleDeck([...CARDS, ...CARDS]);
    
    setGameState({
      elixir: 5,
      enemyElixir: 5,
      hand: playerDeck.slice(0, 4),
      nextCard: playerDeck[4],
      deck: playerDeck.slice(5),
      enemyHand: enemyDeck.slice(0, 4),
      enemyNextCard: enemyDeck[4],
      enemyDeck: enemyDeck.slice(5),
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