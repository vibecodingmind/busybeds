'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  MessageCircle, 
  Send, 
  Bot, 
  User, 
  X, 
  Minimize2, 
  Maximize2,
  Sparkles,
  Hotel,
  Loader2
} from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface HotelChatbotProps {
  isOpen?: boolean;
  onToggle?: () => void;
  position?: 'bottom-right' | 'bottom-left';
  primaryColor?: string;
}

export default function HotelChatbot({ 
  isOpen: externalIsOpen,
  onToggle,
  position = 'bottom-right',
  primaryColor = '#E8395A'
}: HotelChatbotProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isOpen = externalIsOpen ?? internalIsOpen;

  const toggleChat = () => {
    if (onToggle) {
      onToggle();
    } else {
      setInternalIsOpen(!internalIsOpen);
    }
    if (!isOpen) {
      setIsMinimized(false);
    }
  };

  useEffect(() => {
    if (isOpen && !isMinimized && messages.length === 0) {
      // Add welcome message
      setMessages([{
        id: '1',
        role: 'assistant',
        content: "Hi there! 👋 I'm your BusyBeds AI assistant! I can help you find the perfect hotel based on your preferences.\n\nTell me about your ideal stay - where do you want to go, what's your budget, and what amenities matter most to you?",
        timestamp: new Date()
      }]);
    }
  }, [isOpen, isMinimized, messages.length]);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    // Focus input when chat opens
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, isMinimized]);

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content
          }))
        })
      });

      const data = await response.json();

      if (data.success && data.message) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.message,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        throw new Error(data.error || 'Failed to get response');
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm sorry, I encountered an error. Please try again! 🙏",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const quickActions = [
    { label: '🏖️ Beach hotels', query: 'I want a beach hotel for a relaxing vacation' },
    { label: '🦁 Safari lodges', query: 'Show me safari lodges for wildlife viewing' },
    { label: '💰 Budget stays', query: 'I need affordable hotels under $100/night' },
    { label: '⭐ Luxury resorts', query: 'I want a luxury 5-star resort experience' }
  ];

  const positionClasses = position === 'bottom-right' 
    ? 'right-4 sm:right-6' 
    : 'left-4 sm:left-6';

  if (!isOpen) {
    return (
      <button
        onClick={toggleChat}
        className={`fixed bottom-4 ${positionClasses} z-50 flex items-center gap-2 px-4 py-3 rounded-full text-white font-semibold shadow-lg transition-all hover:scale-105 hover:shadow-xl`}
        style={{ 
          background: `linear-gradient(135deg, ${primaryColor}, #C41F40)`,
          boxShadow: `0 4px 20px ${primaryColor}40`
        }}
      >
        <MessageCircle className="w-5 h-5" />
        <span className="hidden sm:inline">AI Assistant</span>
        <Sparkles className="w-4 h-4 opacity-80" />
      </button>
    );
  }

  if (isMinimized) {
    return (
      <button
        onClick={() => setIsMinimized(false)}
        className={`fixed bottom-4 ${positionClasses} z-50 flex items-center gap-2 px-4 py-3 rounded-full text-white font-semibold shadow-lg transition-all hover:scale-105`}
        style={{ 
          background: `linear-gradient(135deg, ${primaryColor}, #C41F40)`,
          boxShadow: `0 4px 20px ${primaryColor}40`
        }}
      >
        <Bot className="w-5 h-5" />
        <span className="hidden sm:inline">Chat with AI</span>
        <Badge variant="secondary" className="bg-white/20 text-white border-0 text-xs">
          {messages.length}
        </Badge>
      </button>
    );
  }

  return (
    <Card 
      className={`fixed bottom-4 ${positionClasses} z-50 w-[calc(100%-2rem)] sm:w-96 shadow-2xl border-0 overflow-hidden`}
      style={{ 
        height: 'min(600px, calc(100vh - 100px))',
        borderRadius: '1rem'
      }}
    >
      {/* Header */}
      <CardHeader 
        className="p-4 text-white flex flex-row items-center justify-between space-y-0"
        style={{ 
          background: `linear-gradient(135deg, ${primaryColor}, #C41F40)`
        }}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            <Hotel className="w-5 h-5" />
          </div>
          <div>
            <CardTitle className="text-base font-bold">BusyBeds AI</CardTitle>
            <p className="text-xs text-white/80">Hotel Recommendations</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-white hover:bg-white/20"
            onClick={() => setIsMinimized(true)}
          >
            <Minimize2 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-white hover:bg-white/20"
            onClick={toggleChat}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>

      {/* Messages */}
      <CardContent className="p-0 flex flex-col" style={{ height: 'calc(100% - 72px)' }}>
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.role === 'assistant' && (
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: `${primaryColor}20` }}
                  >
                    <Bot className="w-4 h-4" style={{ color: primaryColor }} />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                    message.role === 'user'
                      ? 'text-white rounded-br-sm'
                      : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                  }`}
                  style={message.role === 'user' ? { 
                    background: `linear-gradient(135deg, ${primaryColor}, #C41F40)` 
                  } : {}}
                >
                  <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                </div>
                {message.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-gray-600" />
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: `${primaryColor}20` }}
                >
                  <Bot className="w-4 h-4" style={{ color: primaryColor }} />
                </div>
                <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-3">
                  <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Quick Actions */}
        {messages.length <= 1 && (
          <div className="px-4 pb-2">
            <p className="text-xs text-gray-500 mb-2">Quick start:</p>
            <div className="flex flex-wrap gap-2">
              {quickActions.map((action, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setInputValue(action.query);
                    inputRef.current?.focus();
                  }}
                  className="text-xs px-3 py-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
                >
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="p-4 border-t border-gray-100">
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about hotels..."
              className="flex-1 rounded-full border-gray-200 focus:border-gray-300"
              disabled={isLoading}
            />
            <Button
              onClick={sendMessage}
              disabled={!inputValue.trim() || isLoading}
              className="rounded-full px-4"
              style={{ background: primaryColor }}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
