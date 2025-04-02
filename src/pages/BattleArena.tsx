
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
  const [chatOpen, setChatOpen] = useState(false);
  const [isBattlePaused, setIsBattlePaused] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [chatPosition, setChatPosition] = useState({ x: 100, y: 100 });
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const chatBubbleRef = useRef<HTMLDivElement>(null);
  const dragOffset = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

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

  const { data: problem, isLoading: isProblemLoading } = useQuery({
    queryKey: ['problem', battle?.problem_id],
    queryFn: async () => {
      if (!battle?.problem_id) throw new Error("Problem ID is required");
      return getProblemById(battle.problem_id.toString());
    },
    enabled: !!battle?.problem_id,
  });

  useEffect(() => {
    if (battle?.duration) {
      setTimeLeft(battle.duration * 60);
    }
  }, [battle]);

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

  const handleSubmitCode = async () => {
    if (!battleId || !user) return;
    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.from('submissions').insert([
        {
          battle_id: battleId,
          user_id: user.id,
          code,
          language,
          status: 'pending',
          submitted_at: new Date().toISOString(),
        },
      ]).select().single();

      if (error) toast.error('Failed to submit code.');
      else {
        setSubmissionResult(data as Submission);
        toast.success('Code submitted successfully!');
      }
    } catch (err) {
      toast.error('Submission failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds: number | null): string => {
    if (seconds === null) return '∞';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

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
          className="bg-icon-accent text-icon-black w-12 h-12 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
        >
          <MessageCircle />
        </button>

        {chatOpen && (
          <div className="mt-2 w-80 h-96 bg-icon-dark-gray border border-icon-gray rounded-lg p-4 flex flex-col">
            <div className="flex-grow overflow-y-auto mb-2 text-sm" ref={chatContainerRef}>
              {chatMessages.map((msg, i) => (
                <div key={i} className="mb-1">
                  <strong>{msg.sender}:</strong> {msg.message}
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="flex-grow px-2 py-1 rounded bg-icon-gray text-white text-sm"
                placeholder="Type message..."
              />
              <Button size="icon" variant="ghost" onClick={async () => {
                if (!chatInput.trim()) return;
                const { error } = await supabase.from('chat_messages').insert([
                  {
                    battle_id: battleId,
                    sender: profile?.username || user?.id,
                    message: chatInput,
                    timestamp: new Date().toISOString()
                  }
                ]);
                if (!error) setChatInput('');
              }}>
                <Send size={16} />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BattleArena;
