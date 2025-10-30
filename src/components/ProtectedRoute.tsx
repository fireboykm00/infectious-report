'use client'

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Array<"reporter" | "lab_tech" | "district_officer" | "national_officer" | "admin">;
}

export const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { user, userRole, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth');
    }
  }, [user, loading, router]);

  // Show loading while auth is initializing
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Redirect if no user
  if (!user) {
    return null;
  }

  // Check role-based access
  if (allowedRoles && allowedRoles.length > 0) {
    const currentRole = userRole?.role;
    
    // If no role yet, wait (show loading)
    if (!currentRole) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }
    
    // Check if user's role is in allowed roles
    if (!allowedRoles.includes(currentRole)) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-2">Access Denied</h1>
            <p className="text-muted-foreground mb-4">
              You don&apos;t have permission to access this page.
            </p>
            <p className="text-sm text-muted-foreground">
              Your role: {currentRole} | Required: {allowedRoles.join(', ')}
            </p>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
};