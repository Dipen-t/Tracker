import { Outlet, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { CommandMenu } from './CommandMenu';
import { GlobalTimer } from '@/components/time/GlobalTimer';

export function DashboardLayout() {
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!localStorage.getItem('token')) {
      navigate('/login');
    }
  }, [navigate]);

  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="w-full flex-1 relative pb-16">
        <div className="flex items-center p-4 border-b md:hidden">
          <SidebarTrigger />
          <h1 className="ml-4 text-xl font-bold">TRACKER</h1>
        </div>
        <div className="p-8 w-full mx-auto flex flex-col gap-8">
          <Outlet />
        </div>
        <GlobalTimer />
      </main>
      <CommandMenu />
    </SidebarProvider>
  );
}
