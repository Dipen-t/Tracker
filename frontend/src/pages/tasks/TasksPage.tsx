import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { TaskItem } from '@/components/tasks/TaskItem';
import { TaskCard } from '@/components/tasks/TaskCard';
import { CreateTaskDialog } from '@/components/tasks/CreateTaskDialog';
import { LayoutGrid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function TasksPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [activeTimer, setActiveTimer] = useState<any>(null);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [view, setView] = useState<'board' | 'list'>('board');

  const fetchTasks = async () => {
    try {
      const res = await api.get('/tasks');
      setTasks(res.data.data || []);
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to load tasks');
    } finally {
      setLoadingTasks(false);
    }
  };

  const fetchActiveTimer = async () => {
    try {
      const res = await api.get('/time/active');
      setActiveTimer(res.data.data);
    } catch (err: any) {
      console.error(err);
    }
  };

  const fetchData = async () => {
    fetchTasks();
    fetchActiveTimer();
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
    
    const handleTimerEvent = () => fetchData();
    window.addEventListener('timer-stopped', handleTimerEvent);
    
    return () => window.removeEventListener('timer-stopped', handleTimerEvent);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleStartTimer = async (taskId: string) => {
    try {
      await api.post(`/tasks/${taskId}/time/start`);
      toast.success('Timer started');
      fetchActiveTimer();
      fetchTasks();
      window.dispatchEvent(new Event('timer-started'));
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to start timer');
    }
  };

  const pendingTasks = tasks.filter(t => t.status === 'PENDING' && t.id !== activeTimer?.taskId);
  const inProgressTasks = tasks.filter(t => (t.status === 'IN_PROGRESS' || t.id === activeTimer?.taskId) && t.status !== 'COMPLETED');
  const completedTasks = tasks.filter(t => t.status === 'COMPLETED');

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>, status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED') => {
    e.preventDefault();
    e.currentTarget.classList.remove('bg-muted/30', 'ring-2', 'ring-primary/20', 'rounded-xl');
    
    const taskId = e.dataTransfer.getData('taskId');
    if (!taskId) return;

    // Check if it's dropping in the same column
    const task = tasks.find(t => t.id === taskId);
    if (!task || task.status === status) return;

    // Optimistic update
    const previousTasks = [...tasks];
    setTasks(tasks.map(t => t.id === taskId ? { ...t, status } : t));

    try {
      if (status === 'COMPLETED' && activeTimer?.taskId === taskId) {
        await api.post(`/tasks/${taskId}/time/stop`);
        window.dispatchEvent(new Event('timer-stopped'));
      }
      await api.patch(`/tasks/${taskId}`, { status });
      // Fetch in background to sync any totalTime or completedAt changes
      fetchTasks();
    } catch (err: any) {
      setTasks(previousTasks);
      toast.error(err.response?.data?.message || 'Failed to move task');
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.classList.add('bg-muted/30', 'ring-2', 'ring-primary/20', 'rounded-xl');
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.currentTarget instanceof HTMLElement) {
      // Basic check so it doesn't flicker when hovering over children
      if (!e.currentTarget.contains(e.relatedTarget as Node)) {
        e.currentTarget.classList.remove('bg-muted/30', 'ring-2', 'ring-primary/20', 'rounded-xl');
      }
    }
  };

  return (
    <div className="flex flex-col gap-10 w-full max-w-6xl">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-3xl font-bold tracking-tight">Tasks</h2>
          <p className="text-muted-foreground">Manage your work and focus.</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center border rounded-md p-1 bg-muted/20">
            <Button
              variant={view === 'board' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-8 px-3"
              onClick={() => setView('board')}
            >
              <LayoutGrid className="w-4 h-4 mr-2" />
              Board
            </Button>
            <Button
              variant={view === 'list' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-8 px-3"
              onClick={() => setView('list')}
            >
              <List className="w-4 h-4 mr-2" />
              List
            </Button>
          </div>
          <CreateTaskDialog onSuccess={fetchData} />
        </div>
      </div>

      {loadingTasks ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      ) : view === 'board' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 items-stretch">
          {/* Pending Column */}
          <div 
            className="flex flex-col gap-4 md:pr-6 h-full transition-all"
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, 'PENDING')}
          >
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
              Pending
              <span className="bg-muted px-2 py-0.5 rounded-full text-xs">{pendingTasks.length}</span>
            </h3>
            <div className="flex flex-col gap-3">
              {pendingTasks.map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onUpdate={fetchData}
                  onStartTimer={handleStartTimer}
                  hasActiveTimer={!!activeTimer}
                  activeTimerTaskId={activeTimer?.taskId}
                />
              ))}
              {pendingTasks.length === 0 && (
                <div className="border border-dashed rounded-lg p-6 text-center text-muted-foreground text-sm">
                  No pending tasks
                </div>
              )}
            </div>
          </div>

          {/* In Progress Column */}
          <div 
            className="flex flex-col gap-4 md:border-l md:px-6 mt-8 md:mt-0 pt-8 md:pt-0 border-t md:border-t-0 h-full transition-all"
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, 'IN_PROGRESS')}
          >
            <h3 className="text-sm font-bold text-blue-500 uppercase tracking-wider flex items-center justify-between">
              In Progress
              <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs">{inProgressTasks.length}</span>
            </h3>
            <div className="flex flex-col gap-3">
              {inProgressTasks.map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onUpdate={fetchData}
                  onStartTimer={handleStartTimer}
                  hasActiveTimer={!!activeTimer}
                  activeTimerTaskId={activeTimer?.taskId}
                />
              ))}
              {inProgressTasks.length === 0 && (
                <div className="border border-dashed rounded-lg p-6 text-center text-muted-foreground text-sm">
                  Nothing in progress
                </div>
              )}
            </div>
          </div>

          {/* Completed Column */}
          <div 
            className="flex flex-col gap-4 md:border-l md:pl-6 mt-8 md:mt-0 pt-8 md:pt-0 border-t md:border-t-0 h-full transition-all"
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, 'COMPLETED')}
          >
            <h3 className="text-sm font-bold text-green-500 uppercase tracking-wider flex items-center justify-between">
              Completed
              <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs">{completedTasks.length}</span>
            </h3>
            <div className="flex flex-col gap-3 opacity-70">
              {completedTasks.map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onUpdate={fetchData}
                  onStartTimer={handleStartTimer}
                  hasActiveTimer={!!activeTimer}
                  activeTimerTaskId={activeTimer?.taskId}
                />
              ))}
              {completedTasks.length === 0 && (
                <div className="border border-dashed rounded-lg p-6 text-center text-muted-foreground text-sm">
                  No completed tasks
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* List View */
        <div className="flex flex-col gap-6 w-full max-w-4xl">
          {inProgressTasks.length > 0 && (
            <div className="flex flex-col gap-2">
              <h3 className="text-sm font-bold text-blue-500 uppercase tracking-wider mb-2">In Progress</h3>
              {inProgressTasks.map(task => (
                <TaskItem 
                  key={task.id} 
                  task={task} 
                  onUpdate={fetchData} 
                  onStartTimer={handleStartTimer}
                  hasActiveTimer={!!activeTimer}
                  activeTimerTaskId={activeTimer?.taskId}
                />
              ))}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2 mt-4">Pending</h3>
            {pendingTasks.length === 0 ? (
              <div className="text-center py-8 border rounded-lg bg-muted/20 flex flex-col items-center justify-center">
                <p className="text-muted-foreground text-sm">Nothing pending.</p>
              </div>
            ) : (
              pendingTasks.map(task => (
                <TaskItem 
                  key={task.id} 
                  task={task} 
                  onUpdate={fetchData} 
                  onStartTimer={handleStartTimer}
                  hasActiveTimer={!!activeTimer}
                  activeTimerTaskId={activeTimer?.taskId}
                />
              ))
            )}
          </div>

          {completedTasks.length > 0 && (
            <div className="flex flex-col gap-2 mt-6 opacity-70">
              <h3 className="text-sm font-bold text-green-500 uppercase tracking-wider mb-2">Completed</h3>
              {completedTasks.map(task => (
                <TaskItem 
                  key={task.id} 
                  task={task} 
                  onUpdate={fetchData} 
                  onStartTimer={handleStartTimer}
                  hasActiveTimer={!!activeTimer}
                  activeTimerTaskId={activeTimer?.taskId}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
