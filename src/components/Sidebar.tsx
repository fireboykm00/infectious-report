'use client'

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  BarChart3,
  LayoutDashboard,
  TestTube2,
  AlertCircle,
  Bell,
  Settings,
  Menu,
  UserCircle,
  LogOut,
  Activity,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type SidebarProps = React.HTMLAttributes<HTMLDivElement>;

interface SidebarNavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
  roles?: string[];
  description?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, userRole: userRoleData } = useAuth();
  
  // Get user role from userRoleData
  const userRole = userRoleData?.role || 'reporter';
  
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success('Logged out successfully');
      router.push('/auth');
    } catch (error) {
      toast.error('Failed to logout');
      console.error('Logout error:', error);
    }
  };
  
  const allNavItems: SidebarNavItem[] = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: <LayoutDashboard className="h-5 w-5" />,
      roles: ["reporter", "district_officer", "national_officer", "admin", "lab_tech"],
      description: "Overview and case reporting"
    },
    {
      title: "Report Case",
      href: "/dashboard/report",
      icon: <Activity className="h-5 w-5" />,
      roles: ["reporter", "district_officer", "national_officer", "admin"],
      description: "Report new disease cases"
    },
    {
      title: "Lab Results",
      href: "/dashboard/lab",
      icon: <TestTube2 className="h-5 w-5" />,
      roles: ["lab_tech", "admin"],
      description: "Manage laboratory tests"
    },
    {
      title: "Analytics",
      href: "/dashboard/analytics",
      icon: <BarChart3 className="h-5 w-5" />,
      roles: ["district_officer", "national_officer", "admin"],
      description: "Data insights and trends"
    },
    {
      title: "Outbreaks",
      href: "/dashboard/outbreaks",
      icon: <AlertCircle className="h-5 w-5" />,
      roles: ["district_officer", "national_officer", "admin"],
      description: "Track disease outbreaks"
    },
    {
      title: "Notifications",
      href: "/dashboard/notifications",
      icon: <Bell className="h-5 w-5" />,
      roles: ["reporter", "district_officer", "national_officer", "admin", "lab_tech"],
      description: "System alerts and messages"
    },
    {
      title: "Profile",
      href: "/dashboard/profile",
      icon: <UserCircle className="h-5 w-5" />,
      roles: ["reporter", "district_officer", "national_officer", "admin", "lab_tech"],
      description: "Your account settings"
    },
    {
      title: "Admin",
      href: "/dashboard/admin",
      icon: <Settings className="h-5 w-5" />,
      roles: ["admin"],
      description: "System configuration"
    },
  ];

  // Filter sidebar items based on user role (RBAC)
  const sidebarNavItems = allNavItems.filter(item => 
    !item.roles || item.roles.includes(userRole)
  );

  const renderNavLink = (item: SidebarNavItem, mobile: boolean = false) => (
    <Link
      key={item.href}
      href={item.href}
      onClick={() => mobile && setOpen(false)}
      className={cn(
        "group relative flex items-center rounded-lg px-3 py-2 text-sm transition-all duration-200",
        "hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950 dark:hover:text-blue-400",
        pathname === item.href 
          ? "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400"
          : "text-gray-600 dark:text-gray-300",
        "font-medium"
      )}
    >
      <span className={cn(
        "flex h-10 w-10 items-center justify-center rounded-lg",
        pathname === item.href
          ? "text-blue-600 dark:text-blue-400"
          : "text-gray-500 group-hover:text-blue-600 dark:text-gray-400 dark:group-hover:text-blue-400"
      )}>
        {item.icon}
      </span>
      <span className="ml-3 flex-1">{item.title}</span>
      {item.description && (
        <span className="absolute left-full ml-2 rounded bg-gray-900 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100 dark:bg-gray-700">
          {item.description}
        </span>
      )}
    </Link>
  );

  return (
    <>
      {/* Mobile Trigger */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            className="mr-2 px-0 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 lg:hidden"
          >
            <Menu className="h-6 w-6" />
            <span className="sr-only">Toggle Menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="pl-1 pr-0 border-r border-gray-200 dark:border-gray-800">
          <div className="px-7 py-4 border-b border-gray-200 dark:border-gray-800">
            <Link href="/" className="flex items-center">
              <span className="font-bold text-lg text-gray-900 dark:text-white">IDSR Platform</span>
            </Link>
          </div>
          <ScrollArea className="my-4 h-[calc(100vh-12rem)] pb-10 pl-6">
            <div className="flex flex-col space-y-2">
              {sidebarNavItems.map((item) => renderNavLink(item, true))}
            </div>
          </ScrollArea>
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
            <Button
              onClick={handleLogout}
              variant="outline"
              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
            >
              <LogOut className="h-5 w-5 mr-3" />
              Logout
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar */}
      <div className={cn(
        "hidden lg:block border-r border-gray-200 dark:border-gray-800",
        "bg-white dark:bg-gray-900",
        className
      )}>
        <div className="flex flex-col h-screen">
          <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-800">
            <Link href="/" className="flex items-center">
              <span className="font-bold text-xl text-gray-900 dark:text-white">IDSR Platform</span>
            </Link>
          </div>
          <ScrollArea className="flex-1 px-3 py-4">
            <div className="space-y-1">
              {sidebarNavItems.map((item) => renderNavLink(item))}
            </div>
          </ScrollArea>
          <div className="p-4 border-t border-gray-200 dark:border-gray-800">
            <div className="mb-3 px-3 py-2 text-sm text-gray-600 dark:text-gray-400">
              {user?.email}
            </div>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
            >
              <LogOut className="h-5 w-5 mr-3" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}