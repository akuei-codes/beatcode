
import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';

interface ChatMessage {
  id: string;
  sender: string;
  message: string;
  timestamp: string;
}

export function useBattleRealtime(
  battleId: string | undefined,
  userId: string | undefined,
  onMessageReceived: (message: ChatMessage) => void
) {
  const channelRef = useRef<ReturnType<typeof supabase.channel>>();

  useEffect(() => {
    if (!battleId || !userId) return;

    const channel = supabase.channel(`battle-chat-${battleId}`, {
      config: { 
        broadcast: { self: true } 
      }
    });

    channel
      .on('broadcast', { event: 'chat-message' }, (payload) => {
        const message = payload.payload as ChatMessage;
        onMessageReceived(message);
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [battleId, userId, onMessageReceived]);

  const sendMessage = (message: ChatMessage) => {
    if (!channelRef.current) return;
    
    channelRef.current.send({
      type: 'broadcast',
      event: 'chat-message',
      payload: message
    });
  };

  return { sendMessage };
}
