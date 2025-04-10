
import { useState, useEffect } from 'react';
import { fallbackQuizQuestions } from '@/data/fallbackQuizQuestions';

interface QuizQuestionData {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

interface AnswerResult {
  isCorrect: boolean;
  explanation: string;
}

// This is our cache to avoid fetching the same question multiple times
const questionsCache: Record<number, QuizQuestionData> = {};

export function useQuizQuestion(questionIndex: number) {
  const [question, setQuestion] = useState<string>('');
  const [options, setOptions] = useState<string[]>([]);
  const [correctAnswer, setCorrectAnswer] = useState<string>('');
  const [explanation, setExplanation] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [usedFallback, setUsedFallback] = useState<boolean>(false);

  useEffect(() => {
    const fetchQuestion = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Check if we have cached this question
        if (questionsCache[questionIndex]) {
          const cachedQuestion = questionsCache[questionIndex];
          setQuestion(cachedQuestion.question);
          setOptions(cachedQuestion.options);
          setCorrectAnswer(cachedQuestion.correctAnswer);
          setExplanation(cachedQuestion.explanation);
          setIsLoading(false);
          return;
        }

        // Try to fetch from the API
        try {
          const apiKey = import.meta.env.VITE_OPENAI_API_KEY || 'sk-7ksyGH8qcGrsDJD1lxoLpR4fF8HjTaQB9jP1XtLUdRqONu51'; 
          
          const response = await fetch('https://icon-scoring.openai.azure.com/openai/deployments/gpt-4o/chat/completions?api-version=2025-01-01-preview', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'api-key': apiKey
            },
            body: JSON.stringify({
              messages: [
                {
                  role: 'system',
                  content: `You are a quiz generator for data structures and algorithms. Generate a multiple-choice question with exactly 4 options (A, B, C, D). Format your response as a JSON object with these fields:
                  {
                    "question": "The full question text",
                    "options": ["Option A", "Option B", "Option C", "Option D"],
                    "correctAnswer": "The correct option text (exactly matching one of the options)",
                    "explanation": "A detailed explanation of why the answer is correct"
                  }
                  Make the question challenging but fair. Include code snippets if relevant.`
                }
              ],
              temperature: 0.7,
              max_tokens: 1000
            }),
            signal: AbortSignal.timeout(5000) // 5 second timeout
          });

          if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
          }

          const data = await response.json();
          const content = data.choices[0].message.content;
          
          // Parse the JSON response
          const questionData: QuizQuestionData = JSON.parse(content);
          
          // Cache the question
          questionsCache[questionIndex] = questionData;
          
          setQuestion(questionData.question);
          setOptions(questionData.options);
          setCorrectAnswer(questionData.correctAnswer);
          setExplanation(questionData.explanation);
          setUsedFallback(false);
        } catch (apiError) {
          console.warn('Error using OpenAI API, falling back to local questions:', apiError);
          
          // Use a fallback question
          const fallbackIndex = questionIndex % fallbackQuizQuestions.length;
          const fallbackQuestion = fallbackQuizQuestions[fallbackIndex];
          
          // Cache the fallback question
          questionsCache[questionIndex] = fallbackQuestion;
          
          setQuestion(fallbackQuestion.question);
          setOptions(fallbackQuestion.options);
          setCorrectAnswer(fallbackQuestion.correctAnswer);
          setExplanation(fallbackQuestion.explanation);
          setUsedFallback(true);
        }
      } catch (err) {
        console.error('Error fetching question:', err);
        setError(err instanceof Error ? err : new Error('An unknown error occurred'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuestion();
  }, [questionIndex]);

  const checkAnswer = async (selectedOption: string): Promise<AnswerResult> => {
    const isCorrect = selectedOption === correctAnswer;
    
    return { 
      isCorrect, 
      explanation: explanation || (isCorrect ? 
        "Correct! Well done." : 
        `Incorrect. The correct answer is: ${correctAnswer}`)
    };
  };

  return {
    question,
    options,
    isLoading,
    error,
    checkAnswer,
    usedFallback
  };
}
