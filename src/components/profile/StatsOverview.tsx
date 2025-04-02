
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Code, Award, BarChart2 } from 'lucide-react';

interface StatsProps {
  stats: {
    totalBattles: number;
    wins: number;
    rating: number;
    winRate: number;
  };
}

const StatsOverview: React.FC<StatsProps> = ({ stats }) => {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Rating
          </CardTitle>
          <Trophy className="h-4 w-4 text-yellow-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.rating}</div>
          <p className="text-xs text-muted-foreground">
            Current skill rating
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Total Battles
          </CardTitle>
          <Code className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalBattles}</div>
          <p className="text-xs text-muted-foreground">
            Completed coding battles
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Wins
          </CardTitle>
          <Award className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.wins}</div>
          <p className="text-xs text-muted-foreground">
            Battles won
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Win Rate
          </CardTitle>
          <BarChart2 className="h-4 w-4 text-violet-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.winRate}%</div>
          <p className="text-xs text-muted-foreground">
            Percentage of battles won
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default StatsOverview;
