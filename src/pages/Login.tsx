
import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Github } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading, signInWithGithub } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (user && !loading) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  const handleGithubLogin = async () => {
    await signInWithGithub();
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
              Sign in using your GitHub account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Button 
              variant="outline" 
              className="w-full border-icon-gray hover:bg-icon-gray/20"
              onClick={handleGithubLogin}
              disabled={loading}
            >
              <Github size={18} className="mr-2" />
              Continue with GitHub
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
