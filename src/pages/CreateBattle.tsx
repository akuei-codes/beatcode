
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Code, 
  ChevronDown, 
  Timer, 
  Flag, 
  ArrowRight, 
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { supabase } from '@/lib/supabase';
import { getRandomProblem } from '@/lib/problems';
import { useAuth } from '@/contexts/AuthContext';

const CreateBattle = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [language, setLanguage] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [duration, setDuration] = useState('');
  const [isRated, setIsRated] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateBattle = async () => {
    // Validation
    if (!language || !difficulty || !duration) {
      toast.error("Please fill in all fields");
      return;
    }

    if (!user) {
      toast.error("You must be logged in to create a battle");
      navigate('/login');
      return;
    }

    setIsCreating(true);

    try {
      // Get a random problem
      const randomProblem = getRandomProblem();
      
      // Create battle in Supabase
      const { data: battle, error } = await supabase
        .from('battles')
        .insert([
          {
            creator_id: user.id,
            language,
            difficulty,
            duration: parseInt(duration),
            is_rated: isRated, // This matches the DB field name
            status: 'waiting',
            problem_id: randomProblem.id
          }
        ])
        .select()
        .single();
      
      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }
      
      if (!battle) {
        throw new Error("No battle data returned");
      }
      
      toast.success("Battle created successfully!");
      navigate(`/battle/${battle.id}`);
    } catch (error) {
      console.error('Error creating battle:', error);
      toast.error("Failed to create battle. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  const languageOptions = [
    { value: 'javascript', label: 'JavaScript' },
    { value: 'python', label: 'Python' },
    { value: 'java', label: 'Java' },
    { value: 'cpp', label: 'C++' },
    { value: 'csharp', label: 'C#' }
  ];

  const difficultyOptions = [
    { value: 'easy', label: 'Easy', points: 10 },
    { value: 'medium', label: 'Medium', points: 25 },
    { value: 'hard', label: 'Hard', points: 50 }
  ];

  const durationOptions = [
    { value: '5', label: '5 minutes' },
    { value: '10', label: '10 minutes' },
    { value: '15', label: '15 minutes' },
    { value: '30', label: '30 minutes' },
    { value: '60', label: '60 minutes' }
  ];

  return (
    <div className="min-h-screen pt-10 pb-20 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight">
            Create a Battle
          </h1>
          <p className="mt-3 text-icon-light-gray max-w-2xl mx-auto">
            Configure your coding battle and challenge others to compete with you in solving algorithmic problems.
          </p>
        </div>

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
            <div className="space-y-1.5">
              <Label className="text-sm text-icon-light-gray">Programming Language</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="icon-input flex items-center">
                  <Code size={16} className="mr-2 text-icon-accent" />
                  <SelectValue placeholder="Select language" />
                  <ChevronDown size={16} className="ml-auto text-icon-light-gray" />
                </SelectTrigger>
                <SelectContent className="bg-icon-dark-gray border-icon-gray">
                  {languageOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value} className="focus:bg-icon-gray">
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-1.5">
              <Label className="text-sm text-icon-light-gray">Difficulty Level</Label>
              <Select value={difficulty} onValueChange={setDifficulty}>
                <SelectTrigger className="icon-input flex items-center">
                  <SelectValue placeholder="Select difficulty" />
                  <ChevronDown size={16} className="ml-auto text-icon-light-gray" />
                </SelectTrigger>
                <SelectContent className="bg-icon-dark-gray border-icon-gray">
                  {difficultyOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value} className="focus:bg-icon-gray">
                      <div className="flex items-center justify-between w-full">
                        <span>{option.label}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-icon-accent/20 text-icon-accent">
                          {option.points} points
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-1.5">
              <Label className="text-sm text-icon-light-gray">Battle Duration</Label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger className="icon-input flex items-center">
                  <Timer size={16} className="mr-2 text-icon-accent" />
                  <SelectValue placeholder="Select time limit" />
                  <ChevronDown size={16} className="ml-auto text-icon-light-gray" />
                </SelectTrigger>
                <SelectContent className="bg-icon-dark-gray border-icon-gray">
                  {durationOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value} className="focus:bg-icon-gray">
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-icon-gray/30">
              <div className="space-y-0.5">
                <Label className="text-sm text-icon-white">Rated Battle</Label>
                <p className="text-xs text-icon-light-gray">
                  Affects player ratings when completed
                </p>
              </div>
              <Switch
                checked={isRated}
                onCheckedChange={setIsRated}
                className="data-[state=checked]:bg-icon-accent"
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button 
              className="icon-button-primary group"
              onClick={handleCreateBattle}
              disabled={isCreating}
            >
              {isCreating ? (
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

        {difficulty && (
          <div className="mt-8 bg-icon-dark-gray border border-icon-gray rounded-lg p-5 animate-fade-in">
            <h3 className="text-lg font-medium mb-2 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-icon-accent"></span>
              Battle Preview
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="bg-icon-gray/50 p-3 rounded">
                <p className="text-icon-light-gray mb-1">Language</p>
                <p className="font-medium">{languageOptions.find(l => l.value === language)?.label || 'Not selected'}</p>
              </div>
              <div className="bg-icon-gray/50 p-3 rounded">
                <p className="text-icon-light-gray mb-1">Difficulty</p>
                <p className="font-medium flex items-center">
                  {difficultyOptions.find(d => d.value === difficulty)?.label || 'Not selected'}
                  {difficulty && (
                    <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-icon-accent/20 text-icon-accent">
                      {difficultyOptions.find(d => d.value === difficulty)?.points} points
                    </span>
                  )}
                </p>
              </div>
              <div className="bg-icon-gray/50 p-3 rounded">
                <p className="text-icon-light-gray mb-1">Duration</p>
                <p className="font-medium">{durationOptions.find(d => d.value === duration)?.label || 'Not selected'}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateBattle;
