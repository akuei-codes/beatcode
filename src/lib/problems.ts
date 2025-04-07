
import { supabase, optimizedFetch } from './supabase';

export interface Problem {
  id: number;
  title: string;
  question: string;
  examples: string[];
  constraints: string[];
  difficulty: string;
  created_at?: string;
}

// Use a simple in-memory cache to avoid repeated database calls
const problemCache = new Map<number, Problem>();

export async function getRandomProblem(): Promise<Problem | null> {
  try {
    // Fetch problems from Supabase with limit to avoid loading too many records
    const { data, error } = await supabase
      .from('problems')
      .select('*')
      .order('id', { ascending: false })
      .limit(20); // Reduced limit for faster loading
    
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
    const problem = data[randomIndex];
    
    // Add to cache
    problemCache.set(problem.id, problem);
    
    return problem;
  } catch (error) {
    console.error('Failed to get random problem:', error);
    return null;
  }
}

export async function getProblemById(id: number): Promise<Problem | null> {
  try {
    // Check cache first
    if (problemCache.has(id)) {
      return problemCache.get(id) || null;
    }
    
    const { data, error } = await supabase
      .from('problems')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error fetching problem by id:', error);
      throw error;
    }
    
    // Cache the result
    if (data) {
      problemCache.set(id, data);
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
      .limit(50); // Reduced limit for faster loading
    
    if (error) {
      console.error('Error fetching problems:', error);
      throw error;
    }
    
    // Update cache
    if (data) {
      data.forEach(problem => problemCache.set(problem.id, problem));
    }
    
    return data || [];
  } catch (error) {
    console.error('Failed to get problems:', error);
    return [];
  }
}
