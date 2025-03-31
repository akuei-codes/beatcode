
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Github } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const Signup = () => {
  const navigate = useNavigate();
  const { user, loading, signInWithGithub } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (user && !loading) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  const handleGithubSignup = async () => {
    await signInWithGithub();
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold tracking-tight mb-2">Create account</h1>
          <p className="text-icon-light-gray">Join ICON and start competing</p>
        </div>
        
        <Card className="bg-icon-dark-gray border-icon-gray">
          <CardHeader>
            <CardTitle>Sign Up</CardTitle>
            <CardDescription>
              Create an account using your GitHub account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Button 
              variant="outline" 
              className="w-full border-icon-gray hover:bg-icon-gray/20"
              onClick={handleGithubSignup}
              disabled={loading}
            >
              <Github size={18} className="mr-2" />
              Continue with GitHub
            </Button>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-icon-gray"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-icon-dark-gray px-2 text-icon-light-gray">GitHub authentication note</span>
              </div>
            </div>
            
            <p className="text-xs text-icon-light-gray text-center">
              By signing up with GitHub, we'll create a profile for you with a default rating of 1000.
              Your GitHub profile information will be used to set up your ICON account.
            </p>
          </CardContent>
          <CardFooter className="justify-center">
            <p className="text-sm text-icon-light-gray">
              Already have an account?{" "}
              <a
                onClick={() => navigate('/login')}
                className="text-icon-accent hover:underline cursor-pointer"
              >
                Sign in
              </a>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Signup;
