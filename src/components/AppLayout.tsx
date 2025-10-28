import { Outlet } from 'react-router-dom';
import { Sidebar } from '@/components/Sidebar';
import { Toaster } from '@/components/ui/toaster';

export default function AppLayout() {
  return (
    <div className="flex min-h-screen">
      <Sidebar className="w-64 border-r" />
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto p-6">
          <Outlet />
        </div>
      </main>
      <Toaster />
    </div>
  );
}