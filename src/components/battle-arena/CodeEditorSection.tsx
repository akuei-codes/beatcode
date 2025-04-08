
import React from 'react';
import { Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import CodeEditor from '@/components/CodeEditor';
import { Submission } from '@/lib/supabase';

interface CodeEditorSectionProps {
  language: string;
  onCodeChange: (code: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  submissionResult: Submission | null;
  showScoreDialog: boolean;
  onShowScoreDialog: () => void;
}

const CodeEditorSection: React.FC<CodeEditorSectionProps> = ({
  language,
  onCodeChange,
  onSubmit,
  isSubmitting,
  submissionResult,
  showScoreDialog,
  onShowScoreDialog
}) => {
  return (
    <div className="h-full bg-icon-dark-gray p-4 flex flex-col">
      <CodeEditor language={language} onCodeChange={onCodeChange} />
      <Button
        className="mt-4 w-full icon-button-primary group"
        onClick={onSubmit}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</>
        ) : (
          <>
            Submit Code
            <Send className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </>
        )}
      </Button>
      {submissionResult && !showScoreDialog && (
        <div className="mt-4 p-3 border border-icon-gray rounded-md bg-icon-gray">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium">Submission Status:</span>
            <Badge variant="outline" className="ml-2">
              {submissionResult.status === 'evaluated' ? 'Evaluated' : submissionResult.status}
            </Badge>
          </div>
          {submissionResult.score !== null && (
            <div className="flex items-center mt-2">
              <span>Score: </span>
              <span className="font-bold ml-2 text-icon-accent">{submissionResult.score}%</span>
            </div>
          )}
          <Button 
            variant="outline" 
            className="mt-2 w-full text-xs" 
            onClick={onShowScoreDialog}
          >
            View Detailed Feedback
          </Button>
        </div>
      )}
    </div>
  );
};

export default CodeEditorSection;
