import { useEffect, useState } from 'react';
import { differenceInSeconds } from 'date-fns';
import { Button } from '@/components/ui/button';

interface ActiveTimerProps {
  timer: any;
  onStop: () => void;
  isLoading?: boolean;
}

export function ActiveTimer({ timer, onStop, isLoading }: ActiveTimerProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!timer?.startedAt) return;
    
    const startTime = new Date(timer.startedAt);
    const interval = setInterval(() => {
      setElapsed(differenceInSeconds(new Date(), startTime));
    }, 1000);
    
    setElapsed(differenceInSeconds(new Date(), startTime));
    
    return () => clearInterval(interval);
  }, [timer?.startedAt]);

  const formatElapsedHero = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    const h = hours.toString().padStart(2, '0');
    const m = minutes.toString().padStart(2, '0');
    const s = seconds.toString().padStart(2, '0');
    
    return `${h}:${m}:${s}`;
  };

  if (!timer) return null;

  return (
    <div className="flex flex-col items-center justify-center gap-4 bg-card border rounded-lg p-8 w-full">
      <div className="font-mono font-bold text-5xl tracking-tight text-primary">
        {formatElapsedHero(elapsed)}
      </div>
      <div className="flex flex-col items-center gap-1 text-center">
        <div className="flex items-center gap-2">
          <div className="animate-pulse w-2.5 h-2.5 rounded-full bg-primary" />
          <span className="font-semibold">{timer.task?.title || 'Unknown Task'}</span>
        </div>
      </div>
      <Button 
        variant="default" 
        size="lg" 
        className="mt-2 w-32 font-bold" 
        onClick={onStop} 
        disabled={isLoading}
      >
        {isLoading ? 'Stopping...' : '■ Stop'}
      </Button>
    </div>
  );
}
