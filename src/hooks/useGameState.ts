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
  isActivated?: boolean; // For king towers
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
  visionRadius: number;
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
  gameStatus: 'playing' | 'victory' | 'defeat' | 'overtime';
  selectedCard: number | null;
  timeRemaining: number; // 3 minutes in seconds
  overtimeRemaining: number; // 1 minute overtime
  spellEffects: SpellEffect[];
}

export interface SpellEffect {
  id: string;
  type: 'fireball' | 'arrows';
  position: { x: number; y: number };
  startTime: number;
}

const CARDS: Card[] = [
  { id: 'archers', name: 'Archers', cost: 3, type: 'troop', icon: '🏹', rarity: 'common', health: 350, damage: 80, speed: 1.0, range: 4 },
  { id: 'knight', name: 'Knight', cost: 3, type: 'troop', icon: '⚔️', rarity: 'common', health: 350, damage: 120, speed: 0.8, range: 1 },
  { id: 'fireball', name: 'Fireball', cost: 4, type: 'spell', icon: '🔥', rarity: 'rare', damage: 300 },
  { id: 'giant', name: 'Giant', cost: 5, type: 'troop', icon: '👹', rarity: 'rare', health: 1400, damage: 150, speed: 0.5, range: 1 },
  { id: 'wizard', name: 'Wizard', cost: 5, type: 'troop', icon: '🧙', rarity: 'rare', health: 350, damage: 140, speed: 0.9, range: 3 },
  { id: 'skeletons', name: 'Skeletons', cost: 1, type: 'troop', icon: '💀', rarity: 'common', health: 65, damage: 67, speed: 1.2, range: 1 },
  { id: 'arrows', name: 'Arrows', cost: 3, type: 'spell', icon: '➹', rarity: 'common', damage: 150 },
  { id: 'barbarians', name: 'Barbarians', cost: 5, type: 'troop', icon: '🪓', rarity: 'common', health: 400, damage: 110, speed: 0.8, range: 1 },
];

// Bridge positions where troops can cross the river
const BRIDGES = [
  { x: 30, y: 50, width: 8 },
  { x: 70, y: 50, width: 8 },
];

// River bounds (y: 45-55)
const RIVER_BOUNDS = { top: 45, bottom: 55 };

const isInRiver = (x: number, y: number): boolean => {
  return y >= RIVER_BOUNDS.top && y <= RIVER_BOUNDS.bottom;
};

const canCrossRiver = (x: number, y: number): boolean => {
  if (!isInRiver(x, y)) return true;
  
  return BRIDGES.some(bridge => 
    x >= bridge.x - bridge.width/2 && 
    x <= bridge.x + bridge.width/2
  );
};

const createInitialTowers = (): { playerTowers: Tower[], enemyTowers: Tower[] } => {
  const playerTowers: Tower[] = [
    { id: 'player-king', type: 'king', health: 2000, maxHealth: 2000, team: 'player', position: { x: 50, y: 85 }, isActivated: false },
    { id: 'player-princess-left', type: 'princess', health: 1000, maxHealth: 1000, team: 'player', position: { x: 25, y: 75 } },
    { id: 'player-princess-right', type: 'princess', health: 1000, maxHealth: 1000, team: 'player', position: { x: 75, y: 75 } },
  ];

  const enemyTowers: Tower[] = [
    { id: 'enemy-king', type: 'king', health: 2000, maxHealth: 2000, team: 'enemy', position: { x: 50, y: 15 }, isActivated: false },
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

const createUniqueHand = (deck: Card[], handSize: number = 4): { hand: Card[], remainingDeck: Card[] } => {
  const hand: Card[] = [];
  const usedCardIds = new Set<string>();
  const remainingDeck = [...deck];
  
  for (let i = 0; i < handSize && remainingDeck.length > 0; i++) {
    let cardIndex = 0;
    
    // Find the first card that's not already in hand
    while (cardIndex < remainingDeck.length && usedCardIds.has(remainingDeck[cardIndex].id)) {
      cardIndex++;
    }
    
    if (cardIndex < remainingDeck.length) {
      const card = remainingDeck[cardIndex];
      hand.push(card);
      usedCardIds.add(card.id);
      remainingDeck.splice(cardIndex, 1);
    } else {
      // If we can't find unique cards, break
      break;
    }
  }
  
  return { hand, remainingDeck };
};

const getNextUniqueCard = (deck: Card[], currentHand: Card[]): { card: Card | null, remainingDeck: Card[] } => {
  const usedCardIds = new Set(currentHand.filter(c => c !== null).map(c => c.id));
  const remainingDeck = [...deck];
  
  const cardIndex = remainingDeck.findIndex(card => !usedCardIds.has(card.id));
  
  if (cardIndex >= 0) {
    const card = remainingDeck[cardIndex];
    remainingDeck.splice(cardIndex, 1);
    return { card, remainingDeck };
  }
  
  // If no unique cards in deck, return any card
  if (remainingDeck.length > 0) {
    const card = remainingDeck[0];
    remainingDeck.splice(0, 1);
    return { card, remainingDeck };
  }
  
  return { card: null, remainingDeck };
};

export const useGameState = () => {
  const [gameState, setGameState] = useState<GameState>(() => {
    const { playerTowers, enemyTowers } = createInitialTowers();
    const playerDeck = shuffleDeck([...CARDS, ...CARDS]);
    const enemyDeck = shuffleDeck([...CARDS, ...CARDS]);
    
    const playerHandData = createUniqueHand(playerDeck);
    const { card: playerNextCard, remainingDeck: playerFinalDeck } = getNextUniqueCard(playerHandData.remainingDeck, playerHandData.hand);
    
    const enemyHandData = createUniqueHand(enemyDeck);
    const { card: enemyNextCard, remainingDeck: enemyFinalDeck } = getNextUniqueCard(enemyHandData.remainingDeck, enemyHandData.hand);
    
    return {
      elixir: 5,
      enemyElixir: 5,
      hand: playerHandData.hand,
      nextCard: playerNextCard || CARDS[0],
      deck: playerFinalDeck,
      enemyHand: enemyHandData.hand,
      enemyNextCard: enemyNextCard || CARDS[0],
      enemyDeck: enemyFinalDeck,
      playerTowers,
      enemyTowers,
      troops: [],
      gameStatus: 'playing' as const,
      selectedCard: null,
      timeRemaining: 180, // 3 minutes
      overtimeRemaining: 60, // 1 minute overtime
      spellEffects: [],
    };
  });

  // Timer countdown
  useEffect(() => {
    if (gameState.gameStatus !== 'playing' || gameState.timeRemaining <= 0) return;

    const interval = setInterval(() => {
      setGameState(prev => {
        const newTime = prev.timeRemaining - 1;
        
        // Check if time is up
        if (newTime <= 0) {
          // Count destroyed towers for each team
          const playerDestroyedTowers = 3 - prev.playerTowers.filter(t => t.health > 0).length;
          const enemyDestroyedTowers = 3 - prev.enemyTowers.filter(t => t.health > 0).length;
          
          // If tower counts are different, determine winner immediately
          if (enemyDestroyedTowers > playerDestroyedTowers) {
            return { ...prev, timeRemaining: 0, gameStatus: 'victory' };
          } else if (playerDestroyedTowers > enemyDestroyedTowers) {
            return { ...prev, timeRemaining: 0, gameStatus: 'defeat' };
          } else {
            // Equal tower count - enter overtime
            return { ...prev, timeRemaining: 0, gameStatus: 'overtime', overtimeRemaining: 60 };
          }
        }
        
        return { ...prev, timeRemaining: newTime };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [gameState.gameStatus, gameState.timeRemaining]);

  // Overtime countdown
  useEffect(() => {
    if (gameState.gameStatus !== 'overtime' || gameState.overtimeRemaining <= 0) return;

    const interval = setInterval(() => {
      setGameState(prev => {
        const newOvertime = prev.overtimeRemaining - 1;
        
        // Check if overtime expired
        if (newOvertime <= 0) {
          // Find the tower with lowest health to determine loser
          const playerLowestHealth = Math.min(...prev.playerTowers.filter(t => t.health > 0).map(t => t.health));
          const enemyLowestHealth = Math.min(...prev.enemyTowers.filter(t => t.health > 0).map(t => t.health));
          
          const gameStatus = playerLowestHealth < enemyLowestHealth ? 'defeat' : 'victory';
          return { ...prev, overtimeRemaining: 0, gameStatus };
        }
        
        return { ...prev, overtimeRemaining: newOvertime };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [gameState.gameStatus, gameState.overtimeRemaining]);

  // Elixir regeneration for both players
  useEffect(() => {
    if (gameState.gameStatus !== 'playing' && gameState.gameStatus !== 'overtime') return;

    // Normal speed: 2.8 seconds, Overtime speed: 1.4 seconds (double speed)
    const elixirInterval = gameState.gameStatus === 'overtime' ? 1400 : 2800;
    
    const interval = setInterval(() => {
      setGameState(prev => ({
        ...prev,
        elixir: Math.min(10, prev.elixir + 1),
        enemyElixir: Math.min(10, prev.enemyElixir + 1)
      }));
    }, elixirInterval);

    return () => clearInterval(interval);
  }, [gameState.gameStatus]);

  // Enemy AI - place cards
  useEffect(() => {
    if (gameState.gameStatus !== 'playing' && gameState.gameStatus !== 'overtime') return;

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
            visionRadius: 12,
            icon: card.icon,
            target: null,
            lastAttackTime: 0,
            state: 'moving'
          };

          const newEnemyHand = [...prev.enemyHand];
          const newEnemyDeck = [...prev.enemyDeck];
          
          // Move next card to hand
          newEnemyHand[index] = prev.enemyNextCard;
          
          // Get new next card that's not already in updated hand
          const { card: nextCard, remainingDeck } = getNextUniqueCard(newEnemyDeck, newEnemyHand);

          return {
            ...prev,
            enemyElixir: prev.enemyElixir - card.cost,
            enemyHand: newEnemyHand,
            enemyNextCard: nextCard,
            enemyDeck: remainingDeck,
            troops: [...prev.troops, newTroop],
          };
        } else if (card.type === 'spell') {
          // Enemy AI uses spells on player troops or towers (avoid player king tower)
          const playerTroops = prev.troops.filter(t => t.team === 'player' && t.health > 0);
          const playerTowers = prev.playerTowers.filter(t => t.health > 0 && !(t.type === 'king')); // Exclude king tower
          const targets = [...playerTroops, ...playerTowers];
          if (targets.length > 0) {
            const target = targets[Math.floor(Math.random() * targets.length)];
            const { x, y } = target.position;
            const damage = card.damage || 0;
            
            // Add spell effect for enemy AI
            const spellEffect: SpellEffect = {
              id: `enemy-spell-${Date.now()}`,
              type: card.id as 'fireball' | 'arrows',
              position: { x, y },
              startTime: Date.now()
            };
            
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
                // Reduce spell damage to towers
                const towerDamage = card.id === 'fireball' ? 90 : card.id === 'arrows' ? 50 : damage;
                return { ...tower, health: Math.max(0, tower.health - towerDamage) };
              }
              return tower;
            });

            const newEnemyHand = [...prev.enemyHand];
            const newEnemyDeck = [...prev.enemyDeck];
            
            newEnemyHand[index] = prev.enemyNextCard;
            const { card: nextCard, remainingDeck } = getNextUniqueCard(newEnemyDeck, newEnemyHand);

            return {
              ...prev,
              enemyElixir: prev.enemyElixir - card.cost,
              enemyHand: newEnemyHand,
              enemyNextCard: nextCard,
              enemyDeck: remainingDeck,
              troops: updatedTroops,
              playerTowers: updatedPlayerTowers,
              spellEffects: [...prev.spellEffects, spellEffect],
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
    if ((gameState.gameStatus !== 'playing' && gameState.gameStatus !== 'overtime') || gameState.troops.length === 0) return;

    const interval = setInterval(() => {
      setGameState(prev => {
        const currentTime = Date.now();
        let updatedTroops = [...prev.troops];

        // Update king tower activation status
        const updatedPlayerTowers = prev.playerTowers.map(tower => {
          if (tower.type === 'king') {
            const princessTowersAlive = prev.playerTowers.filter(t => t.health > 0 && t.type === 'princess').length;
            const isActivated = princessTowersAlive < 2 || tower.health < tower.maxHealth;
            return { ...tower, isActivated };
          }
          return tower;
        });
        
        const updatedEnemyTowers = prev.enemyTowers.map(tower => {
          if (tower.type === 'king') {
            const princessTowersAlive = prev.enemyTowers.filter(t => t.health > 0 && t.type === 'princess').length;
            const isActivated = princessTowersAlive < 2 || tower.health < tower.maxHealth;
            return { ...tower, isActivated };
          }
          return tower;
        });

        // Princess towers attack troops in range, King towers attack when activated
        const playerPrincessTowers = updatedPlayerTowers.filter(t => t.health > 0 && t.type === 'princess');
        const enemyPrincessTowers = updatedEnemyTowers.filter(t => t.health > 0 && t.type === 'princess');
        
        // Get attacking towers (princess + activated king towers)
        const attackingTowers = [
          ...playerPrincessTowers,
          ...enemyPrincessTowers
        ];
        
        // Add king towers if they are activated
        const playerKingTower = updatedPlayerTowers.find(t => t.health > 0 && t.type === 'king');
        const enemyKingTower = updatedEnemyTowers.find(t => t.health > 0 && t.type === 'king');
        
        if (playerKingTower && playerKingTower.isActivated) {
          attackingTowers.push(playerKingTower);
        }
        if (enemyKingTower && enemyKingTower.isActivated) {
          attackingTowers.push(enemyKingTower);
        }
        
        attackingTowers.forEach(tower => {
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
            
            // King towers have extended range to hit troops attacking princess towers
            let towerRange = 12; // Default range for princess towers
            if (tower.type === 'king' && tower.isActivated) {
              towerRange = 18; // Extended range for king towers
              
              // King towers cannot hit ranged troops (archers, wizards) unless they're very close
              if ((troop.cardId === 'archers' || troop.cardId === 'wizard') && distance > 12) {
                return; // Skip ranged troops beyond normal range
              }
            }
            
            if (distance <= towerRange && distance < closestDistance) {
              closestDistance = distance;
              closestTroop = troop;
            }
          });

          // Attack the closest troop
          if (closestTroop) {
            const damage = 50; // Reduced tower damage
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
    if ((gameState.gameStatus !== 'playing' && gameState.gameStatus !== 'overtime') || gameState.troops.length === 0) return;

    const interval = setInterval(() => {
      setGameState(prev => {
        const currentTime = Date.now();
        const updatedTroops = prev.troops.map(troop => {
          if (troop.health <= 0) return { ...troop, state: 'dead' as const };

          // Vision-based targeting system
          if (!troop.target) {
            // Check vision radius for enemy troops first (unless already attacking tower)
            const enemyTroops = prev.troops.filter(t => 
              t.team !== troop.team && 
              t.health > 0 && 
              t.state !== 'dead'
            );

            // Check if any enemy is in vision radius
            const troopsInVision = enemyTroops.filter(enemyTroop => {
              const distance = Math.sqrt(
                Math.pow(enemyTroop.position.x - troop.position.x, 2) + 
                Math.pow(enemyTroop.position.y - troop.position.y, 2)
              );
              return distance <= troop.visionRadius;
            });

            if (troopsInVision.length > 0 && troop.cardId !== 'giant') {
              // Target closest troop in vision
              const closestTroop = troopsInVision.reduce((closest, enemyTroop) => {
                const distToTroop = Math.sqrt(Math.pow(enemyTroop.position.x - troop.position.x, 2) + Math.pow(enemyTroop.position.y - troop.position.y, 2));
                const distToClosest = Math.sqrt(Math.pow(closest.position.x - troop.position.x, 2) + Math.pow(closest.position.y - troop.position.y, 2));
                return distToTroop < distToClosest ? enemyTroop : closest;
              });
              return { ...troop, target: closestTroop };
            } else {
              // Target closest tower if no troops in vision or if Giant
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
            }
          } else {
            // If already has a target, check if new enemy enters vision radius (unless attacking tower)
            if (!('cardId' in troop.target) && troop.cardId !== 'giant') {
              // Currently targeting a tower - check for enemy troops in vision
              const enemyTroops = prev.troops.filter(t => 
                t.team !== troop.team && 
                t.health > 0 && 
                t.state !== 'dead'
              );

              const troopsInVision = enemyTroops.filter(enemyTroop => {
                const distance = Math.sqrt(
                  Math.pow(enemyTroop.position.x - troop.position.x, 2) + 
                  Math.pow(enemyTroop.position.y - troop.position.y, 2)
                );
                return distance <= troop.visionRadius;
              });

              // If enemy troop enters vision while moving to tower, switch target
              if (troopsInVision.length > 0) {
                const closestTroop = troopsInVision.reduce((closest, enemyTroop) => {
                  const distToTroop = Math.sqrt(Math.pow(enemyTroop.position.x - troop.position.x, 2) + Math.pow(enemyTroop.position.y - troop.position.y, 2));
                  const distToClosest = Math.sqrt(Math.pow(closest.position.x - troop.position.x, 2) + Math.pow(closest.position.y - troop.position.y, 2));
                  return distToTroop < distToClosest ? enemyTroop : closest;
                });
                return { ...troop, target: closestTroop };
              }
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

          // Move towards target with improved bridge crossing
          const moveX = (target.position.x - troop.position.x) / distanceToTarget * troop.speed * 0.3;
          const moveY = (target.position.y - troop.position.y) / distanceToTarget * troop.speed * 0.3;

          let newX = troop.position.x + moveX;
          let newY = troop.position.y + moveY;

          // Check if troop needs to cross river
          const currentSide = troop.position.y < 50 ? 'top' : 'bottom';
          const targetSide = target.position.y < 50 ? 'top' : 'bottom';
          const needsToCrossRiver = currentSide !== targetSide;

          if (needsToCrossRiver && isInRiver(newX, newY) && !canCrossRiver(newX, newY)) {
            // Find nearest bridge and move towards it
            const nearestBridge = BRIDGES.reduce((closest, bridge) => {
              const distToBridge = Math.sqrt(Math.pow(bridge.x - troop.position.x, 2) + Math.pow(50 - troop.position.y, 2));
              const distToClosest = Math.sqrt(Math.pow(closest.x - troop.position.x, 2) + Math.pow(50 - troop.position.y, 2));
              return distToBridge < distToClosest ? bridge : closest;
            });

            // Move towards bridge center
            const bridgeY = 50; // River center
            const distanceToBridge = Math.sqrt(Math.pow(nearestBridge.x - troop.position.x, 2) + Math.pow(bridgeY - troop.position.y, 2));
            
            if (distanceToBridge > 1) {
              newX = troop.position.x + (nearestBridge.x - troop.position.x) / distanceToBridge * troop.speed * 0.3;
              newY = troop.position.y + (bridgeY - troop.position.y) / distanceToBridge * troop.speed * 0.3;
            } else {
              // Close to bridge, move towards target
              newX = troop.position.x + moveX;
              newY = troop.position.y + moveY;
            }
          } else if (needsToCrossRiver && Math.abs(troop.position.y - 50) < 8) {
            // Already near river, find closest bridge entry point
            const nearestBridge = BRIDGES.reduce((closest, bridge) => {
              const distToBridge = Math.abs(bridge.x - troop.position.x);
              const distToClosest = Math.abs(closest.x - troop.position.x);
              return distToBridge < distToClosest ? bridge : closest;
            });

            // Move horizontally to align with bridge if not already aligned
            if (Math.abs(troop.position.x - nearestBridge.x) > 2) {
              newX = troop.position.x + (nearestBridge.x - troop.position.x) * 0.5;
              newY = troop.position.y; // Stay at current Y until aligned
            } else {
              // Aligned with bridge, proceed with normal movement
              newX = troop.position.x + moveX;
              newY = troop.position.y + moveY;
            }
          }

          // Final check: don't allow movement into invalid river positions
          if (isInRiver(newX, newY) && !canCrossRiver(newX, newY)) {
            return { ...troop, target }; // Stay in place if can't move
          }

          return {
            ...troop,
            position: { x: newX, y: newY },
            state: 'moving' as const,
            target
          };
        });

        // Handle combat damage in a separate pass to avoid mutation issues
        let finalTroops = [...updatedTroops];
        // Create new tower arrays so effects detect changes (no in-place mutation)
        let updatedPlayerTowers = [...prev.playerTowers];
        let updatedEnemyTowers = [...prev.enemyTowers];
        
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
                updatedEnemyTowers = updatedEnemyTowers.map(t => 
                  t.id === target.id ? { ...t, health: Math.max(0, t.health - damage) } : t
                );
              } else {
                updatedPlayerTowers = updatedPlayerTowers.map(t => 
                  t.id === target.id ? { ...t, health: Math.max(0, t.health - damage) } : t
                );
              }
            }
          }
        });

        // Filter out dead troops
        const aliveTroops = finalTroops.filter(troop => troop.health > 0);

        return { ...prev, troops: aliveTroops, playerTowers: updatedPlayerTowers, enemyTowers: updatedEnemyTowers };
      });
    }, 100);

    return () => clearInterval(interval);
  }, [gameState.troops.length, gameState.gameStatus]);

  // Track tower counts when overtime starts
  const [overtimeTowerCounts, setOvertimeTowerCounts] = useState<{playerCount: number, enemyCount: number} | null>(null);

  // Set initial tower counts when overtime starts
  useEffect(() => {
    if (gameState.gameStatus === 'overtime' && overtimeTowerCounts === null) {
      setOvertimeTowerCounts({
        playerCount: gameState.playerTowers.filter(t => t.health > 0).length,
        enemyCount: gameState.enemyTowers.filter(t => t.health > 0).length
      });
    } else if (gameState.gameStatus !== 'overtime' && overtimeTowerCounts !== null) {
      setOvertimeTowerCounts(null);
    }
  }, [gameState.gameStatus]);

  // Check for game end conditions
  // OVERTIME ONLY ENDS WHEN: (1) timer expires, OR (2) any tower is destroyed
  useEffect(() => {
    // Only check victory/defeat conditions if not already ended
    if (gameState.gameStatus === 'victory' || gameState.gameStatus === 'defeat') return;

    const playerKingTower = gameState.playerTowers.find(t => t.type === 'king');
    const enemyKingTower = gameState.enemyTowers.find(t => t.type === 'king');

    // King tower destruction always ends the game (both normal and overtime)
    if (playerKingTower?.health <= 0) {
      setGameState(prev => ({ ...prev, gameStatus: 'defeat' }));
    } else if (enemyKingTower?.health <= 0) {
      setGameState(prev => ({ ...prev, gameStatus: 'victory' }));
    } else if (gameState.gameStatus === 'overtime' && overtimeTowerCounts) {
      // In overtime, ANY tower destruction wins immediately (instant death)
      const currentPlayerActiveTowers = gameState.playerTowers.filter(t => t.health > 0).length;
      const currentEnemyActiveTowers = gameState.enemyTowers.filter(t => t.health > 0).length;
      
      if (currentPlayerActiveTowers < overtimeTowerCounts.playerCount) {
        setGameState(prev => ({ ...prev, gameStatus: 'defeat' }));
      } else if (currentEnemyActiveTowers < overtimeTowerCounts.enemyCount) {
        setGameState(prev => ({ ...prev, gameStatus: 'victory' }));
      }
    }
  }, [gameState.playerTowers, gameState.enemyTowers, gameState.gameStatus, overtimeTowerCounts]);

  // Clean up expired spell effects
  useEffect(() => {
    const interval = setInterval(() => {
      setGameState(prev => ({
        ...prev,
        spellEffects: prev.spellEffects.filter(effect => 
          Date.now() - effect.startTime < 1000 // Remove after 1 second
        )
      }));
    }, 100);

    return () => clearInterval(interval);
  }, []);

  const selectCard = useCallback((cardIndex: number) => {
    const card = gameState.hand[cardIndex];
    if (!card || gameState.elixir < card.cost || (gameState.gameStatus !== 'playing' && gameState.gameStatus !== 'overtime')) return;

    setGameState(prev => ({
      ...prev,
      selectedCard: prev.selectedCard === cardIndex ? null : cardIndex
    }));
  }, [gameState.hand, gameState.elixir, gameState.gameStatus]);

  const placeCard = useCallback((x: number, y: number) => {
    if (gameState.selectedCard === null) return;
    
    const card = gameState.hand[gameState.selectedCard];
    if (!card || gameState.elixir < card.cost) return;

    if (card.type === 'troop') {
      // Only allow troop placement on player's side of the river (below 50%) and not in river
      if (y <= 50 || isInRiver(x, y)) return;

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
        visionRadius: 12,
        icon: card.icon,
        target: null,
        lastAttackTime: 0,
        state: 'moving'
      };

      setGameState(prev => {
        const newHand = [...prev.hand];
        
        // Replace played card with nextCard
        newHand[gameState.selectedCard!] = prev.nextCard;
        
        // Get new next card that's not already in updated hand
        const { card: nextCard, remainingDeck } = getNextUniqueCard(prev.deck, newHand);

        return {
          ...prev,
          elixir: prev.elixir - card.cost,
          hand: newHand,
          nextCard: nextCard || CARDS[Math.floor(Math.random() * CARDS.length)],
          deck: remainingDeck,
          troops: [...prev.troops, newTroop],
          selectedCard: null,
        };
      });
    } else if (card.type === 'spell') {
      // Spells can be cast anywhere on the map (no restrictions)
      const damage = card.damage || 0;
      
      // Add spell effect for animation
      const spellEffect: SpellEffect = {
        id: `spell-${Date.now()}`,
        type: card.id as 'fireball' | 'arrows',
        position: { x, y },
        startTime: Date.now()
      };
      
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
            // Reduce spell damage to towers
            const towerDamage = card.id === 'fireball' ? 90 : card.id === 'arrows' ? 50 : damage;
            return { ...tower, health: Math.max(0, tower.health - towerDamage) };
          }
          return tower;
        });

        const newHand = [...prev.hand];
        
        // Replace played card with nextCard  
        newHand[gameState.selectedCard!] = prev.nextCard;
        
        // Get new next card that's not already in updated hand
        const { card: nextCard, remainingDeck } = getNextUniqueCard(prev.deck, newHand);

        return {
          ...prev,
          elixir: prev.elixir - card.cost,
          hand: newHand,
          nextCard: nextCard || CARDS[Math.floor(Math.random() * CARDS.length)],
          deck: remainingDeck,
          troops: updatedTroops,
          enemyTowers: updatedEnemyTowers,
          selectedCard: null,
          spellEffects: [...prev.spellEffects, spellEffect],
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

    const playerHandData = createUniqueHand(playerDeck);
    const { card: playerNextCard, remainingDeck: playerFinalDeck } = getNextUniqueCard(playerHandData.remainingDeck, playerHandData.hand);
    
    const enemyHandData = createUniqueHand(enemyDeck);
    const { card: enemyNextCard, remainingDeck: enemyFinalDeck } = getNextUniqueCard(enemyHandData.remainingDeck, enemyHandData.hand);

    setGameState({
      elixir: 5,
      enemyElixir: 5,
      hand: playerHandData.hand,
      nextCard: playerNextCard || CARDS[0],
      deck: playerFinalDeck,
      enemyHand: enemyHandData.hand,
      enemyNextCard: enemyNextCard || CARDS[0],
      enemyDeck: enemyFinalDeck,
      playerTowers,
      enemyTowers,
      troops: [],
      gameStatus: 'playing',
      selectedCard: null,
      timeRemaining: 180, // 3 minutes
      overtimeRemaining: 60, // 1 minute overtime
      spellEffects: [],
    });
  }, []);

  return {
    ...gameState,
    playCard,
    placeCard,
    resetGame,
  };
};