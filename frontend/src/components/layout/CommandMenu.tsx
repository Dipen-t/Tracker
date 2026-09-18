import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { Calendar, CheckSquare, Clock, PlusCircle, LogOut } from 'lucide-react';

export function CommandMenu() {
  const [open, setOpen] = React.useState(false);
  const navigate = useNavigate();

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const runCommand = React.useCallback((command: () => unknown) => {
    setOpen(false);
    command();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        
        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => runCommand(() => navigate('/'))}>
            <Calendar className="mr-2 h-4 w-4" />
            <span>Today</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate('/tasks'))}>
            <CheckSquare className="mr-2 h-4 w-4" />
            <span>All Tasks</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate('/time-logs'))}>
            <Clock className="mr-2 h-4 w-4" />
            <span>Time Logs</span>
          </CommandItem>
        </CommandGroup>
        
        <CommandSeparator />
        
        <CommandGroup heading="Actions">
          <CommandItem onSelect={() => runCommand(() => navigate('/tasks/new'))}>
            <PlusCircle className="mr-2 h-4 w-4" />
            <span>New Task</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Settings">
          <CommandItem onSelect={() => runCommand(handleLogout)} className="text-destructive data-[selected=true]:text-destructive">
            <LogOut className="mr-2 h-4 w-4" />
            <span>Logout</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
