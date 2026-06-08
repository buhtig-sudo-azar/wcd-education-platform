'use client';

import { useState, useRef, KeyboardEvent } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useChatStore } from '@/store/chat-store';

export function ChatInput({ systemPrompt }: { systemPrompt: string }) {
  const [input, setInput] = useState('');
  const { sendMessage, isLoading } = useChatStore();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    setInput('');
    await sendMessage(text, systemPrompt);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="p-2.5 sm:p-3 border-t border-border">
      <div className="flex gap-1.5 sm:gap-2">
        <Textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Задайте вопрос..."
          className="min-h-[38px] sm:min-h-[42px] max-h-20 sm:max-h-24 resize-none text-xs sm:text-sm"
          rows={1}
          disabled={isLoading}
        />
        <Button
          size="icon"
          onClick={handleSubmit}
          disabled={isLoading || !input.trim()}
          className="shrink-0 h-9 w-9 sm:h-10 sm:w-10"
        >
          <Send className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </Button>
      </div>
      <p className="text-[9px] sm:text-[10px] text-muted-foreground mt-1.5 hidden sm:block">
        Enter — отправить, Shift+Enter — новая строка
      </p>
    </div>
  );
}
