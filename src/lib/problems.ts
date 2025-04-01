
import problemsData from '../../problems.json';

export interface Problem {
  id: string;
  title: string;
  question: string;
  examples: string[];
  constraints: string[];
}

export function getRandomProblem(): Problem {
  const randomIndex = Math.floor(Math.random() * problemsData.length);
  return problemsData[randomIndex];
}

export function getProblemById(id: string): Problem | undefined {
  return problemsData.find(problem => problem.id === id);
}

export const getProblems = () => problemsData;
