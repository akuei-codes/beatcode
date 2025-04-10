
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { QuizQuestion } from '@/components/quiz/QuizQuestion';
import { QuizIntro } from '@/components/quiz/QuizIntro';
import { Trophy, RotateCcw } from 'lucide-react';

const Quizzes: React.FC = () => {
  const [quizStarted, setQuizStarted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [totalAnswered, setTotalAnswered] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [showSummary, setShowSummary] = useState(false);
  const navigate = useNavigate();

  const handleStartQuiz = () => {
    setQuizStarted(true);
    setCurrentQuestionIndex(0);
    setTotalAnswered(0);
    setCorrectAnswers(0);
    setShowSummary(false);
  };

  const handleQuestionAnswered = (isCorrect: boolean) => {
    setTotalAnswered(prev => prev + 1);
    if (isCorrect) {
      setCorrectAnswers(prev => prev + 1);
    }
    
    // Move to next question after a short delay
    setTimeout(() => {
      if (totalAnswered + 1 >= 5) {
        // Show summary after 5 questions
        setShowSummary(true);
      } else {
        setCurrentQuestionIndex(prev => prev + 1);
      }
    }, 1500);
  };

  const handleRestartQuiz = () => {
    handleStartQuiz();
  };

  const handleFinishQuiz = () => {
    navigate('/');
  };

  const renderQuizContent = () => {
    if (!quizStarted) {
      return <QuizIntro onStartQuiz={handleStartQuiz} />;
    }
    
    if (showSummary) {
      return (
        <Card className="w-full">
          <CardHeader className="text-center">
            <CardTitle className="flex justify-center items-center gap-2">
              <Trophy className="h-8 w-8 text-yellow-500" />
              Quiz Summary
            </CardTitle>
            <CardDescription>
              You've completed the algorithm practice quiz!
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center justify-center py-6">
              <div className="text-4xl font-bold mb-2">
                {correctAnswers} / {totalAnswered}
              </div>
              <div className="text-muted-foreground">
                Correct Answers
              </div>
              
              <div className="w-full mt-6 h-4 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary rounded-full" 
                  style={{
                    width: `${(correctAnswers / totalAnswered) * 100}%`
                  }}
                />
              </div>
              
              <div className="mt-2 text-sm text-muted-foreground">
                {Math.round((correctAnswers / totalAnswered) * 100)}% success rate
              </div>
            </div>
            
            <div className="flex flex-col space-y-2">
              <h3 className="font-medium">Performance Assessment:</h3>
              {correctAnswers === totalAnswered && (
                <div className="text-green-600">Perfect! You've mastered these concepts.</div>
              )}
              {correctAnswers >= totalAnswered * 0.8 && correctAnswers < totalAnswered && (
                <div className="text-green-600">Excellent! You have a strong understanding of these concepts.</div>
              )}
              {correctAnswers >= totalAnswered * 0.6 && correctAnswers < totalAnswered * 0.8 && (
                <div className="text-amber-600">Good job! You're on the right track with these concepts.</div>
              )}
              {correctAnswers < totalAnswered * 0.6 && (
                <div className="text-red-600">Keep practicing! These concepts need more review.</div>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row gap-4">
            <Button 
              variant="outline" 
              className="w-full sm:w-auto flex items-center gap-2"
              onClick={handleRestartQuiz}
            >
              <RotateCcw className="h-4 w-4" />
              Try Again
            </Button>
            <Button 
              className="w-full sm:w-auto"
              onClick={handleFinishQuiz}
            >
              Return Home
            </Button>
          </CardFooter>
        </Card>
      );
    }
    
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Question {currentQuestionIndex + 1}</span>
            <span className="text-sm text-muted-foreground">
              Score: {correctAnswers}/{totalAnswered}
            </span>
          </div>
          <Button variant="outline" size="sm" onClick={handleFinishQuiz}>
            Exit Quiz
          </Button>
        </div>
        
        <QuizQuestion 
          questionIndex={currentQuestionIndex}
          onAnswered={handleQuestionAnswered}
        />
      </div>
    );
  };

  return (
    <div className="container mx-auto py-10 px-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8 text-center">Algorithm Practice Arena</h1>
      {renderQuizContent()}
    </div>
  );
};

export default Quizzes;
