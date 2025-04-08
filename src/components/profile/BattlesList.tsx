
import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Battle } from '@/lib/supabase';
import { 
  Card, 
  CardContent
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Trophy,
  ChevronsRight,
  Code,
  ShieldCheck,
  User,
  LoaderCircle
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface BattlesListProps {
  battles: Battle[];
  emptyMessage: string;
  isLoading: boolean;
}

const BattlesList: React.FC<BattlesListProps> = ({ battles, emptyMessage, isLoading }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Memoize language color mapping to avoid recalculating on every render
  const languageColors = useMemo(() => ({
    'javascript': 'bg-yellow-500',
    'python': 'bg-blue-600',
    'java': 'bg-red-600',
    'cpp': 'bg-purple-600',
    'typescript': 'bg-blue-500',
    'ruby': 'bg-red-500',
    'go': 'bg-cyan-500',
    'rust': 'bg-orange-600',
    'kotlin': 'bg-purple-500',
    'swift': 'bg-orange-500',
  }), []);

  // Memoize difficulty color function to avoid recalculating
  const getDifficultyColor = useMemo(() => (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'bg-green-500';
      case 'Medium': return 'bg-yellow-500';
      case 'Hard': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  }, []);

  const handleViewBattle = (battleId: string) => {
    navigate(`/battle/${battleId}`);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-48">
        <LoaderCircle className="animate-spin h-6 w-6 text-icon-accent" />
      </div>
    );
  }

  if (!battles || battles.length === 0) {
    return (
      <Card className="bg-card/50">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Code size={48} className="text-muted-foreground mb-4" />
          <p className="text-muted-foreground">{emptyMessage}</p>
        </CardContent>
      </Card>
    );
  }

  // Only render the most recent 10 battles to improve performance
  const recentBattles = battles.slice(0, 10);

  return (
    <div className="bg-card/50 rounded-lg border overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Language</TableHead>
              <TableHead>Difficulty</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Opponent</TableHead>
              <TableHead>Result</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recentBattles.map((battle) => (
              <TableRow key={battle.id}>
                <TableCell className="font-medium">
                  {new Date(battle.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <Badge className={`${languageColors[battle.programming_language.toLowerCase()] || 'bg-gray-500'}`}>
                    {battle.programming_language}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge className={getDifficultyColor(battle.difficulty)}>
                    {battle.difficulty}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={battle.status === 'completed' ? 'outline' : 'secondary'}>
                    {battle.status === 'completed' ? 'Completed' : 
                     battle.status === 'in_progress' ? 'In Progress' : 'Open'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <User size={14} />
                    {battle.creator_id === user?.id ? 'Defender' : 'Creator'}
                  </div>
                </TableCell>
                <TableCell>
                  {battle.status === 'completed' ? (
                    battle.winner_id === user?.id ? (
                      <div className="flex items-center text-green-500">
                        <Trophy size={16} className="mr-1" />
                        Won
                      </div>
                    ) : (
                      <div className="text-red-500">Lost</div>
                    )
                  ) : (
                    <div className="text-muted-foreground">-</div>
                  )}
                </TableCell>
                <TableCell>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => handleViewBattle(battle.id)}
                  >
                    <ChevronsRight size={14} className="mr-1" />
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {battles.length > 10 && (
        <div className="p-2 text-center text-sm text-muted-foreground">
          Showing 10 of {battles.length} battles for better performance
        </div>
      )}
    </div>
  );
};

export default React.memo(BattlesList);
