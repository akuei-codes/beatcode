
import { supabase } from './supabase';

export interface Problem {
  id: number;
  title: string;
  question: string;
  examples: string[];
  constraints: string[];
  difficulty: string;
  created_at?: string;
}

export async function getRandomProblem(): Promise<Problem | null> {
  try {
    // Fetch a random problem from Supabase
    const { data, error } = await supabase
      .from('problems')
      .select('*')
      .order('id', { ascending: false })
      .limit(100); // Limiting to avoid loading too many records
    
    if (error) {
      console.error('Error fetching problems:', error);
      throw error;
    }
    
    if (!data || data.length === 0) {
      console.error('No problems found');
      return null;
    }
    
    // Select a random problem from the results
    const randomIndex = Math.floor(Math.random() * data.length);
    return data[randomIndex];
    
  } catch (error) {
    console.error('Failed to get random problem:', error);
    return null;
  }
}

export async function getProblemById(id: number): Promise<Problem | null> {
  try {
    const { data, error } = await supabase
      .from('problems')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error fetching problem by id:', error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error(`Failed to get problem with id ${id}:`, error);
    return null;
  }
}

export async function getProblems(): Promise<Problem[]> {
  try {
    const { data, error } = await supabase
      .from('problems')
      .select('*')
      .order('id', { ascending: false })
      .limit(100);
    
    if (error) {
      console.error('Error fetching problems:', error);
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Failed to get problems:', error);
    return [];
  }
}
