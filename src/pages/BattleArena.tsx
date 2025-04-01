import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Monitor, 
  Flame, 
  Send, 
  Timer, 
  Users, 
  CheckCircle, 
  XCircle, 
  PauseCircle, 
  PlayCircle 
} from 'lucide-react';
import { toast } from 'sonner';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase, Battle, Solution, Submission } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { getProblemById, Problem } from '@/lib/problems';
import CodeEditor from '@/components/CodeEditor';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

interface ChatMessage {
  id: string;
  sender: string;
  message: string;
  timestamp: string;
}

const BattleArena = () => {
  const { battleId } = useParams<{ battleId: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();

  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<Submission | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isBattlePaused, setIsBattlePaused] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // Fetch battle data from Supabase
  const { data: battle, isLoading, error } = useQuery({
    queryKey: ['battle', battleId],
    queryFn: async () => {
      if (!battleId) throw new Error("Battle ID is required");
      
      const { data, error } = await supabase
        .from('battles')
        .select('*')
        .eq('id', battleId)
        .single();
      
      if (error) throw error;
      if (!data) throw new Error("Battle not found");
      
      return data as Battle;
    },
    refetchInterval: 5000, // Poll for updates every 5 seconds
  });

  // Fetch problem details
  const { data: problem, isLoading: isProblemLoading } = useQuery({
    queryKey: ['problem', battle?.problem_id ? Number(battle.problem_id) : undefined],
    queryFn: async () => {
      if (!battle?.problem_id) throw new Error("Problem ID is required");
      const problemId = typeof battle.problem_id === 'string' ? parseInt(battle.problem_id, 10) : battle.problem_id;
      return getProblemById(problemId);
    },
    enabled: !!battle?.problem_id,
  });

  useEffect(() => {
    if (battle && battle.duration) {
      setTimeLeft(battle.duration * 60);
    }
  }, [battle]);

  useEffect(() => {
    if (battle && timeLeft !== null && isTimerRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime === null) return null;
          if (prevTime <= 0) {
            clearInterval(timerRef.current!);
            timerRef.current = null;
            setIsTimerRunning(false);
            toast.info("Time's up!");
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isTimerRunning, battle, timeLeft]);

  useEffect(() => {
    const fetchInitialMessages = async () => {
      if (!battleId) return;

      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('battle_id', battleId)
        .order('timestamp', { ascending: true });

      if (error) {
        console.error('Error fetching initial messages:', error);
      } else {
        setChatMessages(data || []);
      }
    };

    fetchInitialMessages();

    const channel = supabase
      .channel(`battle_chat:${battleId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `battle_id=eq.${battleId}` },
        (payload) => {
          const newMessage = payload.new as ChatMessage;
          setChatMessages((prevMessages) => [...prevMessages, newMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [battleId, supabase]);

  const handleSubmitCode = async () => {
    if (!battleId || !user) return;

    setIsSubmitting(true);
    try {
      const { data: submission, error } = await supabase
        .from('submissions')
        .insert([
          {
            battle_id: battleId,
            user_id: user.id,
            code: code,
            language: language,
            status: 'pending',
            submitted_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (error) {
        console.error('Submission error:', error);
        toast.error('Failed to submit code.');
      } else {
        setSubmissionResult(submission as Submission);
        toast.success('Code submitted successfully!');
      }
    } catch (err) {
      console.error('Submission error:', err);
      toast.error('Failed to submit code.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendMessage = async () => {
    if (!battleId || !user || !chatInput.trim()) return;

    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert([
          {
            battle_id: battleId,
            sender: profile?.username || user.id,
            message: chatInput,
            timestamp: new Date().toISOString(),
          },
        ]);

      if (error) {
        console.error('Error sending message:', error);
        toast.error('Failed to send message.');
      } else {
        setChatInput('');
      }
    } catch (err) {
      console.error('Error sending message:', err);
      toast.error('Failed to send message.');
    }
  };

  const handlePauseBattle = () => {
    setIsBattlePaused(true);
    setIsTimerRunning(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    toast.info('Battle paused.');
  };

  const handleResumeBattle = () => {
    setIsBattlePaused(false);
    setIsTimerRunning(true);
    toast.info('Battle resumed.');
  };

  const handleStartTimer = () => {
    setIsTimerRunning(true);
  };

  const formatTime = (seconds: number | null): string => {
    if (seconds === null) return '∞';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };
  
  if (isLoading) {
    return <div>Loading battle...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  if (!battle) {
    return <div>Battle not found.</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Battle Arena</h1>

      <div className="grid grid-cols-3 gap-4">
        {/* Problem Description */}
        <div className="col-span-2">
          <Card className="bg-icon-dark-gray border-icon-gray">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Monitor className="mr-2 h-4 w-4" /> Problem: {problem?.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isProblemLoading ? (
                <div>Loading problem...</div>
              ) : problem ? (
                <>
                  <p>{problem.question}</p>
                  <Separator className="my-2" />
                  <h2 className="text-lg font-semibold">Examples:</h2>
                  <ul>
                    {problem.examples.map((example, index) => (
                      <li key={index}>{example}</li>
                    ))}
                  </ul>
                  <Separator className="my-2" />
                  <h2 className="text-lg font-semibold">Constraints:</h2>
                  <ul>
                    {problem.constraints.map((constraint, index) => (
                      <li key={index}>{constraint}</li>
                    ))}
                  </ul>
                </>
              ) : (
                <div>Problem details not found.</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Battle Info */}
        <div>
          <Card className="bg-icon-dark-gray border-icon-gray">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Flame className="mr-2 h-4 w-4" /> Battle Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center">
                <Timer className="mr-2 h-4 w-4" />
                <span>Time Left: {formatTime(timeLeft)}</span>
                {!isTimerRunning && (
                  <Button variant="ghost" size="icon" onClick={handleStartTimer}>
                    <PlayCircle className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <div className="flex items-center">
                <Users className="mr-2 h-4 w-4" />
                <span>
                  Players: You vs. {battle.defender_id ? 'Opponent' : 'Waiting...'}
                </span>
              </div>
              <div>
                Status: <Badge>{battle.status}</Badge>
              </div>
              <div>
                Difficulty: <Badge>{battle.difficulty}</Badge>
              </div>
              <div>
                Type: <Badge>{battle.battle_type}</Badge>
              </div>
              {user?.id === battle.creator_id && !isBattlePaused && (
                <Button className="w-full" onClick={handlePauseBattle}>
                  <PauseCircle className="mr-2 h-4 w-4" />
                  Pause Battle
                </Button>
              )}
              {user?.id === battle.creator_id && isBattlePaused && (
                <Button className="w-full" onClick={handleResumeBattle}>
                  <PlayCircle className="mr-2 h-4 w-4" />
                  Resume Battle
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mt-4">
        {/* Code Editor */}
        <div className="col-span-2">
          <Card className="bg-icon-dark-gray border-icon-gray">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Monitor className="mr-2 h-4 w-4" /> Code Editor
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CodeEditor
                language={language}
                onChange={(value) => setCode(value)}
                placeholder="Start coding..."
              />
              <Button
                className="mt-4 w-full icon-button-primary group"
                onClick={handleSubmitCode}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    Submit Code
                    <Send className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>
              {submissionResult && (
                <div className="mt-4">
                  Submission Status: {submissionResult.status === 'correct' ? (
                    <CheckCircle className="text-green-500 inline-block mr-2" />
                  ) : (
                    <XCircle className="text-red-500 inline-block mr-2" />
                  )}
                  {submissionResult.status}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Chat */}
        <div>
          <Card className="bg-icon-dark-gray border-icon-gray">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="mr-2 h-4 w-4" /> Chat
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col h-[300px]">
              <div className="overflow-y-auto flex-grow mb-2" ref={chatContainerRef}>
                {chatMessages.map((msg) => (
                  <div key={msg.id} className="mb-1">
                    <span className="font-semibold">{msg.sender}:</span> {msg.message}
                  </div>
                ))}
              </div>
              <div className="flex items-center">
                <input
                  type="text"
                  placeholder="Type your message..."
                  className="flex-grow px-2 py-1 rounded bg-icon-gray text-white"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                />
                <Button variant="ghost" size="icon" onClick={handleSendMessage}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default BattleArena;
