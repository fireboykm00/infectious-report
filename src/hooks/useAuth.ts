import { useState, useEffect } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { AuthFormData, Profile, UserRole } from "@/types/auth";
import type { Database } from "@/integrations/supabase/types";

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<{ role: UserRole } | null>(null);
  const [loading, setLoading] = useState(true);

  // Sign up function
  const signUp = async (formData: AuthFormData) => {
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            phone: formData.phone,
            role: formData.role,
          },
        },
      });

      if (signUpError) throw signUpError;
      if (!data.user) throw new Error('Failed to create user');

      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          full_name: formData.fullName,
          phone: formData.phone,
        });

      if (profileError) throw profileError;

      // Create user role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: data.user.id,
          role: formData.role,
        });

      if (roleError) throw roleError;
      toast.success('Account created! Please check your email for verification.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to sign up';
      toast.error(message);
      throw error;
    }
  };

  // Sign in function
  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      if (data.session) {
        toast.success('Logged in successfully');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to sign in';
      toast.error(message);
      throw error;
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setLoading(true);
        console.log('[useAuth] Initializing auth...');
        
        // Get initial user (more secure than getSession)
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
          console.error('[useAuth] Error getting user:', userError);
        }
        
        if (!userError && user) {
          setUser(user);
          
          // Also get session for compatibility
          const { data: { session } } = await supabase.auth.getSession();
          setSession(session);

          // Fetch user role from user_roles table
          try {
            const { data: userRoleData, error } = await supabase
              .from("user_roles")
              .select("role")
              .eq("user_id", user.id)
              .maybeSingle();
            
            if (!error && userRoleData && userRoleData.role) {
              setUserRole({ role: userRoleData.role });
            } else if (error) {
              console.warn('Failed to fetch user role:', error);
              // Fallback: use role from user_metadata if available
              const metaRole = user.user_metadata?.role;
              if (metaRole) {
                setUserRole({ role: metaRole as UserRole });
              }
            }
          } catch (err) {
            console.error('Error fetching user role:', err);
            // Fallback to user_metadata
            const metaRole = user.user_metadata?.role;
            if (metaRole) {
              setUserRole({ role: metaRole as UserRole });
            }
          }
        } else {
          setUser(null);
          setSession(null);
        }

        // Set up auth state listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);

            if (session?.user) {
              try {
                const { data: userRoleData, error } = await supabase
                  .from("user_roles")
                  .select("role")
                  .eq("user_id", session.user.id)
                  .maybeSingle();
                
                if (!error && userRoleData) {
                  setUserRole({ role: userRoleData.role as UserRole });
                } else {
                  // Fallback to user_metadata
                  const metaRole = session.user.user_metadata?.role;
                  if (metaRole) {
                    setUserRole({ role: metaRole as UserRole });
                  }
                }
              } catch (err) {
                console.error('Error fetching user role:', err);
                // Fallback to user_metadata
                const metaRole = session.user.user_metadata?.role;
                if (metaRole) {
                  setUserRole({ role: metaRole as UserRole });
                }
              }
            } else {
              setUserRole(null);
            }
          }
        );

        setLoading(false);
        console.log('[useAuth] Auth initialized successfully');

        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error("[useAuth] Error initializing auth:", error);
        setLoading(false);
      }
    };

    // Set timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.warn('[useAuth] Auth initialization timeout - forcing loading to false');
      setLoading(false);
    }, 10000); // 10 second timeout

    initializeAuth().finally(() => {
      clearTimeout(timeoutId);
    });

    return () => {
      clearTimeout(timeoutId);
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return { user, session, userRole, loading, signOut };
};