
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
  const [usedFallback, setUsedFallback] = useState<boolean>(true);

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

        // Always use fallback questions for reliability since we're focusing on database schema right now
        const fallbackIndex = questionIndex % fallbackQuizQuestions.length;
        const fallbackQuestion = fallbackQuizQuestions[fallbackIndex];
        
        // Cache the fallback question
        questionsCache[questionIndex] = fallbackQuestion;
        
        setQuestion(fallbackQuestion.question);
        setOptions(fallbackQuestion.options);
        setCorrectAnswer(fallbackQuestion.correctAnswer);
        setExplanation(fallbackQuestion.explanation);
        setUsedFallback(true);
        
      } catch (err) {
        console.error('Error fetching question:', err);
        setError(err instanceof Error ? err : new Error('An unknown error occurred'));
        
        // Use fallback in case of error
        const fallbackIndex = questionIndex % fallbackQuizQuestions.length;
        const fallbackQuestion = fallbackQuizQuestions[fallbackIndex];
        
        setQuestion(fallbackQuestion.question);
        setOptions(fallbackQuestion.options);
        setCorrectAnswer(fallbackQuestion.correctAnswer);
        setExplanation(fallbackQuestion.explanation);
        setUsedFallback(true);
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
