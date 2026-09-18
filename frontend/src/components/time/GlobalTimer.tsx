import { useEffect, useState } from 'react';
import { differenceInSeconds } from 'date-fns';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useLocation } from 'react-router-dom';


export function GlobalTimer() {
  const [timer, setTimer] = useState<any>(null);
  const [elapsed, setElapsed] = useState(0);
  const [isStopping, setIsStopping] = useState(false);
  const location = useLocation();

  const fetchActiveTimer = async () => {
    try {
      const res = await api.get('/time/active');
      setTimer(res.data.data);
    } catch (err: any) {
      console.error('Failed to fetch active timer', err);
    }
  };

  useEffect(() => {
    fetchActiveTimer();
    const interval = setInterval(fetchActiveTimer, 10000); // Polling every 10s
    
    const handleTimerStarted = () => fetchActiveTimer();
    window.addEventListener('timer-started', handleTimerStarted);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('timer-started', handleTimerStarted);
    };
  }, []);

  useEffect(() => {
    if (!timer?.startedAt) return;
    
    const startTime = new Date(timer.startedAt);
    const interval = setInterval(() => {
      setElapsed(differenceInSeconds(new Date(), startTime));
    }, 1000);
    
    setElapsed(differenceInSeconds(new Date(), startTime));
    
    return () => clearInterval(interval);
  }, [timer?.startedAt]);

  const handleStop = async () => {
    if (!timer) return;
    setIsStopping(true);
    try {
      await api.post(`/tasks/${timer.taskId}/time/stop`);
      toast.success('Timer stopped');
      setTimer(null);
      // We could trigger a global event here if we wanted the page to refresh,
      // but the user will likely navigate or refresh anyway.
      // To ensure local components update, we dispatch a custom event
      window.dispatchEvent(new Event('timer-stopped'));
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to stop timer');
    } finally {
      setIsStopping(false);
    }
  };

  const formatElapsed = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    const h = hours.toString().padStart(2, '0');
    const m = minutes.toString().padStart(2, '0');
    const s = seconds.toString().padStart(2, '0');
    
    return `${h}:${m}:${s}`;
  };

  // Do not show on Dashboard page where Hero Timer is visible
  if (!timer || location.pathname === '/') return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 md:left-[16rem] bg-card border-t shadow-lg z-50 animate-in slide-in-from-bottom-full">
      <div className="container max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="animate-pulse w-2.5 h-2.5 rounded-full bg-primary" />
          <span className="font-semibold text-sm truncate max-w-[200px] md:max-w-md">
            {timer.task?.title || 'Unknown Task'}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="font-mono font-bold text-lg text-primary">
            {formatElapsed(elapsed)}
          </div>
          <Button size="sm" onClick={handleStop} disabled={isStopping}>
            {isStopping ? 'Stopping...' : 'Stop'}
          </Button>
        </div>
      </div>
    </div>
  );
}
