
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Calendar, 
  Shield, 
  Clock, 
  ChevronRight, 
  Code,
  SearchX,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Battle } from '@/lib/supabase';

const JoinBattle = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [battles, setBattles] = useState<Battle[]>([]);
  const [filteredBattles, setFilteredBattles] = useState<Battle[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [difficultyFilter, setDifficultyFilter] = useState('all');

  // Language mapping
  const languageLabels: Record<string, string> = {
    'javascript': 'JavaScript',
    'python': 'Python',
    'java': 'Java',
    'cpp': 'C++',
    'csharp': 'C#'
  };
  
  // Difficulty color mapping
  const difficultyColors: Record<string, string> = {
    'easy': 'bg-emerald-500/20 text-emerald-400',
    'medium': 'bg-amber-500/20 text-amber-400',
    'hard': 'bg-red-500/20 text-red-400'
  };
  
  // Difficulty points mapping
  const difficultyPoints: Record<string, number> = {
    'easy': 10,
    'medium': 25,
    'hard': 50
  };

  const fetchBattles = async () => {
    setIsLoading(true);
    try {
      // Fetch battles that are in 'waiting' status (not yet started)
      const { data, error } = await supabase
        .from('battles')
        .select('*')
        .eq('status', 'waiting')
        .is('defender_id', null)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching battles:', error);
        toast.error('Failed to load battles');
        throw error;
      }
      
      console.log('Fetched battles:', data);
      if (data) {
        setBattles(data);
        setFilteredBattles(data);
      }
    } catch (error) {
      console.error('Failed to fetch battles:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBattles();
  }, []);

  useEffect(() => {
    // Apply filters
    let result = battles;
    
    // Apply difficulty filter
    if (difficultyFilter !== 'all') {
      result = result.filter(battle => battle.difficulty === difficultyFilter);
    }
    
    // Apply search filter
    if (searchTerm) {
      result = result.filter(battle =>
        battle.language.includes(searchTerm.toLowerCase()) ||
        languageLabels[battle.language]?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredBattles(result);
  }, [battles, searchTerm, difficultyFilter]);

  const handleJoinBattle = async (battle: Battle) => {
    if (!user) {
      toast.error("You must be logged in to join a battle");
      navigate('/login');
      return;
    }

    if (battle.creator_id === user.id) {
      toast.error("You cannot join your own battle!");
      return;
    }

    setIsLoading(true);
    
    try {
      // Update the battle with the defender's ID
      const { data, error } = await supabase
        .from('battles')
        .update({
          defender_id: user.id,
          status: 'in_progress',
          start_time: new Date().toISOString()
        })
        .eq('id', battle.id)
        .select()
        .single();
        
      if (error) {
        console.error("Error joining battle:", error);
        throw error;
      }
      
      toast.success("You've joined the battle!");
      navigate(`/battle/${battle.id}`);
    } catch (error: any) {
      toast.error(`Failed to join battle: ${error.message || "Please try again."}`);
      console.error('Error joining battle:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshBattles = () => {
    fetchBattles();
    toast.success("Battle list refreshed");
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return 'just now';
    } else if (diffInSeconds < 3600) {
      return `${Math.floor(diffInSeconds / 60)} min ago`;
    } else if (diffInSeconds < 86400) {
      return `${Math.floor(diffInSeconds / 3600)} hr ago`;
    } else {
      return `${Math.floor(diffInSeconds / 86400)} days ago`;
    }
  };
  
  return (
    <div className="min-h-screen pt-10 pb-20 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight">
            Join a Battle
          </h1>
          <p className="mt-3 text-icon-light-gray max-w-2xl mx-auto">
            Browse available coding battles and test your skills against other programmers.
          </p>
        </div>
        
        {/* Filters */}
        <div className="mb-8 flex flex-col md:flex-row gap-3 justify-between">
          <div className="flex-grow max-w-md">
            <Input
              placeholder="Search by language..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="icon-input"
            />
          </div>
          
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={difficultyFilter === 'all' ? 'default' : 'outline'}
              className={difficultyFilter === 'all' ? 'bg-icon-accent text-icon-black' : ''}
              onClick={() => setDifficultyFilter('all')}
            >
              All
            </Button>
            <Button
              variant={difficultyFilter === 'easy' ? 'default' : 'outline'}
              className={difficultyFilter === 'easy' ? 'bg-emerald-500 text-black' : 'border-emerald-500/50 text-emerald-400'}
              onClick={() => setDifficultyFilter('easy')}
            >
              Easy
            </Button>
            <Button
              variant={difficultyFilter === 'medium' ? 'default' : 'outline'}
              className={difficultyFilter === 'medium' ? 'bg-amber-500 text-black' : 'border-amber-500/50 text-amber-400'}
              onClick={() => setDifficultyFilter('medium')}
            >
              Medium
            </Button>
            <Button
              variant={difficultyFilter === 'hard' ? 'default' : 'outline'}
              className={difficultyFilter === 'hard' ? 'bg-red-500 text-black' : 'border-red-500/50 text-red-400'}
              onClick={() => setDifficultyFilter('hard')}
            >
              Hard
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={refreshBattles}
              className="ml-1"
            >
              <RefreshCw size={18} className={`${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
        
        {/* Battle list */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <RefreshCw size={32} className="animate-spin text-icon-accent mb-4" />
            <p className="text-icon-light-gray">Loading available battles...</p>
          </div>
        ) : filteredBattles.length > 0 ? (
          <div className="space-y-4">
            {filteredBattles.map((battle) => (
              <div 
                key={battle.id} 
                className="bg-icon-dark-gray border border-icon-gray rounded-lg p-4 hover:border-icon-accent/50 transition-all"
              >
                <div className="md:flex justify-between items-center">
                  <div className="mb-4 md:mb-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${difficultyColors[battle.difficulty]}`}>
                        {battle.difficulty.charAt(0).toUpperCase() + battle.difficulty.slice(1)}
                      </span>
                      <span className="text-xs bg-icon-accent/20 text-icon-accent px-2 py-0.5 rounded-full">
                        {difficultyPoints[battle.difficulty]} points
                      </span>
                      {battle.is_rated && (
                        <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full">
                          Rated
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-medium flex items-center gap-2">
                      <Code size={18} className="text-icon-accent" />
                      <span>Battle in {languageLabels[battle.language] || battle.language}</span>
                    </h3>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-icon-light-gray">
                      <div className="flex items-center gap-1.5">
                        <Clock size={14} />
                        <span>{battle.duration} min</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar size={14} />
                        <span>{formatTimeAgo(battle.created_at)}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Shield size={14} />
                        <span>{battle.is_rated ? 'Rated' : 'Casual'}</span>
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleJoinBattle(battle)}
                    className="w-full md:w-auto icon-button-primary group"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw size={16} className="animate-spin mr-2" />
                        Joining...
                      </>
                    ) : (
                      <>
                        Defend
                        <ChevronRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-icon-dark-gray border border-icon-gray rounded-lg p-8 text-center">
            <div className="flex justify-center mb-4">
              {searchTerm || difficultyFilter !== 'all' ? (
                <SearchX size={48} className="text-icon-light-gray/50" />
              ) : (
                <AlertCircle size={48} className="text-icon-light-gray/50" />
              )}
            </div>
            <h3 className="text-xl font-medium mb-2">No battles found</h3>
            {searchTerm || difficultyFilter !== 'all' ? (
              <p className="text-icon-light-gray">
                No battles match your current filters. Try adjusting your search criteria.
              </p>
            ) : (
              <p className="text-icon-light-gray">
                There are no open battles at the moment. Why not create one?
              </p>
            )}
            <div className="mt-6">
              {searchTerm || difficultyFilter !== 'all' ? (
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchTerm('');
                    setDifficultyFilter('all');
                  }}
                >
                  Clear Filters
                </Button>
              ) : (
                <Button 
                  className="icon-button-primary"
                  onClick={() => navigate('/create-battle')}
                >
                  Create a Battle
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default JoinBattle;
