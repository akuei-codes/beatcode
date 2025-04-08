
import React from 'react';
import { Problem } from '@/lib/problems';

interface ProblemDisplayProps {
  problem: Problem | null;
}

const ProblemDisplay: React.FC<ProblemDisplayProps> = ({ problem }) => {
  if (!problem) {
    return <div className="p-6">Loading problem...</div>;
  }

  return (
    <div className="h-full overflow-y-auto p-6 bg-icon-dark-gray text-sm leading-relaxed">
      <h2 className="text-xl font-bold mb-4">{problem.title}</h2>
      <p className="mb-6 whitespace-pre-wrap">{problem.question}</p>
      
      <h3 className="font-semibold text-lg mb-2">Examples:</h3>
      <div className="space-y-4">
        {problem.examples.map((example, idx) => (
          <pre key={idx} className="bg-icon-gray p-3 rounded-md font-mono text-xs whitespace-pre-wrap">
            {example}
          </pre>
        ))}
      </div>
      
      <h3 className="font-semibold text-lg mt-6 mb-2">Constraints:</h3>
      <ul className="list-disc ml-5 space-y-1 text-sm text-icon-light-gray">
        {problem.constraints.map((c, idx) => (
          <li key={idx} className="font-mono">{c}</li>
        ))}
      </ul>
    </div>
  );
};

export default ProblemDisplay;
