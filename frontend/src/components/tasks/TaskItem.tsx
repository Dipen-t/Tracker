import { useState } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Play, CheckCircle2, Circle, CircleDot, MoreVertical, Check, Clock } from 'lucide-react';
import { TaskDetailModal } from './TaskDetailModal';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  hasTimeLogs?: boolean;
  totalTime?: number;
}

interface TaskItemProps {
  task: Task;
  onUpdate: () => void;
  onStartTimer: (taskId: string) => void;
  hasActiveTimer: boolean;
  activeTimerTaskId?: string;
}

import { EditTaskDialog } from './EditTaskDialog';

export function TaskItem({ task, onUpdate, onStartTimer, hasActiveTimer, activeTimerTaskId }: TaskItemProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isStatusUpdating, setIsStatusUpdating] = useState(false);

  const isActive = activeTimerTaskId === task.id;

  const StatusIcon = () => {
    if (task.status === 'COMPLETED') return <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />;
    if (isActive || task.status === 'IN_PROGRESS') return <CircleDot className="w-4 h-4 text-blue-500 shrink-0" />;
    return <Circle className="w-4 h-4 text-muted-foreground shrink-0" />;
  };

  const updateStatus = async (status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED', e: React.MouseEvent) => {
    e.stopPropagation();
    setIsStatusUpdating(true);
    try {
      if (status === 'COMPLETED' && isActive) {
        await api.post(`/tasks/${task.id}/time/stop`);
        window.dispatchEvent(new Event('timer-stopped'));
      }
      await api.patch(`/tasks/${task.id}`, { status });
      toast.success('Status updated');
      onUpdate();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    } finally {
      setIsStatusUpdating(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await api.delete(`/tasks/${task.id}`);
      toast.success('Task deleted');
      onUpdate();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete task');
    }
  };

  const handleStartClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onStartTimer(task.id);
  };

  const formatTotalTime = (seconds?: number) => {
    if (!seconds) return null;
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m`;
    return '< 1m';
  };

  return (
    <>
      <div 
        onClick={() => setIsModalOpen(true)}
        className="group flex items-center justify-between p-3 rounded-md hover:bg-muted/50 cursor-pointer transition-colors border border-transparent hover:border-border"
      >
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div className="mt-1">
            <StatusIcon />
          </div>
          <div className="flex flex-col min-w-0">
            <span className={`font-medium text-sm truncate ${task.status === 'COMPLETED' ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
              {task.title}
            </span>
            {task.description && (
              <span className="text-xs text-muted-foreground truncate opacity-80 mt-0.5">
                {task.description}
              </span>
            )}
            <div className="flex items-center gap-3 mt-1.5">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {task.status.replace('_', ' ')}
              </span>
              {task.totalTime !== undefined && task.totalTime > 0 && (
                <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-md">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{formatTotalTime(task.totalTime)} logged</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 transition-opacity ml-4 shrink-0">
          {!isActive && task.status !== 'COMPLETED' && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 px-2 text-muted-foreground hover:text-foreground"
              disabled={hasActiveTimer || isStatusUpdating}
              onClick={handleStartClick}
            >
              <Play className="w-4 h-4 mr-1" />
              {task.hasTimeLogs ? 'Resume' : 'Start'}
            </Button>
          )}

          {task.status !== 'COMPLETED' && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              disabled={isStatusUpdating}
              onClick={(e) => updateStatus('COMPLETED', e)}
            >
              <Check className="w-4 h-4" />
            </Button>
          )}

          <DropdownMenu>
              <DropdownMenuTrigger onClick={(e: any) => e.stopPropagation()} className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground text-muted-foreground outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                <MoreVertical className="w-4 h-4" />
              </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem onClick={() => setIsModalOpen(true)}>
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setIsEditModalOpen(true); }}>
                Edit Task
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={(e) => updateStatus('PENDING', e as any)} disabled={task.status === 'PENDING'}>
                Mark Pending
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => updateStatus('IN_PROGRESS', e as any)} disabled={task.status === 'IN_PROGRESS'}>
                Mark In Progress
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={(e) => handleDelete(e as any)} className="text-destructive">
                Delete Task
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <TaskDetailModal 
        task={task}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onUpdate={onUpdate}
        onStartTimer={onStartTimer}
        hasActiveTimer={hasActiveTimer}
        activeTimerTaskId={activeTimerTaskId}
      />

      <EditTaskDialog
        task={task}
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        onSuccess={onUpdate}
      />
    </>
  );
}
