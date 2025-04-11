
import React, { useState, useEffect } from 'react';
import { supabase, Profile } from '@/lib/supabase';
import { toast } from 'sonner';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoaderCircle, Trophy, Medal, Star, Award, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const Leaderboard = () => {
  const [leaderboardData, setLeaderboardData] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, username, rating, avatar_url, created_at')
        .order('rating', { ascending: false })
        .limit(100);

      if (error) throw error;
      
      setLeaderboardData(data as Profile[]);
    } catch (error: any) {
      console.error('Error fetching leaderboard:', error);
      toast.error('Failed to load leaderboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Medal className="h-5 w-5 text-amber-600" />;
      default:
        return <Star className="h-5 w-5 text-blue-400" />;
    }
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 2200) return 'text-red-500';
    if (rating >= 1800) return 'text-orange-500';
    if (rating >= 1500) return 'text-purple-500';
    if (rating >= 1200) return 'text-blue-500';
    return 'text-green-500';
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold mb-2">ICON Leaderboard</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Top competitive coders ranked by their performance in algorithmic battles
        </p>
      </div>

      <div className="flex justify-end mb-4">
        <Button 
          variant="outline" 
          onClick={fetchLeaderboard} 
          className="flex items-center gap-2"
          disabled={isLoading}
        >
          {isLoading ? (
            <LoaderCircle className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Global Rankings</CardTitle>
          <CardDescription>
            The top 100 coders based on their ratings
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <LoaderCircle className="h-8 w-8 animate-spin text-icon-accent" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Rank</TableHead>
                    <TableHead>Coder</TableHead>
                    <TableHead className="text-right">Rating</TableHead>
                    <TableHead className="text-right hidden md:table-cell">Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leaderboardData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        No data available. Be the first to join the leaderboard!
                      </TableCell>
                    </TableRow>
                  ) : (
                    leaderboardData.map((user, index) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {getRankIcon(index + 1)}
                            <span>{index + 1}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={user.avatar_url || undefined} alt={user.username} />
                              <AvatarFallback className="bg-icon-dark-gray text-icon-accent">
                                {user.username?.charAt(0) || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{user.username}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge 
                            variant="outline" 
                            className={`${getRatingColor(user.rating)}`}
                          >
                            {user.rating}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground hidden md:table-cell">
                          {new Date(user.created_at).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mt-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Rating Legend</h2>
        <div className="flex flex-wrap justify-center gap-4">
          <Badge variant="outline" className="text-red-500 text-sm py-2 px-4">2200+ Expert</Badge>
          <Badge variant="outline" className="text-orange-500 text-sm py-2 px-4">1800-2199 Advanced</Badge>
          <Badge variant="outline" className="text-purple-500 text-sm py-2 px-4">1500-1799 Intermediate</Badge>
          <Badge variant="outline" className="text-blue-500 text-sm py-2 px-4">1200-1499 Regular</Badge>
          <Badge variant="outline" className="text-green-500 text-sm py-2 px-4">0-1199 Beginner</Badge>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
