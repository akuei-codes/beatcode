
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
    const getSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await fetchProfile(session.user.id);
        }
      } catch (error) {
        console.error("Error getting session:", error);
      } finally {
        setLoading(false);
      }
    };
    
    getSession();

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
      
      // Check if profiles table exists before querying
      const { error: tableError } = await supabase
        .from('profiles')
        .select('count')
        .limit(1)
        .single();
      
      if (tableError && tableError.code === '42P01') {
        // Table doesn't exist, create it
        await createProfilesTable();
      }
        
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        // Only try to create profile if the error is not a connection error
        if (error.code !== 'PGRST12') {
          await createUserProfile(userId);
        }
        return;
      }

      if (data) {
        console.log('Profile found:', data);
        setProfile(data as Profile);
        
        await ensureRatingHistory(userId);
      } else {
        await createUserProfile(userId);
      }
    } catch (err) {
      console.error('Exception in fetchProfile:', err);
    }
  };
  
  const createProfilesTable = async () => {
    try {
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS profiles (
          id UUID PRIMARY KEY,
          username TEXT NOT NULL,
          email TEXT,
          avatar_url TEXT,
          rating INTEGER DEFAULT 1000,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE
        );
      `;
      
      await supabase.rpc('exec_sql', { sql: createTableSQL });
      console.log('Created profiles table');
      
      const createRatingHistoryTableSQL = `
        CREATE TABLE IF NOT EXISTS rating_history (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID NOT NULL REFERENCES profiles(id),
          rating INTEGER NOT NULL,
          battle_id UUID,
          notes TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `;
      
      await supabase.rpc('exec_sql', { sql: createRatingHistoryTableSQL });
      console.log('Created rating_history table');
    } catch (err) {
      console.error('Error creating tables:', err);
    }
  };
  
  const ensureRatingHistory = async (userId: string) => {
    try {
      // Check if rating_history table exists
      const { error: tableError } = await supabase
        .from('rating_history')
        .select('count')
        .limit(1)
        .single();
      
      if (tableError && tableError.code === '42P01') {
        // Table doesn't exist, skip this operation
        console.log('Rating history table does not exist');
        return;
      }
      
      const { count, error } = await supabase
        .from('rating_history')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);
      
      if (error) {
        console.error('Error checking rating history:', error);
        return;
      }
      
      if (count === 0) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('rating, created_at')
          .eq('id', userId)
          .single();
        
        if (profileData) {
          await supabase
            .from('rating_history')
            .insert({
              user_id: userId,
              rating: profileData.rating,
              notes: 'Initial rating',
              created_at: profileData.created_at
            });
          
          console.log('Created initial rating history entry');
        }
      }
    } catch (err) {
      console.error('Error ensuring rating history:', err);
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
          
          try {
            await supabase
              .from('rating_history')
              .insert({
                user_id: userData.user.id,
                rating: 1000,
                notes: 'Initial rating',
                created_at: new Date().toISOString()
              });
            
            console.log('Created initial rating history entry');
          } catch (err) {
            console.error('Error creating rating history:', err);
          }
        }
      }
    } catch (err) {
      console.error('Exception in createUserProfile:', err);
    }
  };

  const signInWithGithub = async () => {
    try {
      const { data, error } = await supabase.rpc('check_function_exists', {
        function_name: 'join_battle'
      });
      
      if (!data || error) {
        console.log('Creating join_battle function...');
        
        const createFunctionSQL = `
          CREATE OR REPLACE FUNCTION join_battle(battle_id UUID, defender_user_id UUID)
          RETURNS void AS $$
          BEGIN
            UPDATE battles 
            SET 
              defender_id = defender_user_id, 
              status = 'in_progress', 
              started_at = NOW()
            WHERE id = battle_id;
          END;
          $$ LANGUAGE plpgsql SECURITY DEFINER;
        `;
        
        const { error: createError } = await supabase.rpc('exec_sql', {
          sql: createFunctionSQL
        });
        
        if (createError) {
          console.error('Error creating join_battle function:', createError);
        } else {
          console.log('join_battle function created successfully');
        }
      }
    } catch (err) {
      console.error('Error checking/creating function:', err);
    }
    
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
