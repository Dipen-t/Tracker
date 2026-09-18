import { useState } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, Play, CircleDashed, CheckCircle2 } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
}

interface TaskDetailModalProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
  onStartTimer: (taskId: string) => void;
  hasActiveTimer: boolean;
  activeTimerTaskId?: string;
}

export function TaskDetailModal({
  task,
  open,
  onOpenChange,
  onUpdate,
  onStartTimer,
  hasActiveTimer,
  activeTimerTaskId
}: TaskDetailModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isStatusUpdating, setIsStatusUpdating] = useState(false);

  if (!task) return null;

  const isActive = activeTimerTaskId === task.id;

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    setIsDeleting(true);
    try {
      await api.delete(`/tasks/${task.id}`);
      toast.success('Task deleted');
      onUpdate();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete task');
    } finally {
      setIsDeleting(false);
    }
  };

  const updateStatus = async (status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED') => {
    setIsStatusUpdating(true);
    try {
      await api.patch(`/tasks/${task.id}`, { status });
      toast.success('Status updated');
      onUpdate();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    } finally {
      setIsStatusUpdating(false);
    }
  };

  const statusColors = {
    PENDING: 'bg-slate-100 text-slate-700',
    IN_PROGRESS: 'bg-blue-100 text-blue-700',
    COMPLETED: 'bg-green-100 text-green-700',
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-background border shadow-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold tracking-tight">{task.title}</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col gap-6 py-4">
          <div className="flex flex-col gap-2">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Status</span>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className={statusColors[task.status]}>
                {task.status.replace('_', ' ')}
              </Badge>
            </div>
          </div>
          
          <div className="flex flex-col gap-2">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Description</span>
            <p className="text-sm text-foreground whitespace-pre-wrap">
              {task.description || <span className="text-muted-foreground italic">No description provided.</span>}
            </p>
          </div>

          <hr />

          <div className="flex flex-col gap-3">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Actions</span>
            
            {!isActive && task.status !== 'COMPLETED' && (
              <Button 
                variant="default" 
                className="w-full justify-start gap-2" 
                disabled={hasActiveTimer || isDeleting || isStatusUpdating}
                onClick={() => {
                  onStartTimer(task.id);
                  onOpenChange(false);
                }}
              >
                <Play className="w-4 h-4" /> Start Timer
              </Button>
            )}

            <div className="flex gap-2">
              {task.status !== 'PENDING' && (
                <Button variant="outline" className="flex-1 gap-2" onClick={() => updateStatus('PENDING')} disabled={isStatusUpdating}>
                  <CircleDashed className="w-4 h-4" /> Pending
                </Button>
              )}
              {task.status !== 'IN_PROGRESS' && (
                <Button variant="outline" className="flex-1 gap-2" onClick={() => updateStatus('IN_PROGRESS')} disabled={isStatusUpdating}>
                  <Play className="w-4 h-4" /> In Progress
                </Button>
              )}
              {task.status !== 'COMPLETED' && (
                <Button variant="outline" className="flex-1 gap-2" onClick={() => updateStatus('COMPLETED')} disabled={isStatusUpdating}>
                  <CheckCircle2 className="w-4 h-4" /> Complete
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="border-t pt-4">
          <Button variant="destructive" className="w-full justify-start gap-2" onClick={handleDelete} disabled={isDeleting}>
            <Trash2 className="w-4 h-4" /> Delete Task
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
