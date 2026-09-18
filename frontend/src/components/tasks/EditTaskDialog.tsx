import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface EditTaskDialogProps {
  task: {
    id: string;
    title: string;
    description: string | null;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function EditTaskDialog({ task, open, onOpenChange, onSuccess }: EditTaskDialogProps) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle(task.title);
      setDescription(task.description || '');
    }
  }, [open, task]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!title) return;
    
    setIsLoading(true);
    try {
      await api.patch(`/tasks/${task.id}`, { title, description: description || null });
      toast.success('Task updated successfully');
      onOpenChange(false);
      onSuccess();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update task');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl" onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
          <DialogDescription>Make changes to your task details.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 py-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor={`edit-title-${task.id}`}>Title</Label>
            <Input 
              id={`edit-title-${task.id}`}
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              placeholder="Task title" 
              required 
              disabled={isLoading}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor={`edit-desc-${task.id}`}>Description (optional)</Label>
            <Textarea 
              id={`edit-desc-${task.id}`}
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              placeholder="Any extra details..." 
              rows={3}
              disabled={isLoading}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
