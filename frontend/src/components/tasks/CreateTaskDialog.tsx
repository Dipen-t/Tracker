import { useState } from 'react';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, Loader2 } from 'lucide-react';

interface CreateTaskDialogProps {
  onSuccess: () => void;
}

export function CreateTaskDialog({ onSuccess }: CreateTaskDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateAI = async () => {
    if (!title.trim()) {
      toast.error('Please enter a basic task instruction in the title field first.');
      return;
    }
    
    setIsGenerating(true);
    try {
      const res = await api.post('/tasks/generate', { rawInput: title });
      if (res.data.success && res.data.data) {
        setTitle(res.data.data.title || '');
        if (res.data.data.description) {
          setDescription(res.data.data.description);
        }
        toast.success('AI generated task details successfully!');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to generate task details');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!title) return;
    
    setIsLoading(true);
    try {
      await api.post('/tasks', { title, description: description || undefined });
      toast.success('Task created successfully');
      setOpen(false);
      setTitle('');
      setDescription('');
      onSuccess();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create task');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger 
        render={<Button><Plus className="w-4 h-4 mr-2" /> New Task</Button>} 
      />
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Task</DialogTitle>
          <DialogDescription>Add a new task or use AI to auto-generate details from a simple prompt.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 py-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="title">Task or Instruction</Label>
            <div className="flex gap-2">
              <Input 
                id="title" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                placeholder="e.g. follow up with designer" 
                required 
                disabled={isLoading || isGenerating}
                className="flex-1"
              />
              <Button 
                type="button" 
                variant="secondary" 
                onClick={handleGenerateAI}
                disabled={isLoading || isGenerating || !title.trim()}
              >
                {isGenerating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Auto-Generate
              </Button>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea 
              id="description" 
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              placeholder="Any extra details..." 
              rows={4}
              disabled={isLoading || isGenerating}
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isLoading || isGenerating}>
              {isLoading ? 'Saving...' : 'Save Task'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
