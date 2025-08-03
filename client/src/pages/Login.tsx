declare global {
  interface Window {
    recaptchaVerifier?: any;
  }
}

import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Store, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { playSound } from "@/lib/soundEffects";
import { FcGoogle } from "react-icons/fc"; // Add this for Google icon (install react-icons if needed)
import { auth } from "@/lib/firebaseAuth";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import type { User } from "@shared/schema";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false); // Add loading state for Google
  const [isFirebaseReady, setIsFirebaseReady] = useState(false);

  const [, setLocation] = useLocation();
  const { login, loginWithGoogle, user, setUser } = useAuth();
  const { toast } = useToast();

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      await login(data.email, data.password);
      
      // Play success sound for successful login
      playSound.success();
      
      toast({
        title: "Welcome back!",
        description: "You have been successfully logged in.",
      });
      
      setLocation("/");
    } catch (error) {
      // Play error sound for failed login
      playSound.error();
      
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Invalid credentials",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Add Google login handler
  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    try {
      if (!isFirebaseReady) {
        throw new Error("Firebase authentication is not ready. Please try again.");
      }
      await loginWithGoogle(); // <-- let context handle user state
      playSound.success();
      toast({
        title: "Welcome back!",
        description: "You have been successfully logged in with Google.",
      });
      setLocation("/");
    } catch (error) {
      playSound.error();
      toast({
        title: "Google Login failed",
        description: error instanceof Error ? error.message : "Google login error",
        variant: "destructive",
      });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // Check if Firebase auth is ready
  useEffect(() => {
    if (auth && typeof auth.app !== 'undefined') {
      setIsFirebaseReady(true);
    } else {
      console.warn('Firebase auth not properly initialized');
      setIsFirebaseReady(false);
    }
  }, [auth]);

  return (
    <div className="min-h-screen bg-muted flex items-center justify-center py-12">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <div className="flex items-center justify-center mb-4">
              <Store className="h-8 w-8 text-primary mr-2" />
              <span className="text-2xl font-bold text-foreground">Siraha Bazaar</span>
            </div>
            <CardTitle className="text-2xl">Welcome Back</CardTitle>
            <p className="text-muted-foreground">
              Sign in to your account to continue shopping
            </p>
          </CardHeader>
          <CardContent>
            {/* Google Login Button */}
            <Button
              type="button"
              className="w-full mb-4 flex items-center justify-center gap-2 border border-gray-300 bg-white text-black hover:bg-gray-100"
              onClick={handleGoogleLogin}
              disabled={isGoogleLoading || !isFirebaseReady}
            >
              <FcGoogle className="h-5 w-5" />
              {isGoogleLoading ? "Signing in with Google..." : !isFirebaseReady ? "Google login unavailable" : "Sign in with Google"}
            </Button>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="Enter your email"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your password"
                            {...field}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="remember"
                      className="rounded border-gray-300"
                    />
                    <label htmlFor="remember" className="text-sm text-muted-foreground">
                      Remember me
                    </label>
                  </div>
                  <Link href="/forgot-password">
                    <Button
                      type="button"
                      variant="link"
                      className="text-sm text-primary hover:underline p-0 h-auto"
                    >
                      Forgot password?
                    </Button>
                  </Link>
                </div>

                <Button type="submit" className="w-full btn-primary" disabled={isLoading}>
                  {isLoading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </Form>



            <div className="mt-6">
              <div className="text-center">
                <span className="text-muted-foreground">Don't have an account? </span>
                <Link href="/register" className="text-primary hover:underline font-medium">
                  Create Account
                </Link>
              </div>
            </div>

            {/* Password Reset Info */}
            <div className="mt-6 border-t pt-6">
              <div className="text-center mb-4">
                <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800 mb-4">
                  <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
                    <strong>Password Reset:</strong>
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    Enter your email address and click "Forgot password?" to receive reset instructions.
                    Note: Firebase domain authorization may be required for email delivery.
                  </p>
                </div>
                
                <p className="text-sm text-muted-foreground mb-3">Demo Accounts:</p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-center space-x-2 p-2 bg-muted rounded">
                    <UserIcon className="h-4 w-4" />
                    <span>Customer: customer@example.com</span>
                  </div>
                  <div className="flex items-center justify-center space-x-2 p-2 bg-muted rounded">
                    <Store className="h-4 w-4" />
                    <span>Shopkeeper: shopkeeper@example.com</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Password: password123</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
