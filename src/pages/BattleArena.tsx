import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, Battle, Submission } from '@/lib/supabase';
import { toast } from 'sonner';
import { CodeEditor } from '@toast-ui/react-editor';
import '@toast-ui/editor/dist/toastui-editor.css';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  CheckCircle, 
  XCircle, 
  Loader2, 
  Play, 
  Stop, 
  Eye, 
  Copy,
  LoaderCircle
} from 'lucide-react';
import { defineProblem } from './problems/problem-definitions';
import { useQuery } from '@tanstack/react-query';

const BattleArena = () => {
  const { battleId } = useParams<{ battleId: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [battle, setBattle] = useState<Battle | null>(null);
  const [code, setCode] = useState('');
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<string | null>(null);
  const editorRef = useRef<CodeEditor>(null);
  const [problemDefinition, setProblemDefinition] = useState<ReturnType<typeof defineProblem> | null>(null);
  const [isCodeCopied, setIsCodeCopied] = useState(false);

  useEffect(() => {
    if (battleId && user) {
      fetchBattleDetails(battleId);
    }
  }, [battleId, user]);

  const fetchBattleDetails = async (battleId: string) => {
    try {
      const { data: battleData, error: battleError } = await supabase
        .from('battles')
        .select('*')
        .eq('id', battleId)
        .single();

      if (battleError) {
        console.error('Error fetching battle:', battleError);
        toast.error('Failed to load battle details.');
        return;
      }

      if (battleData) {
        setBattle(battleData);
        const problem = defineProblem(battleData.problem_id);
        setProblemDefinition(problem);
      } else {
        toast.error('Battle not found.');
        navigate('/join-battle');
      }
    } catch (error) {
      console.error('Error fetching battle:', error);
      toast.error('An unexpected error occurred.');
    }
  };

  useEffect(() => {
    if (battle?.id && user?.id) {
      fetchExistingSubmission(battle.id, user.id);
    }
  }, [battle?.id, user?.id]);

  const fetchExistingSubmission = async (battleId: string, userId: string) => {
    try {
      const { data: submissionData, error: submissionError } = await supabase
        .from('submissions')
        .select('*')
        .eq('battle_id', battleId)
        .eq('user_id', userId)
        .order('submitted_at', { ascending: false })
        .limit(1)
        .single();

      if (submissionError && submissionError.code !== 'PGRST116') {
        console.error('Error fetching submission:', submissionError);
        toast.error('Failed to load previous submission.');
        return;
      }

      if (submissionData) {
        setSubmission(submissionData);
        setCode(submissionData.code);
      }
    } catch (error) {
      console.error('Error fetching submission:', error);
      toast.error('An unexpected error occurred.');
    }
  };

  const handleSubmitCode = async () => {
    if (!battle || !user || !profile) return;

    setIsSubmitting(true);
    setEvaluationResult(null);

    try {
      const { data: submissionData, error: submissionError } = await supabase
        .from('submissions')
        .insert([
          {
            battle_id: battle.id,
            user_id: user.id,
            code: code,
            language: battle.programming_language,
            status: 'pending',
            submitted_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (submissionError) {
        console.error('Error submitting code:', submissionError);
        toast.error('Failed to submit code.');
        return;
      }

      if (submissionData) {
        setSubmission(submissionData);
        toast.success('Code submitted successfully!');
        evaluateCode(submissionData.id);
      }
    } catch (error) {
      console.error('Error submitting code:', error);
      toast.error('An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const evaluateCode = async (submissionId: string) => {
    if (!battle || !problemDefinition) return;

    setIsEvaluating(true);
    setEvaluationResult(null);

    try {
      // Simulate evaluation based on problem definition
      const testCases = problemDefinition.testCases;
      let allPassed = true;

      for (const testCase of testCases) {
        // Basic JavaScript evaluation (for demonstration purposes)
        try {
          const userFunction = new Function(`return ${code}`)();
          const result = userFunction(...testCase.input);
          if (result !== testCase.output) {
            allPassed = false;
            break;
          }
        } catch (evalError) {
          console.error('Evaluation error:', evalError);
          allPassed = false;
          break;
        }
      }

      const newStatus = allPassed ? 'correct' : 'incorrect';
      setEvaluationResult(allPassed ? 'All test cases passed!' : 'Some test cases failed.');

      // Update submission status in Supabase
      const { error: updateError } = await supabase
        .from('submissions')
        .update({ status: newStatus })
        .eq('id', submissionId);

      if (updateError) {
        console.error('Error updating submission status:', updateError);
        toast.error('Failed to update submission status.');
      } else {
        toast.success(`Evaluation complete: ${newStatus}`);
        setSubmission(prevSubmission => prevSubmission ? { ...prevSubmission, status: newStatus } : null);
        
        if (newStatus === 'correct') {
          await handleBattleCompletion(battle.id, user?.id);
        }
      }
    } catch (error) {
      console.error('Evaluation error:', error);
      toast.error('An error occurred during evaluation.');
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleBattleCompletion = async (battleId: string, userId: string | undefined) => {
    if (!battle || !user) return;
  
    try {
      // Update the battle status to 'completed' and set the winner
      const { error: updateError } = await supabase
        .from('battles')
        .update({ 
          status: 'completed',
          winner_id: userId,
          ended_at: new Date().toISOString()
        })
        .eq('id', battleId);
  
      if (updateError) {
        console.error('Error updating battle status:', updateError);
        toast.error('Failed to complete the battle.');
        return;
      }
  
      toast.success('Battle completed! You won!');
      setBattle(prevBattle => prevBattle ? { ...prevBattle, status: 'completed', winner_id: userId } : null);
    } catch (error) {
      console.error('Error completing battle:', error);
      toast.error('An error occurred while completing the battle.');
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code)
      .then(() => {
        setIsCodeCopied(true);
        toast.success('Code copied to clipboard!');
        setTimeout(() => setIsCodeCopied(false), 3000);
      })
      .catch(err => {
        console.error("Failed to copy code: ", err);
        toast.error('Failed to copy code to clipboard.');
      });
  };

  if (!battle || !problemDefinition) {
    return (
      <div className="flex justify-center items-center h-screen">
        <LoaderCircle className="animate-spin mr-2" size={32} />
        Loading battle details...
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">{problemDefinition.title}</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Problem Description */}
        <Card className="bg-card/80">
          <CardContent>
            <h2 className="text-lg font-semibold mb-2">Problem Description</h2>
            <p>{problemDefinition.description}</p>
            
            <h3 className="text-md font-semibold mt-4">Example:</h3>
            <pre className="bg-gray-100 p-2 rounded">
              <code>
                Input: {JSON.stringify(problemDefinition.example.input)}
                <br />
                Output: {JSON.stringify(problemDefinition.example.output)}
              </code>
            </pre>
          </CardContent>
        </Card>

        {/* Code Editor */}
        <Card className="bg-card/80">
          <CardContent>
            <h2 className="text-lg font-semibold mb-2">Code Editor</h2>
            
            <CodeEditor 
              language={battle.programming_language.toLowerCase()} 
              value={code}
              onChange={(value) => setCode(value)}
              placeholder="Write your solution here..."
            />

            <div className="flex justify-between mt-4">
              <Button 
                variant="secondary"
                onClick={handleCopyCode}
                disabled={isCodeCopied}
              >
                {isCodeCopied ? (
                  <>
                    <CheckCircle className="mr-2" size={16} />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="mr-2" size={16} />
                    Copy Code
                  </>
                )}
              </Button>
              <Button
                onClick={handleSubmitCode}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <LoaderCircle className="animate-spin mr-2" size={16} />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Play className="mr-2" size={16} />
                    Submit Code
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Submission Status and Results */}
      {submission && (
        <Card className="mt-4 bg-card/80">
          <CardContent>
            <h2 className="text-lg font-semibold mb-2">Submission Status</h2>
            {isEvaluating ? (
              <div className="flex items-center text-blue-500">
                <LoaderCircle className="animate-spin mr-2" size={20} />
                Evaluating...
              </div>
            ) : submission.status === 'correct' ? (
              <div className="flex items-center text-green-500">
                <CheckCircle className="mr-2" size={20} />
                Correct!
              </div>
            ) : submission.status === 'incorrect' ? (
              <div className="flex items-center text-red-500">
                <XCircle className="mr-2" size={20} />
                Incorrect.
              </div>
            ) : (
              <div className="flex items-center text-gray-500">
                <Loader2 className="animate-spin mr-2" size={20} />
                Pending Evaluation...
              </div>
            )}

            {evaluationResult && (
              <div className="mt-2">
                <strong>Result:</strong> {evaluationResult}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BattleArena;
