import { useState } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Play, CheckCircle2, Circle, CircleDot, MoreHorizontal, Check, Clock } from 'lucide-react';
import { TaskDetailModal } from './TaskDetailModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  hasTimeLogs?: boolean;
  totalTime?: number;
}

interface TaskCardProps {
  task: Task;
  onUpdate: () => void;
  onStartTimer: (taskId: string) => void;
  hasActiveTimer: boolean;
  activeTimerTaskId?: string;
}

import { EditTaskDialog } from './EditTaskDialog';

export function TaskCard({ task, onUpdate, onStartTimer, hasActiveTimer, activeTimerTaskId }: TaskCardProps) {
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

  const statusColors = {
    PENDING: 'bg-slate-100 text-slate-700',
    IN_PROGRESS: 'bg-blue-100 text-blue-700',
    COMPLETED: 'bg-green-100 text-green-700',
  };

  return (
    <>
      <Card 
        onClick={() => setIsModalOpen(true)}
        draggable
        onDragStart={(e) => {
          e.dataTransfer.setData('taskId', task.id);
          e.dataTransfer.effectAllowed = 'move';
          setTimeout(() => {
            if (e.target instanceof HTMLElement) {
              e.target.classList.add('opacity-50', 'ring-2', 'ring-primary');
            }
          }, 0);
        }}
        onDragEnd={(e) => {
          if (e.target instanceof HTMLElement) {
            e.target.classList.remove('opacity-50', 'ring-2', 'ring-primary');
          }
        }}
        className="group relative cursor-grab active:cursor-grabbing hover:border-primary/50 transition-colors flex flex-col justify-between"
      >
        <CardHeader className="p-4 pb-2 flex flex-row items-start justify-between space-y-0">
          <div className="flex items-start gap-2 max-w-[85%]">
            <div className="mt-0.5">
              <StatusIcon />
            </div>
            <h4 className={`font-semibold text-sm leading-tight line-clamp-2 ${task.status === 'COMPLETED' ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
              {task.title}
            </h4>
          </div>
          
          <div className="shrink-0 -mt-1 -mr-1">
            <DropdownMenu>
              <DropdownMenuTrigger onClick={(e: any) => e.stopPropagation()} className="inline-flex h-6 w-6 items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground text-muted-foreground outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                  <MoreHorizontal className="w-4 h-4" />
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
        </CardHeader>
        
        <CardContent className="p-4 pt-2 flex-1 flex flex-col gap-3">
          {task.description ? (
            <p className="text-xs text-muted-foreground line-clamp-3">
              {task.description}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground italic opacity-50">
              No description
            </p>
          )}

          {task.totalTime !== undefined && task.totalTime > 0 && (
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mt-auto">
              <Clock className="w-3.5 h-3.5" />
              <span>{formatTotalTime(task.totalTime)} logged</span>
            </div>
          )}
        </CardContent>

        <CardFooter className="p-4 pt-0 flex items-center justify-between mt-auto border-t pt-3">
          <Badge variant="secondary" className={`text-[10px] ${statusColors[task.status]} px-2 py-0.5`}>
            {task.status.replace('_', ' ')}
          </Badge>
          
          <div className="flex items-center gap-1 transition-opacity">
            {!isActive && task.status !== 'COMPLETED' && (
              <Button 
                variant="outline" 
                size="sm" 
                className="h-7 text-xs px-2"
                disabled={hasActiveTimer || isStatusUpdating}
                onClick={handleStartClick}
              >
                <Play className="w-3 h-3 mr-1" />
                {task.hasTimeLogs ? 'Resume' : 'Start'}
              </Button>
            )}

            {task.status !== 'COMPLETED' && (
              <Button 
                variant="outline" 
                size="icon" 
                className="h-7 w-7 text-muted-foreground"
                disabled={isStatusUpdating}
                onClick={(e) => updateStatus('COMPLETED', e)}
              >
                <Check className="w-4 h-4" />
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>

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
