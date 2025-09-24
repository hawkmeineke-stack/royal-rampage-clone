import type { Troop } from '@/hooks/useGameState';

interface TroopVisionRadiusProps {
  troop: Troop;
  showVision?: boolean;
}

export const TroopVisionRadius = ({ troop, showVision = false }: TroopVisionRadiusProps) => {
  if (!showVision || troop.health <= 0) return null;

  return (
    <div
      className="absolute rounded-full border border-primary/20 bg-primary/5 pointer-events-none"
      style={{
        left: `${troop.position.x}%`,
        top: `${troop.position.y}%`,
        width: `${troop.visionRadius * 2}%`,
        height: `${troop.visionRadius * 2}%`,
        transform: 'translate(-50%, -50%)',
      }}
    />
  );
};