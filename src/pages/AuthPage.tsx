import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Mail, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Brain,
  Users,
  TrendingUp
} from "lucide-react";
import logoImage from "@/assets/logo.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { z } from "zod";
import { cn } from "@/lib/utils";

type AuthMode = "login" | "signup" | "forgot";

const emailSchema = z.string().email("Please enter a valid email");
const passwordSchema = z.string().min(6, "Password must be at least 6 characters");
const nameSchema = z.string().min(2, "Name must be at least 2 characters");

const features = [
  { icon: Sparkles, label: "AI-Powered Notes", description: "Smart summaries & flashcards" },
  { icon: Brain, label: "Spaced Repetition", description: "Learn efficiently with science" },
  { icon: Users, label: "Study Groups", description: "Collaborate with peers" },
  { icon: TrendingUp, label: "Track Progress", description: "Analytics & insights" },
];

export default function AuthPage() {
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get("mode") === "signup" ? "signup" : "login";
  
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string; name?: string }>({});
  
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { signIn, signUp, signInWithGoogle, resetPassword, user, isLoading: authLoading } = useAuth();

  const from = (location.state as { from?: string })?.from || "/dashboard";

  useEffect(() => {
    if (user && !authLoading) {
      navigate(from, { replace: true });
    }
  }, [user, authLoading, navigate, from]);

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};
    
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      newErrors.email = emailResult.error.errors[0].message;
    }

    if (mode !== "forgot") {
      const passwordResult = passwordSchema.safeParse(password);
      if (!passwordResult.success) {
        newErrors.password = passwordResult.error.errors[0].message;
      }
    }

    if (mode === "signup") {
      const nameResult = nameSchema.safeParse(name);
      if (!nameResult.success) {
        newErrors.name = nameResult.error.errors[0].message;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setIsLoading(true);
    setErrors({});

    try {
      if (mode === "forgot") {
        const { error } = await resetPassword(email);
        if (error) {
          toast({ title: "Error", description: error.message, variant: "destructive" });
        } else {
          toast({ title: "Reset link sent!", description: "Check your email for password reset instructions." });
          setMode("login");
        }
      } else if (mode === "login") {
        const { error } = await signIn(email, password);
        if (error) {
          toast({
            title: "Login failed",
            description: error.message === "Invalid login credentials" 
              ? "Invalid email or password. Please try again."
              : error.message,
            variant: "destructive",
          });
        } else {
          toast({ title: "Welcome back!", description: "Redirecting..." });
          navigate(from, { replace: true });
        }
      } else {
        const { error } = await signUp(email, password, name);
        if (error) {
          if (error.message.includes("already registered")) {
            toast({ title: "Account exists", description: "This email is already registered. Try signing in instead.", variant: "destructive" });
          } else {
            toast({ title: "Signup failed", description: error.message, variant: "destructive" });
          }
        } else {
          toast({ title: "Account created!", description: "Please check your email to verify your account." });
          navigate("/onboarding");
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    const { error } = await signInWithGoogle();
    if (error) {
      toast({ title: "Google sign-in failed", description: error.message, variant: "destructive" });
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background bg-gradient-mesh flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gradient-mesh">
      {/* Left Panel - Branding & Features */}
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden bg-gradient-to-br from-primary via-primary to-[hsl(290,75%,55%)]">
        {/* Decorative elements */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-60" />
          <motion.div 
            className="absolute top-20 -left-20 w-80 h-80 bg-white/15 rounded-full blur-3xl"
            animate={{ x: [0, 20, 0], y: [0, -15, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div 
            className="absolute bottom-20 -right-20 w-96 h-96 bg-accent/25 rounded-full blur-3xl"
            animate={{ x: [0, -20, 0], y: [0, 20, 0] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/5 rounded-full blur-3xl" />
        </div>
        
        <div className="relative z-10 flex flex-col justify-between w-full p-12 text-white">
          {/* Logo */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3"
          >
            <div className="w-12 h-12 rounded-xl overflow-hidden">
              <img src={logoImage} alt="Studily" className="w-full h-full object-cover" />
            </div>
            <span className="font-display text-2xl font-bold">Studily</span>
          </motion.div>
          
          {/* Main content */}
          <div className="max-w-lg">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <h1 className="font-display text-5xl font-bold leading-tight mb-6">
                Learn smarter,<br />
                not harder.
              </h1>
              <p className="text-xl text-white/80 mb-12">
                Your AI-powered study companion that helps you take notes, create flashcards, and master any subject.
              </p>
            </motion.div>
            
            {/* Features grid */}
            <div className="grid grid-cols-2 gap-4">
              {features.map((feature, i) => (
                <motion.div
                  key={feature.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.1 }}
                  whileHover={{ scale: 1.03, y: -2 }}
                  className="p-5 rounded-2xl bg-white/10 backdrop-blur-lg border border-white/15 hover:bg-white/15 transition-all duration-300 cursor-default shadow-lg"
                >
                  <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center mb-3">
                    <feature.icon className="w-5 h-5 text-accent" />
                  </div>
                  <h3 className="font-semibold mb-1">{feature.label}</h3>
                  <p className="text-sm text-white/70">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
          
          {/* Bottom stats */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="flex items-center gap-8 text-sm text-white/60"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-accent" />
              Free to start
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-accent" />
              No credit card required
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-background/50 backdrop-blur-xl relative">
        {/* Background orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="orb orb-primary w-64 h-64 -top-32 -right-32 opacity-40" />
          <div className="orb orb-success w-48 h-48 bottom-20 -left-24 opacity-30" />
        </div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-[440px] relative z-10"
        >
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-10">
            <motion.div 
              whileHover={{ scale: 1.05, rotate: 5 }}
              className="w-12 h-12 rounded-xl overflow-hidden shadow-glow-sm"
            >
              <img src={logoImage} alt="Studily" className="w-full h-full object-cover" />
            </motion.div>
            <span className="font-display text-2xl font-bold gradient-text">Studily</span>
          </div>

          {/* Form Header */}
          <div className="text-center mb-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={mode}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <h2 className="font-display text-3xl font-bold mb-2">
                  {mode === "login" && "Welcome back"}
                  {mode === "signup" && "Create your account"}
                  {mode === "forgot" && "Reset password"}
                </h2>
                <p className="text-muted-foreground">
                  {mode === "login" && "Sign in to continue your learning journey"}
                  {mode === "signup" && "Start learning smarter today"}
                  {mode === "forgot" && "We'll send you a reset link"}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Google Sign In */}
          {mode !== "forgot" && (
            <div className="mb-6">
              <Button
                type="button"
                variant="glass"
                size="lg"
                className="w-full h-12 text-base font-medium hover:shadow-md"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
              >
                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Continue with Google
              </Button>
              
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border/50" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background/80 backdrop-blur-sm px-4 text-muted-foreground font-medium rounded-full">or</span>
                </div>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <AnimatePresence mode="wait">
              {mode === "signup" && (
                <motion.div
                  key="name-field"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2"
                >
                  <Label htmlFor="name" className="text-sm font-medium">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="name"
                      placeholder="John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className={cn(
                        "h-12 pl-12 text-base border-2 focus:border-primary",
                        errors.name && "border-destructive focus:border-destructive"
                      )}
                    />
                  </div>
                  {errors.name && (
                    <p className="text-sm text-destructive flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4" />
                      {errors.name}
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Email</Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={cn(
                    "h-12 pl-12 text-base border-2 focus:border-primary",
                    errors.email && "border-destructive focus:border-destructive"
                  )}
                />
              </div>
              {errors.email && (
                <p className="text-sm text-destructive flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4" />
                  {errors.email}
                </p>
              )}
            </div>

            {mode !== "forgot" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                  {mode === "login" && (
                    <button
                      type="button"
                      onClick={() => setMode("forgot")}
                      className="text-sm text-primary hover:underline font-medium"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={cn(
                      "h-12 pl-12 pr-12 text-base border-2 focus:border-primary",
                      errors.password && "border-destructive focus:border-destructive"
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-destructive flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4" />
                    {errors.password}
                  </p>
                )}
              </div>
            )}

            <Button
              type="submit"
              size="lg"
              className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Processing...
                </div>
              ) : (
                <span className="flex items-center gap-2">
                  {mode === "login" && "Sign In"}
                  {mode === "signup" && "Create Account"}
                  {mode === "forgot" && "Send Reset Link"}
                  <ArrowRight className="w-5 h-5" />
                </span>
              )}
            </Button>
          </form>

          {/* Mode switch */}
          <div className="mt-8 text-center">
            {mode === "login" && (
              <p className="text-muted-foreground">
                Don't have an account?{" "}
                <button
                  onClick={() => setMode("signup")}
                  className="text-primary font-semibold hover:underline"
                >
                  Sign up for free
                </button>
              </p>
            )}
            {mode === "signup" && (
              <p className="text-muted-foreground">
                Already have an account?{" "}
                <button
                  onClick={() => setMode("login")}
                  className="text-primary font-semibold hover:underline"
                >
                  Sign in
                </button>
              </p>
            )}
            {mode === "forgot" && (
              <button
                onClick={() => setMode("login")}
                className="text-primary font-semibold hover:underline inline-flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to sign in
              </button>
            )}
          </div>

          {/* Terms */}
          {mode === "signup" && (
            <p className="mt-6 text-center text-xs text-muted-foreground">
              By creating an account, you agree to our{" "}
              <a href="#" className="underline hover:text-foreground">Terms of Service</a>
              {" "}and{" "}
              <a href="#" className="underline hover:text-foreground">Privacy Policy</a>
            </p>
          )}
        </motion.div>
      </div>
    </div>
  );
}
