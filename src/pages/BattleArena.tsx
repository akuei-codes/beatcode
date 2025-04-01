
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { 
  Timer, 
  AlertCircle, 
  Trophy, 
  ChevronLeft, 
  Flag,
  Code
} from 'lucide-react';
import CodeEditor from '@/components/CodeEditor';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { supabase } from '@/lib/supabase';
import { getProblemById, Problem } from '@/lib/problems';
import { useAuth } from '@/contexts/AuthContext';
import { Battle } from '@/lib/supabase';

const BattleArena = () => {
  const { battleId } = useParams<{ battleId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [battleDetails, setBattleDetails] = useState<Battle | null>(null);
  const [problem, setProblem] = useState<Problem | null>(null);
  const [code, setCode] = useState('');
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [showResultDialog, setShowResultDialog] = useState(false);
  const [battleResult, setBattleResult] = useState<'won' | 'lost' | 'tie' | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const loadBattleData = async () => {
      if (!battleId) {
        toast.error("Invalid battle ID");
        navigate('/join-battle');
        return;
      }
      
      try {
        setIsLoading(true);
        
        // Fetch battle details from Supabase
        const { data: battle, error } = await supabase
          .from('battles')
          .select('*')
          .eq('id', battleId)
          .single();
          
        if (error) {
          throw error;
        }
        
        if (!battle) {
          toast.error("Battle not found");
          navigate('/join-battle');
          return;
        }
        
        setBattleDetails(battle);
        
        // Get the problem by ID
        const problemData = getProblemById(battle.problem_id);
        
        if (!problemData) {
          toast.error("Problem not found");
          navigate('/join-battle');
          return;
        }
        
        setProblem(problemData);
        
        // Setup timer
        if (battle.status === 'in_progress' && battle.start_time) {
          const startTime = new Date(battle.start_time).getTime();
          const endTime = new Date(startTime + (battle.duration * 60 * 1000)).getTime();
          const now = new Date().getTime();
          const remainingTime = Math.max(0, Math.floor((endTime - now) / 1000));
          
          setTimeLeft(remainingTime);
          setIsTimerActive(true);
        } else if (battle.status === 'waiting') {
          // If you're the defender and the battle is waiting
          if (user && battle.creator_id !== user.id && !battle.defender_id) {
            // Join the battle as defender
            await joinBattle(battle.id);
          }
          
          setTimeLeft(battle.duration * 60);
        }
        
      } catch (error) {
        console.error("Error loading battle:", error);
        toast.error("Failed to load battle");
        navigate('/join-battle');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (battleId) {
      loadBattleData();
    }
    
    const battleSubscription = supabase
      .channel(`battle_${battleId}`)
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'battles',
        filter: `id=eq.${battleId}` 
      }, (payload) => {
        const updatedBattle = payload.new as Battle;
        setBattleDetails(updatedBattle);
        
        // If battle just started
        if (updatedBattle.status === 'in_progress' && updatedBattle.start_time) {
          const startTime = new Date(updatedBattle.start_time).getTime();
          const endTime = new Date(startTime + (updatedBattle.duration * 60 * 1000)).getTime();
          const now = new Date().getTime();
          const remainingTime = Math.max(0, Math.floor((endTime - now) / 1000));
          
          setTimeLeft(remainingTime);
          setIsTimerActive(true);
        }
        
        // If battle just ended
        if (updatedBattle.status === 'completed') {
          handleBattleEnd(updatedBattle);
        }
      })
      .subscribe();
    
    return () => {
      battleSubscription.unsubscribe();
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [battleId, navigate, user]);
  
  const joinBattle = async (battleId: string) => {
    if (!user) {
      toast.error("You must be logged in to join a battle");
      navigate('/login');
      return;
    }
    
    try {
      // Update battle with defender and start time
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('battles')
        .update({
          defender_id: user.id,
          status: 'in_progress',
          start_time: now
        })
        .eq('id', battleId)
        .select()
        .single();
        
      if (error) throw error;
      
      toast.success("You've joined the battle!");
      setIsTimerActive(true);
    } catch (error) {
      console.error("Error joining battle:", error);
      toast.error("Failed to join battle");
    }
  };
  
  // Start timer
  useEffect(() => {
    if (timeLeft !== null && isTimerActive) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev !== null && prev > 0) {
            return prev - 1;
          } else {
            clearInterval(timerRef.current as NodeJS.Timeout);
            if (battleDetails && battleDetails.status === 'in_progress') {
              handleSubmitSolution();
            }
            return 0;
          }
        });
      }, 1000);
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [timeLeft, isTimerActive, battleDetails]);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
  };
  
  const handleRunCode = (code: string) => {
    console.log('Running code:', code);
    // In a real app, this would send the code to a backend for execution
  };
  
  const handleSubmitSolution = async () => {
    if (!user || !battleDetails) return;
    
    // Stop the timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    try {
      // Save the solution
      const { error: solutionError } = await supabase
        .from('solutions')
        .insert({
          battle_id: battleDetails.id,
          user_id: user.id,
          code
        });
      
      if (solutionError) throw solutionError;
      
      // Check if both solutions are submitted
      const { data: solutions, error: fetchError } = await supabase
        .from('solutions')
        .select('*')
        .eq('battle_id', battleDetails.id);
      
      if (fetchError) throw fetchError;
      
      // For demo purposes, randomly determine the winner 
      // In a real app, you'd evaluate the solutions
      if (solutions && solutions.length >= 2) {
        // Both players have submitted, determine winner randomly for demo
        const winnerId = Math.random() > 0.5 ? battleDetails.creator_id : battleDetails.defender_id;
        
        // Complete the battle
        const now = new Date().toISOString();
        await supabase
          .from('battles')
          .update({
            status: 'completed',
            end_time: now,
            winner_id: winnerId
          })
          .eq('id', battleDetails.id);
          
        // Update ratings if rated battle
        if (battleDetails.is_rated) {
          const pointsChange = getDifficultyPoints(battleDetails.difficulty);
          
          if (winnerId === user.id) {
            // User won
            await supabase.rpc('update_rating', { 
              user_id: user.id,
              rating_change: pointsChange
            });
          } else {
            // User lost
            await supabase.rpc('update_rating', { 
              user_id: user.id,
              rating_change: -pointsChange
            });
          }
        }
      }
      
      toast.success("Solution submitted successfully");
      
    } catch (error) {
      console.error("Error submitting solution:", error);
      toast.error("Failed to submit solution");
    }
  };
  
  const handleBattleEnd = (battle: Battle) => {
    // Stop the timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    // Determine the battle result
    if (!user) return;
    
    let result: 'won' | 'lost' | 'tie' | null = null;
    
    if (battle.winner_id === user.id) {
      result = 'won';
    } else if (battle.winner_id && battle.winner_id !== user.id) {
      result = 'lost';
    } else {
      result = 'tie';
    }
    
    setBattleResult(result);
    setShowResultDialog(true);
  };
  
  const handleExitBattle = () => {
    navigate('/join-battle');
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-emerald-500/20 text-emerald-400';
      case 'medium': return 'bg-amber-500/20 text-amber-400';
      case 'hard': return 'bg-red-500/20 text-red-400';
      default: return 'bg-icon-accent/20 text-icon-accent';
    }
  };
  
  const getDifficultyPoints = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 10;
      case 'medium': return 25;
      case 'hard': return 50;
      default: return 0;
    }
  };

  if (isLoading || !battleDetails || !problem) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-icon-accent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Battle header */}
      <div className="bg-icon-dark-gray border-b border-icon-gray py-2 px-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              size="sm"
              className="mr-2"
              onClick={handleExitBattle}
            >
              <ChevronLeft size={18} />
              Exit
            </Button>
            
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded-full ${getDifficultyColor(battleDetails.difficulty)}`}>
                  {battleDetails.difficulty.charAt(0).toUpperCase() + battleDetails.difficulty.slice(1)}
                </span>
                <span className="text-xs bg-icon-accent/20 text-icon-accent px-2 py-0.5 rounded-full">
                  {getDifficultyPoints(battleDetails.difficulty)} points
                </span>
                {battleDetails.isRated && (
                  <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full">
                    Rated
                  </span>
                )}
              </div>
              <h1 className="text-lg font-medium">{problem.title}</h1>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className={`flex items-center px-3 py-1 rounded-md ${timeLeft !== null && timeLeft < 60 ? 'bg-red-500/20 text-red-400 animate-pulse' : 'bg-icon-gray'}`}>
              <Timer size={18} className="mr-2" />
              <span className="font-mono font-medium">{timeLeft !== null ? formatTime(timeLeft) : '00:00'}</span>
            </div>
            
            <Button
              onClick={handleSubmitSolution}
              className="bg-icon-accent text-icon-black hover:brightness-105"
            >
              <Flag size={16} className="mr-2" />
              Submit Solution
            </Button>
          </div>
        </div>
      </div>
      
      {/* Battle content */}
      <div className="flex-grow overflow-hidden">
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel defaultSize={40} minSize={25}>
            <div className="h-full overflow-y-auto p-4 bg-icon-dark-gray">
              <div className="max-w-3xl mx-auto">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold mb-2">{problem.title}</h2>
                  <div className="text-icon-light-gray">{problem.question}</div>
                </div>
                
                <div className="mb-6">
                  <h3 className="text-lg font-medium mb-2 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-icon-accent"></span>
                    Examples
                  </h3>
                  <div className="space-y-4">
                    {problem.examples.map((example, index) => (
                      <div key={index} className="bg-icon-gray p-3 rounded-md font-mono text-sm">
                        {example}
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="mb-6">
                  <h3 className="text-lg font-medium mb-2 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-icon-accent"></span>
                    Constraints
                  </h3>
                  <ul className="list-disc list-inside space-y-1 text-icon-light-gray">
                    {problem.constraints.map((constraint, index) => (
                      <li key={index} className="font-mono text-sm">{constraint}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </ResizablePanel>
          
          <ResizableHandle className="w-[2px] bg-icon-gray group hover:bg-icon-accent">
            <div className="absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 w-6 h-8 bg-icon-gray group-hover:bg-icon-accent flex items-center justify-center rounded">
              <Code size={12} className="text-icon-white" />
            </div>
          </ResizableHandle>
          
          <ResizablePanel defaultSize={60} minSize={30}>
            <div className="h-full">
              <CodeEditor
                language={battleDetails.language}
                onCodeChange={handleCodeChange}
                onRunCode={handleRunCode}
              />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
      
      {/* Battle result dialog */}
      <Dialog open={showResultDialog} onOpenChange={setShowResultDialog}>
        <DialogContent className="bg-icon-dark-gray border-icon-gray">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center">
              {battleResult === 'won' ? 'Victory!' : 'Defeat'}
            </DialogTitle>
            <DialogDescription className="text-center">
              {battleResult === 'won' 
                ? 'Congratulations! You won the battle!' 
                : 'Better luck next time.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-8 flex flex-col items-center">
            {battleResult === 'won' ? (
              <>
                <Trophy size={64} className="text-yellow-400 mb-4" />
                <div className="text-center">
                  <p className="text-lg font-medium mb-2">
                    You earned {getDifficultyPoints(battleDetails.difficulty)} points!
                  </p>
                  {battleDetails.isRated && (
                    <p className="text-icon-light-gray">
                      Your rating has increased.
                    </p>
                  )}
                </div>
              </>
            ) : (
              <>
                <AlertCircle size={64} className="text-icon-error mb-4" />
                <div className="text-center">
                  <p className="text-lg font-medium mb-2">
                    You lost {getDifficultyPoints(battleDetails.difficulty)} points.
                  </p>
                  {battleDetails.isRated && (
                    <p className="text-icon-light-gray">
                      Your rating has decreased.
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
          
          <div className="flex justify-center gap-4">
            <Button
              variant="outline"
              onClick={() => navigate('/join-battle')}
            >
              Back to Battles
            </Button>
            <Button
              className="bg-icon-accent text-icon-black hover:brightness-105"
              onClick={() => navigate('/')}
            >
              Return Home
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BattleArena;
