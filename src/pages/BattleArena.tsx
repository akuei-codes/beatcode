
import React, { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase, Battle, Submission } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { getProblemById } from '@/lib/problems';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';

// Import refactored components
import BattleHeader from '@/components/battle-arena/BattleHeader';
import ProblemDisplay from '@/components/battle-arena/ProblemDisplay';
import CodeEditorSection from '@/components/battle-arena/CodeEditorSection';
import ChatWidget from '@/components/battle-arena/ChatWidget';
import ScoreDialog from '@/components/battle-arena/ScoreDialog';

// Import custom hooks
import { useBattleRealtime } from '@/hooks/useBattleRealtime';
import { useBattleTimer } from '@/hooks/useBattleTimer';

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

  // State management
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<Submission | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [showScoreDialog, setShowScoreDialog] = useState(false);

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

  // Use custom timer hook
  const { timeLeft, isTimerRunning, startTimer } = useBattleTimer(battle?.duration);

  // Handle incoming chat messages
  const handleChatMessageReceived = useCallback((message: ChatMessage) => {
    setChatMessages(prev => [...prev, message]);
  }, []);

  // Set up real-time messaging
  const { sendMessage } = useBattleRealtime(battleId, user?.id, handleChatMessageReceived);

  // Send a chat message
  const handleSendChatMessage = (message: string) => {
    if (!user || !profile) return;
    
    const newMessage = {
      id: crypto.randomUUID(),
      sender: profile.username || user.id,
      message,
      timestamp: new Date().toISOString()
    };

    sendMessage(newMessage);
  };

  // Handle code submission
  const handleSubmitCode = async () => {
    if (!battleId || !user || !problem) {
      toast.error("Missing required data for submission");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      console.log("Starting submission with data:", {
        battle_id: battleId,
        user_id: user.id,
        code: code.substring(0, 20) + "...", // Truncated for logging
        language
      });
      
      // First, check if user is a participant in this battle
      const { data: battleCheck, error: battleCheckError } = await supabase
        .from('battles')
        .select('creator_id, defender_id')
        .eq('id', battleId)
        .single();
      
      if (battleCheckError) {
        console.error('Battle check error:', battleCheckError);
        toast.error('Failed to verify battle participation');
        setIsSubmitting(false);
        return;
      }
      
      // Verify user is a participant
      if (battleCheck.creator_id !== user.id && battleCheck.defender_id !== user.id) {
        console.error('User is not a participant in this battle');
        toast.error('You are not authorized to submit to this battle');
        setIsSubmitting(false);
        return;
      }
      
      // First, insert the submission with required fields only
      console.log("Inserting submission record...");
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
        return;
      }
  
      console.log("Submission created successfully:", submission.id);
      
      try {
        // Call OpenAI evaluation API
        console.log("Calling GPT evaluation API...");
        const gptRes = await fetch("https://icon-scoring.openai.azure.com/openai/deployments/gpt-4o/chat/completions?api-version=2025-01-01-preview", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "api-key": "CKaJ47ef5qAohlZnQOd0fiJMDbisb6vz231KPbGHvyUFlZ6ldeVxJQQJ99BDACHYHv6XJ3w3AAABACOG0cot"
          },
          body: JSON.stringify({
            messages: [
              {
                role: "system",
                content: "You are a strict code evaluator. Evaluate the given code out of 100. Consider correctness, code quality, time complexity, memory efficiency, and overall implementation. Give a score between 0 and 100 and then give a paragraph of feedback (2-3 sentences) explaining the strengths and weaknesses."
              },
              {
                role: "user",
                content: `Evaluate the following submission for the problem: \n\n${problem.question}\n\nCode:\n${code}`
              }
            ],
            temperature: 0.3,
            max_tokens: 300,
            top_p: 1,
            frequency_penalty: 0,
            presence_penalty: 0,
          })
        });
  
        if (!gptRes.ok) {
          const errorText = await gptRes.text();
          console.error("GPT API error:", gptRes.status, errorText);
          throw new Error(`API error: ${gptRes.status} - ${errorText}`);
        }
        
        const gptData = await gptRes.json();
        console.log("GPT evaluation response received:", gptData);
        
        if (!gptData.choices || !gptData.choices[0]) {
          throw new Error("Invalid API response");
        }
        
        const responseText = gptData.choices[0].message.content;
        const scoreMatch = responseText.match(/(\d+)(?=\s*\/|\s*out of|\s*points|\s*%|\b)/i);
        const score = scoreMatch ? parseInt(scoreMatch[0]) : 50; // Default to 50 if no valid score found
  
        console.log("Extracted score:", score);
        console.log("Updating submission with evaluation results...");
        
        // Update submission with evaluation results
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
          
          // Get the updated submission
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
            setShowScoreDialog(true);
            toast.success('Code evaluated and scored!');
          }
        }
      } catch (evalError) {
        console.error('Evaluation error:', evalError);
        toast.error('Code evaluation failed: ' + (evalError instanceof Error ? evalError.message : String(evalError)));
      }
    } catch (err) {
      console.error('Overall submission process error:', err);
      toast.error('Submission failed: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading states
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

  // Main UI
  return (
    <div className="h-screen flex flex-col relative">
      <BattleHeader 
        battle={battle}
        problem={problem}
        timeLeft={timeLeft}
        isTimerRunning={isTimerRunning}
        onStartTimer={startTimer}
      />

      <ResizablePanelGroup direction="horizontal" className="flex-grow">
        <ResizablePanel defaultSize={50} minSize={30}>
          <ProblemDisplay problem={problem} />
        </ResizablePanel>

        <ResizableHandle />

        <ResizablePanel defaultSize={50} minSize={30}>
          <CodeEditorSection 
            language={language}
            onCodeChange={setCode}
            onSubmit={handleSubmitCode}
            isSubmitting={isSubmitting}
            submissionResult={submissionResult}
            showScoreDialog={showScoreDialog}
            onShowScoreDialog={() => setShowScoreDialog(true)}
          />
        </ResizablePanel>
      </ResizablePanelGroup>

      <ChatWidget 
        messages={chatMessages}
        currentUsername={profile?.username || user?.id || ''}
        onSendMessage={handleSendChatMessage}
      />

      <ScoreDialog 
        open={showScoreDialog}
        onOpenChange={setShowScoreDialog}
        submission={submissionResult}
      />
    </div>
  );
};

export default BattleArena;
