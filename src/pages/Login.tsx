
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Github } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }
    
    setIsLoading(true);
    
    try {
      // In a real app, this would call an API to sign in the user
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success("Signed in successfully!");
      navigate('/');
    } catch (error) {
      toast.error("Failed to sign in");
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleGithubLogin = () => {
    toast.info("GitHub authentication will be connected with your Supabase account");
    // In a real app, this would redirect to GitHub OAuth
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold tracking-tight mb-2">Welcome back</h1>
          <p className="text-icon-light-gray">Sign in to continue to ICON</p>
        </div>
        
        <Card className="bg-icon-dark-gray border-icon-gray">
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="icon-input"
                  required
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <a
                    href="#"
                    className="text-xs text-icon-accent hover:underline"
                  >
                    Forgot password?
                  </a>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="icon-input"
                  required
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full mt-6 bg-icon-accent text-icon-black hover:brightness-105"
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
            
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-icon-gray"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-icon-dark-gray px-2 text-icon-light-gray">or continue with</span>
              </div>
            </div>
            
            <Button 
              variant="outline" 
              className="w-full border-icon-gray" 
              onClick={handleGithubLogin}
            >
              <Github size={16} className="mr-2" />
              GitHub
            </Button>
          </CardContent>
          <CardFooter className="justify-center">
            <p className="text-sm text-icon-light-gray">
              Don't have an account?{" "}
              <a
                onClick={() => navigate('/signup')}
                className="text-icon-accent hover:underline cursor-pointer"
              >
                Sign up
              </a>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Login;
