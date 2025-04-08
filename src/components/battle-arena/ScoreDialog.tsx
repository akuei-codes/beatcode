
import React from 'react';
import { Button } from '@/components/ui/button';
import { Submission } from '@/lib/supabase';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface ScoreDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  submission: Submission | null;
}

const ScoreDialog: React.FC<ScoreDialogProps> = ({ 
  open, 
  onOpenChange, 
  submission 
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-icon-dark-gray border border-icon-gray">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center text-icon-accent">
            You scored {submission?.score || 0}%
          </DialogTitle>
          <DialogDescription className="text-center mt-2 text-white">
            {submission?.feedback || 'Your code has been evaluated.'}
          </DialogDescription>
          <p className="text-sm text-icon-light-gray text-center mt-4">
            The winner will be announced once all players have submitted their solutions.
          </p>
        </DialogHeader>
        <Button className="w-full mt-4" onClick={() => onOpenChange(false)}>
          Close
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default ScoreDialog;
