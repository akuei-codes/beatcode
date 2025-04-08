
import { useState, useEffect, useRef } from 'react';

export function useBattleTimer(durationInMinutes: number | undefined) {
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Set initial time when battle duration is available
  useEffect(() => {
    if (durationInMinutes) {
      setTimeLeft(durationInMinutes * 60);
    }
  }, [durationInMinutes]);

  // Timer logic
  useEffect(() => {
    if (timeLeft !== null && isTimerRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev === null) return null;
          if (prev <= 0) {
            clearInterval(timerRef.current!);
            setIsTimerRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerRunning, timeLeft]);

  const startTimer = () => setIsTimerRunning(true);
  const pauseTimer = () => setIsTimerRunning(false);
  const resetTimer = () => {
    if (durationInMinutes) {
      setTimeLeft(durationInMinutes * 60);
      setIsTimerRunning(false);
    }
  };

  return { timeLeft, isTimerRunning, startTimer, pauseTimer, resetTimer };
}
