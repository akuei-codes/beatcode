
import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ChatMessage {
  id: string;
  sender: string;
  message: string;
  timestamp: string;
}

interface ChatWidgetProps {
  messages: ChatMessage[];
  currentUsername: string;
  onSendMessage: (message: string) => void;
}

const ChatWidget: React.FC<ChatWidgetProps> = ({ 
  messages, 
  currentUsername,
  onSendMessage 
}) => {
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatPosition, setChatPosition] = useState({ x: 100, y: 100 });
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const chatBubbleRef = useRef<HTMLDivElement>(null);
  const dragOffset = useRef({ x: 0, y: 0 });

  // Scroll to bottom when messages change
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const startDrag = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = chatBubbleRef.current?.getBoundingClientRect();
    if (rect) {
      dragOffset.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
    document.addEventListener('mousemove', onDrag);
    document.addEventListener('mouseup', endDrag);
  };

  const onDrag = (e: MouseEvent) => {
    setChatPosition({
      x: e.clientX - dragOffset.current.x,
      y: e.clientY - dragOffset.current.y,
    });
  };

  const endDrag = () => {
    document.removeEventListener('mousemove', onDrag);
    document.removeEventListener('mouseup', endDrag);
  };

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;
    onSendMessage(chatInput.trim());
    setChatInput('');
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  return (
    <div
      ref={chatBubbleRef}
      onMouseDown={startDrag}
      style={{ position: 'absolute', left: chatPosition.x, top: chatPosition.y }}
      className="z-50 cursor-move"
    >
      <button
        onClick={() => setChatOpen(!chatOpen)}
        className="bg-icon-accent text-icon-black w-12 h-12 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform relative"
      >
        <MessageCircle />
        {messages.length > 0 && !chatOpen && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {messages.length}
          </span>
        )}
      </button>

      {chatOpen && (
        <div className="mt-2 w-80 h-96 bg-icon-dark-gray border border-icon-gray rounded-lg p-4 flex flex-col shadow-lg">
          <div className="flex justify-between items-center mb-2 pb-2 border-b border-icon-gray">
            <h3 className="font-medium">Battle Chat</h3>
            <Badge variant="outline">{messages.length} messages</Badge>
          </div>
          
          <ScrollArea className="flex-grow mb-2" ref={chatContainerRef}>
            <div className="space-y-2 pr-2">
              {messages.length === 0 ? (
                <p className="text-center text-gray-500 italic text-sm py-4">
                  No messages yet. Start the conversation!
                </p>
              ) : (
                messages.map((msg) => (
                  <div 
                    key={msg.id} 
                    className={`rounded-lg p-2 text-sm ${
                      msg.sender === currentUsername 
                        ? 'bg-teal-600 ml-8 text-white' 
                        : 'bg-icon-gray mr-8'
                    }`}
                  >
                    <div className="font-semibold text-xs opacity-70">
                      {msg.sender === currentUsername ? 'You' : msg.sender}
                    </div>
                    {msg.message}
                    <div className="text-right text-xs opacity-50 mt-1">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
          
          <div className="flex gap-2 mt-2">
            <Input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-grow bg-icon-gray text-white text-sm"
              placeholder="Type message..."
            />
            <Button size="icon" onClick={handleSendMessage} disabled={!chatInput.trim()}>
              <Send size={16} />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatWidget;
