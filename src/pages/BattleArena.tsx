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
  MessageCircle,
  Trophy,
  Camera
} from 'lucide-react';
import { toast } from 'sonner';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase, Battle, Submission } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { getProblemById, Problem } from '@/lib/problems';
import { calculateNewRating, recordRatingChange } from '@/lib/rating';
import CodeEditor from '@/components/CodeEditor';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import CameraFeed from '@/components/camera/CameraFeed';

interface ChatMessage {
  id: string;
  sender: string;
  message: string;
  timestamp: string;
}

interface BattleResults {
  myScore: number | null;
  opponentScore: number | null;
  winner: 'me' | 'opponent' | 'tie' | null;
  ratingChange: number | null;
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
  const [showScoreDialog, setShowScoreDialog] = useState(false);
  const [showResultsDialog, setShowResultsDialog] = useState(false);
  const [evaluationProgress, setEvaluationProgress] = useState(0);
  const [battleResults, setBattleResults] = useState<BattleResults>({
    myScore: null,
    opponentScore: null,
    winner: null,
    ratingChange: null
  });
  const [showCamera, setShowCamera] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const autoSubmitRef = useRef<boolean>(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const chatBubbleRef = useRef<HTMLDivElement>(null);
  const dragOffset = useRef({ x: 0, y: 0 });
  const channelRef = useRef<ReturnType<typeof supabase.channel>>();
  const abortControllerRef = useRef<AbortController | null>(null);
  const hasSubmittedRef = useRef<boolean>(false);

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
      return getProblemById(Number(battle.problem_id));
    },
    enabled: !!battle?.problem_id,
  });

  useEffect(() => {
    if (!battleId || !user) return;

    const channel = supabase.channel(`battle-chat-${battleId}`, {
      config: { 
        broadcast: { self: true } 
      }
    });

    channel
      .on('broadcast', { event: 'chat-message' }, (payload) => {
        const message = payload.payload as ChatMessage;
        setChatMessages((prev) => [...prev, message]);
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [battleId, user]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  useEffect(() => {
    if (battle?.duration) {
      setTimeLeft(battle.duration * 60);
      
      if (battle.status === 'in_progress' && battle.started_at) {
        const startTime = new Date(battle.started_at).getTime();
        const currentTime = new Date().getTime();
        const elapsedSeconds = Math.floor((currentTime - startTime) / 1000);
        const remainingSeconds = (battle.duration * 60) - elapsedSeconds;
        
        if (remainingSeconds > 0) {
          setTimeLeft(remainingSeconds);
          setIsTimerRunning(true);
        } else {
          setTimeLeft(0);
          setIsTimerRunning(false);
          autoSubmitRef.current = true;
        }
      }
    }
  }, [battle]);

  useEffect(() => {
    if (timeLeft !== null && isTimerRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev === null) return null;
          if (prev <= 0) {
            clearInterval(timerRef.current!);
            setIsTimerRunning(false);
            if (!hasSubmittedRef.current) {
              autoSubmitRef.current = true;
              handleSubmitCode();
            }
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

  useEffect(() => {
    if (!battle || !user || !battleId) return;
    
    if (battle.status === 'completed' && battle.winner_id !== null) {
      checkForBattleResults();
    }
  }, [battle, user, battleId]);

  const checkForBattleResults = async () => {
    if (!battleId || !user || !battle) return;
    
    const { data: submissions, error } = await supabase
      .from('submissions')
      .select('*')
      .eq('battle_id', battleId)
      .in('status', ['evaluated', 'correct', 'incorrect']);
    
    if (error || !submissions || submissions.length < 2) {
      console.log("Not all submissions are ready yet");
      return;
    }
    
    const mySubmission = submissions.find(sub => sub.user_id === user.id);
    const opponentSubmission = submissions.find(sub => sub.user_id !== user.id);
    
    if (!mySubmission || !opponentSubmission) return;
    
    const myScore = mySubmission.score || 0;
    const opponentScore = opponentSubmission.score || 0;
    
    let winner: 'me' | 'opponent' | 'tie' = 'tie';
    if (myScore > opponentScore) {
      winner = 'me';
    } else if (opponentScore > myScore) {
      winner = 'opponent';
    }
    
    let ratingPoints = 10;
    if (battle.difficulty === 'Medium') {
      ratingPoints = 25;
    } else if (battle.difficulty === 'Hard') {
      ratingPoints = 50;
    }
    
    const ratingChange = winner === 'me' ? ratingPoints : (winner === 'opponent' ? -ratingPoints : 0);
    
    setBattleResults({
      myScore,
      opponentScore,
      winner,
      ratingChange
    });
    
    if (!submissionResult) {
      setSubmissionResult(mySubmission);
    }
    
    if (battle.status === 'completed' && battle.winner_id && ratingChange !== 0 && profile) {
      const newRating = profile.rating + ratingChange;
      await recordRatingChange(
        user.id,
        newRating,
        battleId,
        `${battle.difficulty} battle: ${winner === 'me' ? 'Victory' : 'Defeat'}`
      );
      queryClient.invalidateQueries({ queryKey: ['profile', user.id] });
    }
    
    setShowResultsDialog(true);
  };

  const handleSubmitCode = async () => {
    if (!battleId || !user || !problem) {
      toast.error("Missing required data for submission");
      return;
    }
    
    if (hasSubmittedRef.current && !autoSubmitRef.current) {
      toast.info("You have already submitted your solution");
      return;
    }
    
    setIsSubmitting(true);
    setEvaluationProgress(10);
    let submissionData: Submission | null = null;

    try {
      console.log("Starting submission with data:", {
        battle_id: battleId,
        user_id: user.id,
        code: code.substring(0, 20) + "...",
        language,
        is_auto_submit: autoSubmitRef.current
      });
      
      console.log("Checking battle participation...");
      const { data: battleCheck, error: battleCheckError } = await supabase
        .from('battles')
        .select('creator_id, defender_id')
        .eq('id', battleId)
        .single();
      
      if (battleCheckError) {
        console.error('Battle check error:', battleCheckError);
        toast.error('Failed to verify battle participation');
        setIsSubmitting(false);
        setEvaluationProgress(0);
        return;
      }
      
      console.log("Battle participation check result:", battleCheck);
      if (battleCheck.creator_id !== user.id && battleCheck.defender_id !== user.id) {
        console.error('User is not a participant in this battle');
        toast.error('You are not authorized to submit to this battle');
        setIsSubmitting(false);
        setEvaluationProgress(0);
        return;
      }
      
      hasSubmittedRef.current = true;
      
      console.log("Creating submission record...");
      setEvaluationProgress(20);
      
      const { data: submission, error: submissionError } = await supabase
        .from('submissions')
        .insert({
          battle_id: battleId,
          user_id: user.id,
          code,
          language,
          status: 'pending',
          submitted_at: new Date().toISOString(),
        })
        .select()
        .single();
  
      if (submissionError || !submission) {
        console.error('Submission error:', submissionError);
        toast.error('Failed to submit code: ' + submissionError?.message);
        setIsSubmitting(false);
        setEvaluationProgress(0);
        return;
      }
  
      console.log("Submission created successfully:", submission.id);
      submissionData = submission;
      setEvaluationProgress(40);
      
      abortControllerRef.current = new AbortController();
      
      const timeoutId = setTimeout(() => {
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
          console.log("API request aborted due to timeout");
        }
      }, 15000);
      
      console.log("Sending evaluation request to GPT API...");
      const gptRes = await fetch("https://icon-scoring.openai.azure.com/openai/deployments/gpt-4o/chat/completions?api-version=2025-01-01-preview", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-key": "CKaJ47ef5qAohlZnQOd0fiJMDbisb6vz231KPbGHvyUFlZ6ldeVxJQQJ99BDACHYHv6XJ3w3AAABACOG0cot"
        },
        signal: abortControllerRef.current?.signal,
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content: "You are a code evaluator. Score the code from 0-100 based on correctness. Format: 'Score: XX/100\\n\\nFeedback: [brief feedback]'"
            },
            {
              role: "user",
              content: `Problem: ${problem.title}\n${problem.question.slice(0, 200)}...\n\nCode:\n${code}`
            }
          ],
          temperature: 0.1,
          max_tokens: 150,
          top_p: 1,
        })
      });
      
      clearTimeout(timeoutId);
      console.log("GPT API response received");
      setEvaluationProgress(80);
  
      if (!gptRes.ok) {
        const errorText = await gptRes.text();
        console.error("GPT API error:", gptRes.status, errorText);
        throw new Error(`API error: ${gptRes.status} - ${errorText}`);
      }
      
      const gptData = await gptRes.json();
      console.log("GPT evaluation response parsed:", gptData?.choices?.[0]?.message?.content?.substring(0, 50) + "...");
      
      if (!gptData.choices || !gptData.choices[0]) {
        throw new Error("Invalid API response");
      }
      
      const responseText = gptData.choices[0].message.content;
      const scoreMatch = responseText.match(/(\d+)(?=\s*\/|\s*out of|\s*points|\s*%|\b)/i);
      const score = scoreMatch ? parseInt(scoreMatch[0]) : 50;
      
      console.log("Extracted score:", score);
      setEvaluationProgress(90);
      console.log("Updating submission with evaluation results...");
      
      const { error: updateError } = await supabase
        .from('submissions')
        .update({
          status: 'evaluated',
          score: score,
          feedback: responseText,
          evaluated_at: new Date().toISOString(),
        })
        .eq('id', submission.id);
  
      if (updateError) {
        console.error('Evaluation update error:', updateError);
        toast.error('Failed to update evaluation results: ' + updateError.message);
      } else {
        console.log("Submission updated with evaluation");
        setEvaluationProgress(100);
        
        const { data: updatedSubmission, error: fetchError } = await supabase
          .from('submissions')
          .select('*')
          .eq('id', submission.id)
          .single();
          
        if (fetchError || !updatedSubmission) {
          console.error('Error fetching updated submission:', fetchError);
          toast.error('Error retrieving updated submission: ' + fetchError?.message);
        } else {
          setSubmissionResult(updatedSubmission as Submission);
          
          const { data: bothSubmissions, error: countError } = await supabase
            .from('submissions')
            .select('*')
            .eq('battle_id', battleId)
            .in('status', ['evaluated', 'correct', 'incorrect']);
          
          const bothSubmitted = bothSubmissions && bothSubmissions.length >= 2;
          
          if (bothSubmitted) {
            await determineBattleWinner(battleId, bothSubmissions);
            queryClient.invalidateQueries({ queryKey: ['battle', battleId] });
          }
          
          setShowScoreDialog(true);
          toast.success(autoSubmitRef.current 
            ? 'Time ran out! Your code has been auto-submitted and evaluated.'
            : 'Code evaluated and scored!');
          
          autoSubmitRef.current = false;
        }
      }
    } catch (evalError) {
      console.error('Evaluation error:', evalError);
      if (evalError instanceof DOMException && evalError.name === 'AbortError') {
        toast.error('Evaluation timed out. Please try again with simpler code.');
        
        if (submissionData) {
          console.log("Applying fallback evaluation due to timeout");
          const { error: fallbackError } = await supabase
            .from('submissions')
            .update({
              status: 'evaluated',
              score: 50,
              feedback: "Evaluation timed out. This might be due to code complexity or server load. Your submission has been assigned a provisional score.",
              evaluated_at: new Date().toISOString(),
            })
            .eq('id', submissionData.id);
            
          if (!fallbackError) {
            console.log("Fallback evaluation applied successfully");
            const { data: updatedSubmission } = await supabase
              .from('submissions')
              .select('*')
              .eq('id', submissionData.id)
              .single();
              
            if (updatedSubmission) {
              setSubmissionResult(updatedSubmission as Submission);
              setShowScoreDialog(true);
              
              const { data: bothSubmissions } = await supabase
                .from('submissions')
                .select('*')
                .eq('battle_id', battleId)
                .in('status', ['evaluated', 'correct', 'incorrect']);
              
              const bothSubmitted = bothSubmissions && bothSubmissions.length >= 2;
              
              if (bothSubmitted) {
                await determineBattleWinner(battleId, bothSubmissions);
              }
              
              queryClient.invalidateQueries({ queryKey: ['battle', battleId] });
            }
          } else {
            console.error("Failed to apply fallback evaluation:", fallbackError);
          }
        }
      } else {
        toast.error('Code evaluation failed: ' + (evalError instanceof Error ? evalError.message : String(evalError)));
      }
    } finally {
      setIsSubmitting(false);
      abortControllerRef.current = null;
      setTimeout(() => setEvaluationProgress(0), 1000);
    }
  };

  const determineBattleWinner = async (battleId: string, submissions: any[]) => {
    if (!battleId || submissions.length < 2) return;
    
    let highestScore = -1;
    let winnerId = null;
    let isTie = false;
    
    submissions.forEach(sub => {
      const score = sub.score || 0;
      if (score > highestScore) {
        highestScore = score;
        winnerId = sub.user_id;
        isTie = false;
      } else if (score === highestScore) {
        isTie = true;
      }
    });
    
    if (isTie) {
      winnerId = null;
    }
    
    const { error: updateError } = await supabase
      .from('battles')
      .update({
        status: 'completed',
        winner_id: winnerId,
        ended_at: new Date().toISOString()
      })
      .eq('id', battleId);
    
    if (updateError) {
      console.error('Error updating battle status:', updateError);
    } else {
      console.log(`Battle ${battleId} completed with winner: ${winnerId || 'Tie'}`);
      
      const participantIds = [battle.creator_id, battle.defender_id].filter(Boolean) as string[];
      
      for (const participantId of participantIds) {
        if (!participantId) continue;
        
        const { data: participant } = await supabase
          .from('users')
          .select('rating')
          .eq('id', participantId)
          .single();
        
        if (!participant) continue;
        
        let ratingPoints = 10;
        if (battle.difficulty === 'Medium') {
          ratingPoints = 25;
        } else if (battle.difficulty === 'Hard') {
          ratingPoints = 50;
        }
        
        if (isTie) {
          ratingPoints = 0;
        }
        
        const didWin = !isTie && participantId === winnerId;
        const newRating = participant.rating + (didWin ? ratingPoints : -ratingPoints);
        
        await recordRatingChange(
          participantId,
          newRating,
          battleId,
          `${battle.difficulty} battle: ${isTie ? 'Tie' : (didWin ? 'Victory' : 'Defeat')}`
        );
      }
    }
  };

  const sendChatMessage = () => {
    if (!chatInput.trim() || !user || !channelRef.current) return;
    
    const newMessage = {
      id: crypto.randomUUID(),
      sender: profile?.username || user.id,
      message: chatInput.trim(),
      timestamp: new Date().toISOString()
    };

    channelRef.current.send({
      type: 'broadcast',
      event: 'chat-message',
      payload: newMessage
    });

    setChatInput('');
  };

  const handleChatKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      sendChatMessage();
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

  const handleCameraStatusChange = (isActive: boolean) => {
    setCameraActive(isActive);
  };

  const toggleCamera = () => {
    setShowCamera(prev => !prev);
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
          <Button variant="ghost" size="icon" onClick={toggleCamera} className="relative">
            <Camera className="h-4 w-4" />
            {cameraActive && <span className="absolute top-0 right-0 h-2 w-2 bg-green-500 rounded-full"></span>}
          </Button>
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
            <div className="mt-4 flex flex-col gap-2">
              {evaluationProgress > 0 && (
                <div className="flex flex-col gap-1 mb-2">
                  <div className="flex justify-between text-xs text-icon-light-gray">
                    <span>Evaluating submission...</span>
                    <span>{evaluationProgress}%</span>
                  </div>
                  <Progress value={evaluationProgress} className="h-2" />
                </div>
              )}
              <Button
                className="w-full icon-button-primary group"
                onClick={handleSubmitCode}
                disabled={isSubmitting || hasSubmittedRef.current}
              >
                {isSubmitting ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</>
                ) : hasSubmittedRef.current ? (
                  <>Solution Submitted<CheckCircle className="ml-2 h-4 w-4" /></>
                ) : (
                  <>
                    Submit Code
                    <Send className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>
            </div>
            {submissionResult && !showScoreDialog && !showResultsDialog && (
              <div className="mt-4 p-3 border border-icon-gray rounded-md bg-icon-gray">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Submission Status:</span>
                  <Badge variant="outline" className="ml-2">
                    {submissionResult.status === 'evaluated' ? 'Evaluated' : submissionResult.status}
                  </Badge>
                </div>
                {submissionResult.score !== null && (
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

      {showCamera && (
        <div className="fixed bottom-4 right-4 z-50">
          <CameraFeed 
            size="md" 
            onCameraStatusChange={handleCameraStatusChange}
            className="bg-black/80 p-2 rounded-lg shadow-lg"
          />
        </div>
      )}

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

      <Dialog open={showScoreDialog} onOpenChange={setShowScoreDialog}>
        <DialogContent className="bg-icon-dark-gray border border-icon-gray">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center text-icon-accent">
              You scored {submissionResult?.score || 0}%
            </DialogTitle>
            <DialogDescription className="text-center pt-2">
              {submissionResult?.feedback || "Your solution has been evaluated"}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {submissionResult?.score !== null && (
              <div className="mb-4">
                <div className="flex justify-between text-xs text-icon-light-gray mb-1">
                  <span>Score</span>
                  <span>{submissionResult.score}%</span>
                </div>
                <Progress value={submissionResult.score} className="h-2" />
              </div>
            )}
            <div className="bg-icon-gray p-4 rounded-md text-sm whitespace-pre-wrap">
              {submissionResult?.feedback || "Feedback will appear here after evaluation"}
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={() => setShowScoreDialog(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showResultsDialog} onOpenChange={setShowResultsDialog}>
        <DialogContent className="bg-icon-dark-gray border border-icon-gray">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center flex items-center justify-center gap-2">
              <Trophy className="h-6 w-6 text-yellow-500" />
              Battle Results
            </DialogTitle>
            <DialogDescription className="text-center pt-2">
              Your battle has been completed!
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-6">
            <div className="grid grid-cols-3 gap-4 items-center">
              <div className="text-center">
                <div className="text-2xl font-bold">{battleResults.myScore}%</div>
                <div className="text-sm text-icon-light-gray">You</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-icon-light-gray">vs</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{battleResults.opponentScore}%</div>
                <div className="text-sm text-icon-light-gray">Opponent</div>
              </div>
            </div>
            
            <div className="bg-icon-gray p-4 rounded-md text-center">
              {battleResults.winner === 'me' && (
                <div className="text-green-500 font-bold text-lg flex items-center justify-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Victory!
                </div>
              )}
              {battleResults.winner === 'opponent' && (
                <div className="text-red-500 font-bold text-lg flex items-center justify-center gap-2">
                  <XCircle className="h-5 w-5" />
                  Defeat
                </div>
              )}
              {battleResults.winner === 'tie' && (
                <div className="text-yellow-500 font-bold text-lg flex items-center justify-center gap-2">
                  <PauseCircle className="h-5 w-5" />
                  Tie
                </div>
              )}
              
              {battleResults.ratingChange !== null && (
                <div className="mt-2">
                  <span>Rating </span>
                  <span className={`font-semibold ${battleResults.ratingChange > 0 ? 'text-green-500' : battleResults.ratingChange < 0 ? 'text-red-500' : 'text-icon-light-gray'}`}>
                    {battleResults.ratingChange > 0 ? '+' : ''}{battleResults.ratingChange}
                  </span>
                </div>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => navigate('/battles')}>
              All Battles
            </Button>
            <Button onClick={() => navigate('/')}>
              Home
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BattleArena;
