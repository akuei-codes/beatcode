
import { useState, useEffect } from 'react';
import { Flag, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LanguageSelect } from './LanguageSelect';
import { DifficultySelect } from './DifficultySelect';
import { DurationSelect } from './DurationSelect';
import { RatedSwitch } from './RatedSwitch';

interface BattleConfigFormProps {
  onSubmit: (config: BattleConfig) => Promise<void>;
  onChange?: (config: BattleConfig) => void;
  isLoading?: boolean;
}

export interface BattleConfig {
  language: string;
  difficulty: string;
  duration: string;
  isRated: boolean;
}

export const BattleConfigForm = ({ onSubmit, onChange, isLoading = false }: BattleConfigFormProps) => {
  const [language, setLanguage] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [duration, setDuration] = useState('');
  const [isRated, setIsRated] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  // Notify parent of changes
  useEffect(() => {
    if (onChange) {
      onChange({ language, difficulty, duration, isRated });
    }
  }, [language, difficulty, duration, isRated, onChange]);

  const handleSubmit = async () => {
    if (isCreating) return; // Prevent multiple submissions
    
    setIsCreating(true);
    try {
      await onSubmit({
        language,
        difficulty,
        duration,
        isRated
      });
    } catch (error) {
      console.error("Error in form submission:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleLanguageChange = (value: string) => {
    setLanguage(value);
  };

  const handleDifficultyChange = (value: string) => {
    setDifficulty(value);
  };

  const handleDurationChange = (value: string) => {
    setDuration(value);
  };

  const handleRatedChange = (value: boolean) => {
    setIsRated(value);
  };

  // Use the parent loading state if provided
  const buttonDisabled = isLoading || isCreating || !language || !difficulty || !duration;
  const showLoading = isLoading || isCreating;

  return (
    <Card className="bg-icon-dark-gray border-icon-gray">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Flag size={20} className="text-icon-accent" />
          Battle Configuration
        </CardTitle>
        <CardDescription>
          Set up your battle parameters below
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <LanguageSelect value={language} onValueChange={handleLanguageChange} />
        <DifficultySelect value={difficulty} onValueChange={handleDifficultyChange} />
        <DurationSelect value={duration} onValueChange={handleDurationChange} />
        <RatedSwitch checked={isRated} onCheckedChange={handleRatedChange} />
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button 
          className="icon-button-primary group"
          onClick={handleSubmit}
          disabled={buttonDisabled}
        >
          {showLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              Publish Battle
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};
