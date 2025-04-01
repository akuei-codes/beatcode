
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase, Profile } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  signInWithGithub: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  session: null,
  loading: true,
  signInWithGithub: async () => {},
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check for active session
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await fetchProfile(session.user.id);
      }
      
      setLoading(false);
    };
    
    getSession();

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change event:', event);
      setSession(session);
      setUser(session?.user ?? null);
      
      if (event === 'SIGNED_IN' && session?.user) {
        await fetchProfile(session.user.id);
        toast.success('Signed in successfully!');
        navigate('/');
      } else if (event === 'SIGNED_OUT') {
        setProfile(null);
        toast.info('Signed out successfully');
      }
      
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  const fetchProfile = async (userId: string) => {
    try {
      console.log('Fetching profile for user ID:', userId);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        // Instead of returning early, we'll create a profile
        await createUserProfile(userId);
        return;
      }

      if (data) {
        console.log('Profile found:', data);
        setProfile(data as Profile);
      } else {
        // Create a new profile if it doesn't exist
        await createUserProfile(userId);
      }
    } catch (err) {
      console.error('Exception in fetchProfile:', err);
    }
  };
  
  const createUserProfile = async (userId: string) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      if (userData?.user) {
        console.log('Creating new profile for user:', userData.user.id);
        
        const newProfile = {
          id: userData.user.id,
          username: userData.user.user_metadata?.name || userData.user.user_metadata?.full_name || 'Anonymous Coder',
          email: userData.user.email,
          avatar_url: userData.user.user_metadata?.avatar_url || null,
          rating: 1000,
          created_at: new Date().toISOString()
        };
        
        const { data, error } = await supabase
          .from('profiles')
          .insert(newProfile)
          .select()
          .single();
        
        if (error) {
          console.error('Error creating profile:', error);
          toast.error('Failed to create user profile');
        } else {
          console.log('Profile created successfully:', data);
          setProfile(data as Profile);
        }
      }
    } catch (err) {
      console.error('Exception in createUserProfile:', err);
    }
  };

  const signInWithGithub = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/login`,
      },
    });
    
    if (error) {
      toast.error('Failed to sign in with GitHub');
      console.error('GitHub Sign In Error:', error);
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      toast.error('Failed to sign out');
      console.error('Sign Out Error:', error);
    } else {
      setUser(null);
      setProfile(null);
      setSession(null);
      navigate('/');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        loading,
        signInWithGithub,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
