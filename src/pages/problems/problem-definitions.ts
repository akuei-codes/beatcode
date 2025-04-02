
// This file defines the coding problems used in battles, including test cases for validation
// Note: For database-backed problems, we now use the problems.ts interface in lib/

// Define a consistent type for all problem definitions
export interface ProblemDefinition {
  id: string | number;
  title: string;
  description: string;
  example: {
    input: any[];
    output: any;
  };
  testCases: {
    input: any[];
    output: any;
  }[];
  constraints: string[];
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

// Main function to get problem definition by ID
export function defineProblem(problemId: string | number): ProblemDefinition {
  // Find the problem in our collection
  const problem = problems.find(p => String(p.id) === String(problemId));
  
  // Return the problem or a default one if not found
  if (!problem) {
    console.warn(`Problem with ID ${problemId} not found. Returning default problem.`);
    return problems[0]; // Return first problem as default
  }
  
  return problem;
}

// Collection of coding problems
const problems: ProblemDefinition[] = [
  {
    id: "1",
    title: "Two Sum",
    description: "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume that each input would have exactly one solution, and you may not use the same element twice.",
    example: {
      input: [[2, 7, 11, 15], 9],
      output: [0, 1]
    },
    testCases: [
      {
        input: [[2, 7, 11, 15], 9],
        output: [0, 1]
      },
      {
        input: [[3, 2, 4], 6],
        output: [1, 2]
      },
      {
        input: [[3, 3], 6],
        output: [0, 1]
      }
    ],
    constraints: [
      "2 <= nums.length <= 104",
      "-109 <= nums[i] <= 109",
      "-109 <= target <= 109",
      "Only one valid answer exists."
    ],
    difficulty: "Easy"
  },
  {
    id: "2",
    title: "Valid Parentheses",
    description: "Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid. An input string is valid if: 1. Open brackets must be closed by the same type of brackets. 2. Open brackets must be closed in the correct order. 3. Every close bracket has a corresponding open bracket of the same type.",
    example: {
      input: ["()"],
      output: true
    },
    testCases: [
      {
        input: ["()"],
        output: true
      },
      {
        input: ["()[]{}"],
        output: true
      },
      {
        input: ["(]"],
        output: false
      },
      {
        input: ["([)]"],
        output: false
      },
      {
        input: ["{[]}"],
        output: true
      }
    ],
    constraints: [
      "1 <= s.length <= 104",
      "s consists of parentheses only '()[]{}'"
    ],
    difficulty: "Easy"
  },
  {
    id: "3",
    title: "Palindrome Number",
    description: "Given an integer x, return true if x is a palindrome, and false otherwise. A palindrome is a number that reads the same backward as forward.",
    example: {
      input: [121],
      output: true
    },
    testCases: [
      {
        input: [121],
        output: true
      },
      {
        input: [-121],
        output: false
      },
      {
        input: [10],
        output: false
      },
      {
        input: [12321],
        output: true
      }
    ],
    constraints: [
      "-231 <= x <= 231 - 1"
    ],
    difficulty: "Easy"
  },
  {
    id: "4",
    title: "Reverse Integer",
    description: "Given a signed 32-bit integer x, return x with its digits reversed. If reversing x causes the value to go outside the signed 32-bit integer range [-231, 231 - 1], then return 0.",
    example: {
      input: [123],
      output: 321
    },
    testCases: [
      {
        input: [123],
        output: 321
      },
      {
        input: [-123],
        output: -321
      },
      {
        input: [120],
        output: 21
      },
      {
        input: [0],
        output: 0
      }
    ],
    constraints: [
      "-231 <= x <= 231 - 1"
    ],
    difficulty: "Medium"
  },
  {
    id: "5",
    title: "FizzBuzz",
    description: "Write a function that returns an array containing the numbers from 1 to n. But for multiples of 3, the array should contain 'Fizz' instead of the number, for multiples of 5, it should contain 'Buzz', and for multiples of both 3 and 5, it should contain 'FizzBuzz'.",
    example: {
      input: [15],
      output: [1,2,"Fizz",4,"Buzz","Fizz",7,8,"Fizz","Buzz",11,"Fizz",13,14,"FizzBuzz"]
    },
    testCases: [
      {
        input: [3],
        output: [1, 2, "Fizz"]
      },
      {
        input: [5],
        output: [1, 2, "Fizz", 4, "Buzz"]
      },
      {
        input: [15],
        output: [1, 2, "Fizz", 4, "Buzz", "Fizz", 7, 8, "Fizz", "Buzz", 11, "Fizz", 13, 14, "FizzBuzz"]
      }
    ],
    constraints: [
      "1 <= n <= 10^4"
    ],
    difficulty: "Easy"
  }
];

// Export the problems collection if needed elsewhere
export const allProblems = problems;

// Helper function to get problems by difficulty
export function getProblemsByDifficulty(difficulty: 'Easy' | 'Medium' | 'Hard'): ProblemDefinition[] {
  return problems.filter(p => p.difficulty === difficulty);
}
