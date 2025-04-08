
import React, { useMemo } from 'react';
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent 
} from '@/components/ui/chart';
import { 
  Area, 
  AreaChart,
  CartesianGrid, 
  ResponsiveContainer, 
  Tooltip, 
  XAxis, 
  YAxis 
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { RatingHistory } from '@/lib/supabase';
import { format } from 'date-fns';

interface RatingHistoryChartProps {
  ratingHistory: RatingHistory[];
  isLoading?: boolean;
}

const RatingHistoryChart = ({ ratingHistory, isLoading = false }: RatingHistoryChartProps) => {
  const chartData = useMemo(() => {
    // Sort by date ascending
    const sortedHistory = [...ratingHistory].sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    
    return sortedHistory.map(entry => ({
      date: format(new Date(entry.created_at), 'MMM dd'),
      rating: entry.rating,
      fullDate: entry.created_at,
      notes: entry.notes
    }));
  }, [ratingHistory]);

  const firstRating = ratingHistory.length > 0 ? ratingHistory[0].rating : 1000;
  const lastRating = ratingHistory.length > 0 ? ratingHistory[ratingHistory.length - 1].rating : 1000;
  const ratingChange = lastRating - firstRating;
  const isRatingUp = ratingChange >= 0;

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl flex items-center gap-2">
            Rating History
          </CardTitle>
        </CardHeader>
        <CardContent className="h-60 flex items-center justify-center">
          <div className="animate-pulse bg-muted rounded-md w-full h-40"></div>
        </CardContent>
      </Card>
    );
  }

  if (ratingHistory.length <= 1) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl flex items-center gap-2">
            Rating History
          </CardTitle>
        </CardHeader>
        <CardContent className="h-60 flex items-center justify-center text-muted-foreground">
          Not enough data to show rating history.
          <br />
          Complete more battles to see your progress!
        </CardContent>
      </Card>
    );
  }

  const config = {
    rating: {
      label: 'Rating',
      theme: {
        light: '#0ea5e9',
        dark: '#0ea5e9',
      },
    },
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl flex items-center gap-2">
            Rating History
            <Badge 
              className={isRatingUp ? 'bg-green-500' : 'bg-red-500'}
              variant="secondary"
            >
              {isRatingUp ? (
                <TrendingUp className="h-3.5 w-3.5 mr-1" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5 mr-1" />
              )}
              {ratingChange > 0 ? '+' : ''}{ratingChange}
            </Badge>
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-60">
          <ChartContainer config={config}>
            <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <defs>
                <linearGradient id="colorRating" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                tickMargin={10}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickMargin={10}
                domain={['dataMin - 100', 'dataMax + 100']}
              />
              <Tooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(label, payload) => {
                      if (payload && payload.length > 0) {
                        const data = payload[0].payload;
                        if (data.fullDate) {
                          return format(new Date(data.fullDate), 'MMM dd, yyyy HH:mm');
                        }
                      }
                      return label;
                    }}
                  />
                }
              />
              <Area 
                type="monotone" 
                dataKey="rating" 
                stroke="#0ea5e9" 
                strokeWidth={2}
                fill="url(#colorRating)" 
                activeDot={{ r: 6 }}
              />
            </AreaChart>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default RatingHistoryChart;
