'use client';

import { ChatMessage as ChatMessageType } from '@/types';
import { User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { wcdAgent } from '@/data/agent-data';
import Image from 'next/image';

export function ChatMessage({ message }: { message: ChatMessageType }) {
  const isUser = message.role === 'user';

  return (
    <div className={cn('flex gap-2 animate-message-in', isUser && 'flex-row-reverse')}>
      <div className={cn(
        'shrink-0 w-7 h-7 rounded-full flex items-center justify-center overflow-hidden',
        isUser ? 'bg-primary text-primary-foreground' : 'border border-border'
      )}>
        {isUser ? (
          <User className="h-3.5 w-3.5" />
        ) : (
          <Image
            src={wcdAgent.avatar}
            alt={wcdAgent.name}
            width={28}
            height={28}
            className="w-full h-full object-cover"
          />
        )}
      </div>
      <div className={cn(
        'flex-1 min-w-0 rounded-lg px-4 py-2.5 text-base',
        isUser ? 'bg-primary text-primary-foreground' : 'bg-muted'
      )}>
        <div className="whitespace-pre-wrap break-words leading-relaxed">
          {message.content}
        </div>
      </div>
    </div>
  );
}
