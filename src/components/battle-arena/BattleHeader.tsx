
import React from 'react';
import { PlayCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Battle } from '@/lib/supabase';
import { Problem } from '@/lib/problems';

interface BattleHeaderProps {
  battle: Battle;
  problem: Problem | null;
  timeLeft: number | null;
  isTimerRunning: boolean;
  onStartTimer: () => void;
}

const BattleHeader: React.FC<BattleHeaderProps> = ({ 
  battle, 
  problem, 
  timeLeft, 
  isTimerRunning, 
  onStartTimer 
}) => {
  const formatTime = (seconds: number | null): string => {
    if (seconds === null) return '∞';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="p-4 border-b border-icon-gray flex justify-between items-center bg-icon-dark-gray">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-bold">{problem?.title}</h1>
        <Badge>{battle?.difficulty}</Badge>
        <Badge>{battle?.battle_type}</Badge>
      </div>
      <div className="flex items-center gap-4">
        <span>Time Left: {formatTime(timeLeft)}</span>
        {!isTimerRunning && (
          <Button variant="ghost" size="icon" onClick={onStartTimer}>
            <PlayCircle className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default BattleHeader;
