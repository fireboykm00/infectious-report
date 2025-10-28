import { useState, useEffect } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { AuthFormData, Profile, UserRole } from "@/types/auth";
import type { Database } from "@/integrations/supabase/types";

type UserWithRole = {
  user: User | null;
  role: Database['public']['Tables']['profiles']['Row']['role'] | null;
};

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
        
        // Get initial session
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // Fetch user role from user_roles table
          const { data: userRoleData } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", session.user.id)
            .maybeSingle();
          
          if (userRoleData && userRoleData.role) {
            setUserRole({ role: userRoleData.role });
          }
        }

        // Set up auth state listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);

            if (session?.user) {
              const { data: userRoleData } = await supabase
                .from("user_roles")
                .select("role")
                .eq("user_id", session.user.id)
                .single();
              
              if (userRoleData) {
                setUserRole({ role: userRoleData.role as UserRole });
              }
            } else {
              setUserRole(null);
            }
          }
        );

        setLoading(false);

        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error("Error initializing auth:", error);
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return { user, session, userRole, loading, signOut };
};