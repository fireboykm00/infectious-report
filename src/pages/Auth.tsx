import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Activity, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { AuthFormData } from "@/types/auth";

const ROLES = [
  { id: 'reporter', label: 'Reporter' },
  { id: 'lab_tech', label: 'Lab Technician' },
  { id: 'district_officer', label: 'District Officer' },
  { id: 'national_officer', label: 'National Officer' },
  { id: 'admin', label: 'Administrator' },
] as const;

type UserRole = typeof ROLES[number]['id'];

const Auth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [isSignupDisabled, setIsSignupDisabled] = useState(false);
  const [formData, setFormData] = useState<AuthFormData>({
    email: "",
    password: "",
    fullName: "",
    phone: "",
    role: "reporter",
  });

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const from = location.state?.from?.pathname || "/dashboard";
        navigate(from, { replace: true });
      }
    };
    checkUser();
  }, [navigate, location]);

  const [resendEmail, setResendEmail] = useState("");
  const [verificationSent, setVerificationSent] = useState(false);

  const handleResendVerification = async (email: string) => {
    if (!email) {
      toast.error("Please enter your email address first");
      return;
    }
    setLoading(true);
    try {
      // Try sending a new signup verification
      const { error: signupError } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });

      if (signupError) {
        // If signup verification fails, try password recovery as fallback
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email);
        if (resetError) throw resetError;
        toast.success("Recovery email sent! Please check your inbox and spam folder.");
      } else {
        toast.success("Verification email sent! Please check your inbox and spam folder.");
      }
      setVerificationSent(true);
    } catch (error) {
      console.error("Verification error:", error);
      toast.error("Failed to send verification email. Please try again or contact support.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setResendEmail(formData.email);

    try {
      if (isLogin) {
        // Login flow
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (error) {
          console.error("Login error details:", error);
          
          if (error.message.includes('Email not confirmed')) {
            toast.error("Please check your email and confirm your account before logging in.");
          } else if (error.message.includes('Invalid login credentials')) {
            toast.error("Invalid email or password. If you just signed up, please check your email for verification.");
          } else {
            throw error;
          }
          return;
        }

        if (data.session) {
          toast.success("Logged in successfully!");
          const from = location.state?.from?.pathname || "/dashboard";
          navigate(from, { replace: true });
        }
      } else {
        // Sign up flow
        if (isSignupDisabled) {
          toast.error("Please wait before trying to sign up again");
          return;
        }

        setIsSignupDisabled(true);
        setTimeout(() => setIsSignupDisabled(false), 60000);

        // Step 1: Create the user account
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
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

        if (signUpError) {
          if (signUpError.message.includes('request this after')) {
            toast.error('Please wait a moment before trying again');
            return;
          }
          throw signUpError;
        }

        if (!authData.user) {
          throw new Error('No user data returned from sign up');
        }

        // Profile is automatically created by database trigger
        // Step 2: Try to create user role if table exists
        try {
          const { error: roleError } = await supabase
            .from('user_roles')
            .insert([{
              user_id: authData.user.id,
              role: formData.role
            }]);

          if (roleError && !roleError.message.includes('could not find the table')) {
            console.error("Role assignment error:", roleError);
            throw new Error(`Failed to assign user role: ${roleError.message}`);
          }
        } catch (roleError) {
          console.warn("Role assignment skipped - table may not exist yet:", roleError);
        }

        // Check if email verification is required
        if (authData.session) {
          // User was automatically signed in, redirect to dashboard
          toast.success("Account created successfully!");
          const from = location.state?.from?.pathname || "/dashboard";
          navigate(from, { replace: true });
        } else {
          // Email verification required
          setIsLogin(true); // Switch to login view
          toast.success("Account created! Please check your email for verification before logging in.");
          setFormData(prev => ({
            ...prev,
            password: "", // Clear password for security
            fullName: "",
            phone: "",
            role: "reporter"
          }));
        }
      }
    } catch (error) {
      console.error("Auth error details:", {
        error,
        formData: { ...formData, password: '[REDACTED]' },
        isLogin
      });
      
      if (error instanceof Error) {
        if (error.message.includes('Invalid login credentials')) {
          toast.error("Invalid email or password. If you just signed up, please verify your email first.");
        } else if (error.message.includes('Email not confirmed')) {
          toast.error("Please check your email and verify your account before logging in.");
        } else {
          toast.error(error.message);
        }
      } else {
        toast.error("Authentication failed. Please try again.")
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 shadow-elegant">
        <div className="flex items-center justify-center gap-2 mb-8">
          <Activity className="h-8 w-8 text-primary animate-pulse-slow" />
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            IDSR System
          </h1>
        </div>

        <div className="flex gap-2 mb-6">
          <Button
            type="button"
            variant={isLogin ? "default" : "outline"}
            className="flex-1"
            onClick={() => setIsLogin(true)}
            disabled={loading}
          >
            Login
          </Button>
          <Button
            type="button"
            variant={!isLogin ? "default" : "outline"}
            className="flex-1"
            onClick={() => setIsLogin(false)}
            disabled={loading || isSignupDisabled}
          >
            Sign Up
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <>
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role *</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value: UserRole) => setFormData({ ...formData, role: value })}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map(role => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password *</Label>
            <Input
              id="password"
              type="password"
              required
              minLength={6}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              disabled={loading}
            />
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={loading || (!isLogin && isSignupDisabled)}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLogin ? "Log In" : "Create Account"}
          </Button>

          {(isLogin || verificationSent) && (
            <div className="mt-4 space-y-2">
              <Button
                type="button"
                variant="link"
                className="w-full text-sm text-muted-foreground hover:text-primary"
                onClick={() => handleResendVerification(resendEmail || formData.email)}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  "Didn't receive verification email? Click to resend"
                )}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Please check both your inbox and spam folder. If you still don't receive the email,
                try clicking the resend button again or contact support.
              </p>
            </div>
          )}
        </form>

        <p className="text-xs text-muted-foreground text-center mt-6">
          By continuing, you agree to our Terms of Service and Privacy Policy.
          Data is protected under health information regulations.
        </p>
      </Card>
    </div>
  );
};

export default Auth;