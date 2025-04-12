
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Save, X, Send } from 'lucide-react';
import { toast } from 'sonner';

interface CodeEditorProps {
  language: string;
  initialCode?: string;
  onCodeChange?: (code: string) => void;
  onRunCode?: (code: string) => void;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ 
  language, 
  initialCode = '', 
  onCodeChange, 
  onRunCode 
}) => {
  const [code, setCode] = useState(initialCode);
  const [output, setOutput] = useState<string | null>(null);
  const [isOutputOpen, setIsOutputOpen] = useState(false);
  const [isEstimating, setIsEstimating] = useState(false);
  
  // Map language to starter code
  useEffect(() => {
    let starterCode = '';
    
    switch (language) {
      case 'javascript':
        starterCode = `/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number[]}
 */
function solution(nums, target) {
  // Your code here
  
  return [];
}
`;
        break;
      case 'python':
        starterCode = `def solution(nums, target):
    # Your code here
    
    return []
`;
        break;
      case 'java':
        starterCode = `class Solution {
    public int[] solution(int[] nums, int target) {
        // Your code here
        
        return new int[0];
    }
}
`;
        break;
      case 'cpp':
        starterCode = `class Solution {
public:
    vector<int> solution(vector<int>& nums, int target) {
        // Your code here
        
        return {};
    }
};
`;
        break;
      case 'csharp':
        starterCode = `public class Solution {
    public int[] Solution(int[] nums, int target) {
        // Your code here
        
        return new int[0];
    }
}
`;
        break;
      default:
        starterCode = '// Start coding here';
    }
    
    setCode(initialCode || starterCode);
  }, [language, initialCode]);
  
  useEffect(() => {
    if (onCodeChange) {
      onCodeChange(code);
    }
  }, [code, onCodeChange]);
  
  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCode(e.target.value);
  };
  
  const handleRunCode = async () => {
    if (code.trim() === '') {
      toast.error("Code cannot be empty");
      return;
    }
    
    setIsEstimating(true);
    setOutput("Analyzing your code...");
    setIsOutputOpen(true);
    
    try {
      // Call GPT API to estimate test case passing rate
      const response = await fetch("https://icon-scoring.openai.azure.com/openai/deployments/gpt-4o/chat/completions?api-version=2025-01-01-preview", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-key": "CKaJ47ef5qAohlZnQOd0fiJMDbisb6vz231KPbGHvyUFlZ6ldeVxJQQJ99BDACHYHv6XJ3w3AAABACOG0cot"
        },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content: "You are a code analyzer. Analyze the given code and estimate how many test cases out of 50 it might pass. Respond with ONLY a number followed by '/50' and a very brief comment. Format: 'Estimated: X/50 - Brief comment'"
            },
            {
              role: "user",
              content: `Language: ${language}\n\nCode:\n${code}`
            }
          ],
          temperature: 0.3,
          max_tokens: 100,
          top_p: 1,
        })
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Extract the response content
      const estimationResponse = data.choices[0].message.content;
      setOutput(estimationResponse);
      
      if (onRunCode) {
        onRunCode(code);
      }
    } catch (error) {
      console.error('Error estimating test cases:', error);
      setOutput("Error analyzing code. Please try again.");
    } finally {
      setIsEstimating(false);
    }
  };
  
  const handleSaveCode = () => {
    // In a real app, this would save the code to the backend
    toast.success("Code saved successfully");
  };
  
  const getLanguageClass = (lang: string) => {
    switch (lang) {
      case 'javascript': return 'language-javascript';
      case 'python': return 'language-python';
      case 'java': return 'language-java';
      case 'cpp': return 'language-cpp';
      case 'csharp': return 'language-csharp';
      default: return 'language-javascript';
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Editor toolbar */}
      <div className="bg-icon-gray px-4 py-2 flex items-center justify-between rounded-t-md">
        <div className="flex items-center space-x-2">
          <div className="h-3 w-3 rounded-full bg-red-500"></div>
          <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
          <div className="h-3 w-3 rounded-full bg-green-500"></div>
          <span className="ml-2 text-icon-light-gray text-sm">
            {language.charAt(0).toUpperCase() + language.slice(1)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSaveCode}
            className="h-8 text-xs hover:bg-icon-gray/70"
          >
            <Save size={14} className="mr-1" />
            Save
          </Button>
          <Button
            size="sm"
            onClick={handleRunCode}
            disabled={isEstimating}
            className="h-8 text-xs bg-icon-accent text-icon-black hover:brightness-105"
          >
            {isEstimating ? (
              <span className="animate-pulse">Analyzing...</span>
            ) : (
              <>
                <Play size={14} className="mr-1" />
                Run
              </>
            )}
          </Button>
        </div>
      </div>
      
      {/* Code editor */}
      <div className="flex-grow flex flex-col">
        <textarea
          value={code}
          onChange={handleCodeChange}
          className={`flex-grow p-4 bg-icon-dark-gray text-icon-white font-mono text-sm resize-none outline-none ${getLanguageClass(language)}`}
          spellCheck="false"
          placeholder="Write your solution here..."
        />
      </div>
      
      {/* Output console */}
      {isOutputOpen && output && (
        <div className="border-t border-icon-gray">
          <div className="bg-icon-gray px-4 py-2 flex items-center justify-between">
            <span className="text-sm font-medium">Run Result</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setIsOutputOpen(false)}
            >
              <X size={14} />
            </Button>
          </div>
          <pre className="p-4 bg-icon-black text-icon-light-gray font-mono text-sm h-40 overflow-auto">
            {output}
          </pre>
        </div>
      )}
    </div>
  );
};

export default CodeEditor;
