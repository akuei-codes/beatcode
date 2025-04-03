
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
  PlayCircle,
  Loader2,
  Code,
  MessageCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase, Battle, Submission } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { getProblemById, Problem } from '@/lib/problems';
import CodeEditor from '@/components/CodeEditor';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

interface ChatMessage {
  id: string;
  sender: string;
  message: string;
  timestamp: string;
}

// Update Submission type to match the evaluation fields
interface ExtendedSubmission extends Submission {
  score?: number;
  feedback?: string;
  evaluated_at?: string;
}

const BattleArena = () => {
  const { battleId } = useParams<{ battleId: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();

  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<ExtendedSubmission | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatOpen, setChatOpen] = useState(false);
  const [isBattlePaused, setIsBattlePaused] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [chatPosition, setChatPosition] = useState({ x: 100, y: 100 });
  const [showScoreDialog, setShowScoreDialog] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const chatBubbleRef = useRef<HTMLDivElement>(null);
  const dragOffset = useRef({ x: 0, y: 0 });
  const channelRef = useRef<ReturnType<typeof supabase.channel>>();

  // Fetch battle data
  const { data: battle, isLoading, error } = useQuery({
    queryKey: ['battle', battleId],
    queryFn: async () => {
      if (!battleId) throw new Error("Battle ID is required");
      const { data, error } = await supabase.from('battles').select('*').eq('id', battleId).single();
      if (error) throw error;
      return data as Battle;
    },
    refetchInterval: 5000,
  });

  // Fetch problem data
  const { data: problem, isLoading: isProblemLoading } = useQuery({
    queryKey: ['problem', battle?.problem_id],
    queryFn: async () => {
      if (!battle?.problem_id) throw new Error("Problem ID is required");
      return getProblemById(Number(battle.problem_id));
    },
    enabled: !!battle?.problem_id,
  });

  // Set up real-time messaging channel without database persistence
  useEffect(() => {
    if (!battleId || !user) return;

    const channel = supabase.channel(`battle-chat-${battleId}`, {
      config: { 
        broadcast: { self: true } 
      }
    });

    // Handle incoming messages
    channel
      .on('broadcast', { event: 'chat-message' }, (payload) => {
        const message = payload.payload as ChatMessage;
        setChatMessages((prev) => [...prev, message]);
      })
      .subscribe();

    // Save channel ref for cleanup and sending
    channelRef.current = channel;

    // Cleanup on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [battleId, user]);

  // Scroll to bottom when chat messages change
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // Set timer when battle data is loaded
  useEffect(() => {
    if (battle?.duration) {
      setTimeLeft(battle.duration * 60);
    }
  }, [battle]);

  // Timer logic
  useEffect(() => {
    if (battle && timeLeft !== null && isTimerRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev === null) return null;
          if (prev <= 0) {
            clearInterval(timerRef.current!);
            setIsTimerRunning(false);
            toast.info("Time's up!");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerRunning, timeLeft]);

  // Submit code to Supabase and get OpenAI evaluation
  const handleSubmitCode = async () => {
    if (!battleId || !user || !problem) return;
    setIsSubmitting(true);

    try {
      // First, insert the submission
      const { data: submission, error } = await supabase.from('submissions').insert([
        {
          battle_id: battleId,
          user_id: user.id,
          code,
          language,
          status: 'pending',
          submitted_at: new Date().toISOString(),
        },
      ]).select().single();

      if (error || !submission) {
        toast.error('Failed to submit code.');
        return;
      }

      // Get GPT evaluation of the code
      const gptRes = await fetch("https://icon-eval.openai.azure.com/openai/deployments/gpt-4/chat/completions?api-version=2024-02-15-preview", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-key": "CuNYWL7EcoLvghiOdUI2oOoE0JZhCszOAMxZVvp3r5w7PWk4M9H9JQQJ99BDACYeBjFXJ3w3AAABACOG0zDG"
        },
        body: JSON.stringify({
          messages: [
            {
              "role": "user",
              "content": "You are a strict code evaluator. Evaluate the given code out of 100. Consider correctness, code quality, time complexity, memory efficiency, and overall implementation. Give a score between 0 and 100 and then give a paragraph of feedback (2-3 sentences) explaining the strengths and weaknesses."
            },
            { 
              role: "user", 
              content: `Evaluate the following submission for the problem: \n\n${problem.question}\n\nCode:\n${code}` 
            }
          ],
          temperature: 0.3,
          max_tokens: 200,
          top_p: 1,
          frequency_penalty: 0,
          presence_penalty: 0,
          stop: null
        })
      });

      const gptData = await gptRes.json();
      const responseText = gptData.choices[0].message.content;
      const scoreMatch = responseText.match(/(\d+(\.\d+)?)/);
      const score = scoreMatch ? parseInt(scoreMatch[0]) : 0;

      // Update the submission with the evaluation results
      await supabase.from('submissions').update({
        status: 'evaluated',
        score,
        feedback: responseText,
        evaluated_at: new Date().toISOString(),
      }).eq('id', submission.id);

      const updatedSubmission: ExtendedSubmission = { 
        ...submission, 
        score, 
        feedback: responseText, 
        status: 'evaluated' 
      };

      setSubmissionResult(updatedSubmission);
      setShowScoreDialog(true); // Show the score dialog when evaluation is complete
      toast.success('Code evaluated and scored!');
    } catch (err) {
      console.error('Submission error:', err);
      toast.error('Submission failed or evaluation error.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Send a chat message via the channel without saving to DB
  const sendChatMessage = () => {
    if (!chatInput.trim() || !user || !channelRef.current) return;
    
    const newMessage = {
      id: crypto.randomUUID(),
      sender: profile?.username || user.id,
      message: chatInput.trim(),
      timestamp: new Date().toISOString()
    };

    // Send through Supabase channel
    channelRef.current.send({
      type: 'broadcast',
      event: 'chat-message',
      payload: newMessage
    });

    // Clear input on successful send
    setChatInput('');
  };

  // Handle Enter key in chat input
  const handleChatKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      sendChatMessage();
    }
  };

  // Format timer display
  const formatTime = (seconds: number | null): string => {
    if (seconds === null) return '∞';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Chat window drag functionality
  const startDrag = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = chatBubbleRef.current?.getBoundingClientRect();
    if (rect) {
      dragOffset.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
    document.addEventListener('mousemove', onDrag);
    document.addEventListener('mouseup', endDrag);
  };

  const onDrag = (e: MouseEvent) => {
    setChatPosition({
      x: e.clientX - dragOffset.current.x,
      y: e.clientY - dragOffset.current.y,
    });
  };

  const endDrag = () => {
    document.removeEventListener('mousemove', onDrag);
    document.removeEventListener('mouseup', endDrag);
  };

  if (isLoading || isProblemLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="animate-spin h-8 w-8 mr-2" />
        <p>Loading battle...</p>
      </div>
    );
  }

  if (error || !battle) {
    return (
      <div className="h-screen flex items-center justify-center">
        <p className="text-red-500">Error loading battle data</p>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col relative">
      <div className="p-4 border-b border-icon-gray flex justify-between items-center bg-icon-dark-gray">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold">{problem?.title}</h1>
          <Badge>{battle?.difficulty}</Badge>
          <Badge>{battle?.battle_type}</Badge>
        </div>
        <div className="flex items-center gap-4">
          <span>Time Left: {formatTime(timeLeft)}</span>
          {!isTimerRunning && (
            <Button variant="ghost" size="icon" onClick={() => setIsTimerRunning(true)}>
              <PlayCircle className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <ResizablePanelGroup direction="horizontal" className="flex-grow">
        <ResizablePanel defaultSize={50} minSize={30}>
          <div className="h-full overflow-y-auto p-6 bg-icon-dark-gray text-sm leading-relaxed">
            <h2 className="text-xl font-bold mb-4">{problem?.title}</h2>
            <p className="mb-6 whitespace-pre-wrap">{problem?.question}</p>
            <h3 className="font-semibold text-lg mb-2">Examples:</h3>
            <div className="space-y-4">
              {problem?.examples.map((example, idx) => (
                <pre key={idx} className="bg-icon-gray p-3 rounded-md font-mono text-xs whitespace-pre-wrap">
                  {example}
                </pre>
              ))}
            </div>
            <h3 className="font-semibold text-lg mt-6 mb-2">Constraints:</h3>
            <ul className="list-disc ml-5 space-y-1 text-sm text-icon-light-gray">
              {problem?.constraints.map((c, idx) => (
                <li key={idx} className="font-mono">{c}</li>
              ))}
            </ul>
          </div>
        </ResizablePanel>

        <ResizableHandle />

        <ResizablePanel defaultSize={50} minSize={30}>
          <div className="h-full bg-icon-dark-gray p-4 flex flex-col">
            <CodeEditor language={language} onCodeChange={setCode} />
            <Button
              className="mt-4 w-full icon-button-primary group"
              onClick={handleSubmitCode}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</>
              ) : (
                <>
                  Submit Code
                  <Send className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>
            {submissionResult && !showScoreDialog && (
              <div className="mt-4 p-3 border border-icon-gray rounded-md bg-icon-gray">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Submission Status:</span>
                  <Badge variant="outline" className="ml-2">
                    {submissionResult.status === 'evaluated' ? 'Evaluated' : submissionResult.status}
                  </Badge>
                </div>
                {submissionResult.score !== undefined && (
                  <div className="flex items-center mt-2">
                    <span>Score: </span>
                    <span className="font-bold ml-2 text-icon-accent">{submissionResult.score}%</span>
                  </div>
                )}
                <Button 
                  variant="outline" 
                  className="mt-2 w-full text-xs" 
                  onClick={() => setShowScoreDialog(true)}
                >
                  View Detailed Feedback
                </Button>
              </div>
            )}
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>

      <div
        ref={chatBubbleRef}
        onMouseDown={startDrag}
        style={{ position: 'absolute', left: chatPosition.x, top: chatPosition.y }}
        className="z-50 cursor-move"
      >
        <button
          onClick={() => setChatOpen(!chatOpen)}
          className="bg-icon-accent text-icon-black w-12 h-12 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform relative"
        >
          <MessageCircle />
          {chatMessages.length > 0 && !chatOpen && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {chatMessages.length}
            </span>
          )}
        </button>

        {chatOpen && (
          <div className="mt-2 w-80 h-96 bg-icon-dark-gray border border-icon-gray rounded-lg p-4 flex flex-col shadow-lg">
            <div className="flex justify-between items-center mb-2 pb-2 border-b border-icon-gray">
              <h3 className="font-medium">Battle Chat</h3>
              <Badge variant="outline">{chatMessages.length} messages</Badge>
            </div>
            
            <ScrollArea className="flex-grow mb-2" ref={chatContainerRef}>
              <div className="space-y-2 pr-2">
                {chatMessages.length === 0 ? (
                  <p className="text-center text-gray-500 italic text-sm py-4">
                    No messages yet. Start the conversation!
                  </p>
                ) : (
                  chatMessages.map((msg) => (
                    <div 
                      key={msg.id} 
                      className={`rounded-lg p-2 text-sm ${
                        msg.sender === (profile?.username || user?.id) 
                          ? 'bg-teal-600 ml-8 text-white' 
                          : 'bg-icon-gray mr-8'
                      }`}
                    >
                      <div className="font-semibold text-xs opacity-70">
                        {msg.sender === (profile?.username || user?.id) ? 'You' : msg.sender}
                      </div>
                      {msg.message}
                      <div className="text-right text-xs opacity-50 mt-1">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
            
            <div className="flex gap-2 mt-2">
              <Input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={handleChatKeyPress}
                className="flex-grow bg-icon-gray text-white text-sm"
                placeholder="Type message..."
              />
              <Button size="icon" onClick={sendChatMessage} disabled={!chatInput.trim()}>
                <Send size={16} />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Score Dialog */}
      <Dialog open={showScoreDialog} onOpenChange={setShowScoreDialog}>
        <DialogContent className="bg-icon-dark-gray border border-icon-gray">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center text-icon-accent">
              You scored {submissionResult?.score || 0}%
            </DialogTitle>
            <DialogDescription className="text-center mt-2 text-white">
              {submissionResult?.feedback || 'Your code has been evaluated.'}
            </DialogDescription>
            <p className="text-sm text-icon-light-gray text-center mt-4">
              The winner will be announced once all players have submitted their solutions.
            </p>
          </DialogHeader>
          <Button className="w-full mt-4" onClick={() => setShowScoreDialog(false)}>
            Close
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BattleArena;
