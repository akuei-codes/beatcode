
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { getRandomProblem } from '@/lib/problems';
import { useAuth } from '@/contexts/AuthContext';
import { BattleConfigForm, BattleConfig } from '@/components/battle/BattleConfigForm';
import { BattlePreview } from '@/components/battle/BattlePreview';

const CreateBattle = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [formState, setFormState] = useState<BattleConfig>({
    language: '',
    difficulty: '',
    duration: '',
    isRated: true
  });

  const handleCreateBattle = async (config: BattleConfig) => {
    // Validation
    if (!config.language || !config.difficulty || !config.duration) {
      toast.error("Please fill in all fields");
      return;
    }

    if (!user) {
      toast.error("You must be logged in to create a battle");
      navigate('/login');
      return;
    }

    try {
      // Get a random problem
      const randomProblem = getRandomProblem();
      
      // Create battle in Supabase
      const { data: battle, error } = await supabase
        .from('battles')
        .insert([
          {
            creator_id: user.id,
            language: config.language,
            difficulty: config.difficulty,
            duration: parseInt(config.duration),
            is_rated: config.isRated,
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
    }
  };

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

        <BattleConfigForm 
          onSubmit={handleCreateBattle}
          onChange={setFormState}
        />

        <BattlePreview 
          language={formState.language}
          difficulty={formState.difficulty}
          duration={formState.duration}
        />
      </div>
    </div>
  );
};

export default CreateBattle;
