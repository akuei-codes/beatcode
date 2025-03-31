
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

// Mock problem data for development purposes
const mockProblems = [
  {
    id: '1',
    title: 'Two Sum',
    question: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume that each input would have exactly one solution, and you may not use the same element twice. You can return the answer in any order.',
    examples: [
      'Input: nums = [2,7,11,15], target = 9',
      'Output: [0,1]',
      'Input: nums = [3,2,4], target = 6',
      'Output: [1,2]',
      'Input: nums = [3,3], target = 6',
      'Output: [0,1]'
    ],
    constraints: [
      '2 <= nums.length <= 10^4',
      '-10^9 <= nums[i] <= 10^9',
      '-10^9 <= target <= 10^9',
      'Only one valid answer exists.'
    ]
  },
  {
    id: '2',
    title: 'Valid Parentheses',
    question: 'Given a string s containing just the characters \'(\', \')\', \'{\', \'}\', \'[\' and \']\', determine if the input string is valid. An input string is valid if: Open brackets must be closed by the same type of brackets. Open brackets must be closed in the correct order. Every close bracket has a corresponding open bracket of the same type.',
    examples: [
      'Input: s = "()"',
      'Output: true',
      'Input: s = "()[]{}"',
      'Output: true',
      'Input: s = "(]"',
      'Output: false'
    ],
    constraints: [
      '1 <= s.length <= 10^4',
      's consists of parentheses only \'()[]{}\''
    ]
  }
];

interface Problem {
  id: string;
  title: string;
  question: string;
  examples: string[];
  constraints: string[];
}

interface BattleDetails {
  id: string;
  language: string;
  difficulty: string;
  duration: number;
  isRated: boolean;
  createdAt: string;
  problemId: number;
}

const BattleArena = () => {
  const { battleId } = useParams<{ battleId: string }>();
  const navigate = useNavigate();
  const [battleDetails, setBattleDetails] = useState<BattleDetails | null>(null);
  const [problem, setProblem] = useState<Problem | null>(null);
  const [code, setCode] = useState('');
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [showResultDialog, setShowResultDialog] = useState(false);
  const [battleResult, setBattleResult] = useState<'won' | 'lost' | 'tie' | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [isTimerActive, setIsTimerActive] = useState(false);
  
  useEffect(() => {
    const loadBattleData = async () => {
      try {
        // In a real app, this would call an API to get the battle details
        const storedBattle = localStorage.getItem('currentBattle');
        
        if (storedBattle) {
          const battle = JSON.parse(storedBattle);
          setBattleDetails(battle);
          
          // Set the problem
          // In a real app, this would fetch the problem based on the problemId
          const randomProblemIndex = Math.floor(Math.random() * mockProblems.length);
          setProblem(mockProblems[randomProblemIndex]);
          
          // Initialize timer
          setTimeLeft(battle.duration * 60); // Convert minutes to seconds
          setIsTimerActive(true);
        } else {
          toast.error("Battle data not found");
          navigate('/join-battle');
        }
      } catch (error) {
        console.error("Error loading battle:", error);
        toast.error("Failed to load battle");
        navigate('/join-battle');
      }
    };
    
    loadBattleData();
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [battleId, navigate]);
  
  // Start timer
  useEffect(() => {
    if (timeLeft !== null && isTimerActive) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev !== null && prev > 0) {
            return prev - 1;
          } else {
            clearInterval(timerRef.current as NodeJS.Timeout);
            handleBattleEnd();
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
  }, [timeLeft, isTimerActive]);

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
  
  const handleSubmitSolution = () => {
    if (code.trim() === '') {
      toast.error("Code cannot be empty");
      return;
    }
    
    // In a real app, this would submit the solution to the backend
    toast.success("Solution submitted");
    handleBattleEnd();
  };
  
  const handleBattleEnd = () => {
    // Stop the timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    // Determine the battle result (random for demo)
    const result = Math.random() > 0.5 ? 'won' : 'lost';
    setBattleResult(result);
    
    // Show the result dialog
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

  if (!battleDetails || !problem) {
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
