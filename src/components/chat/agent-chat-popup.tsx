'use client';

import { useChatStore } from '@/store/chat-store';
import { useNavigationStore } from '@/store/navigation-store';
import { chatSystemPrompt } from '@/data/agent-data';
import { wcdAgent } from '@/data/agent-data';
import { ChatMessage } from './chat-message';
import { ChatInput } from './chat-input';
import { X, Minimize2, Maximize2, Shrink, Sparkles, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRef, useEffect, useState, useCallback } from 'react';
import Image from 'next/image';

export function AgentChatPopup() {
  const { messages, isLoading, clearMessages, sendMessage, showSuggestions, setShowSuggestions, retryLastMessage } = useChatStore();
  const { chatOpen, setChatOpen } = useNavigationStore();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const agent = wcdAgent;
  const systemPrompt = chatSystemPrompt;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleClose = useCallback(() => {
    setChatOpen(false);
    setIsMinimized(false);
    setIsExpanded(false);
    clearMessages();
  }, [setChatOpen, clearMessages]);

  const handleMinimize = useCallback(() => {
    setIsMinimized(true);
  }, []);

  const handleRestore = useCallback(() => {
    setIsMinimized(false);
  }, []);

  const handleExpand = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);

  // Check if last message contains error
  const lastAssistantMessage = messages.length > 0
    ? [...messages].reverse().find(m => m.role === 'assistant')
    : null;
  const lastMessageIsError = lastAssistantMessage
    ? (lastAssistantMessage.content.includes('Не удалось получить ответ') ||
       lastAssistantMessage.content.includes('Ошибка') ||
       lastAssistantMessage.content.includes('Все модели заняты') ||
       lastAssistantMessage.content.includes('ошибка сети'))
    : false;

  if (!chatOpen) return null;

  return (
    <>
      {/* Minimized version — small avatar */}
      {isMinimized && (
        <div className="fixed bottom-20 sm:bottom-24 right-4 sm:right-6 z-50 animate-in fade-in zoom-in-95 duration-200">
          <button
            onClick={handleRestore}
            className="group relative focus:outline-none"
          >
            <span className={`absolute -inset-1 rounded-full bg-gradient-to-br ${agent.gradient} opacity-50 group-hover:opacity-80 transition-opacity`} />
            <span className="relative flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden border-2 border-background shadow-lg">
              <Image
                src={agent.avatar}
                alt={agent.name}
                width={64}
                height={64}
                className="w-full h-full object-cover"
              />
            </span>
            {messages.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-primary text-primary-foreground rounded-full text-[10px] sm:text-xs flex items-center justify-center font-bold">
                {messages.length}
              </span>
            )}
            <span className="absolute bottom-0 right-0 w-3 h-3 sm:w-4 sm:h-4 bg-green-500 rounded-full border-2 border-background" />
          </button>
        </div>
      )}

      {/* Full chat window */}
      {!isMinimized && (
        <div
          className={`
            fixed z-50 flex flex-col
            bg-background border border-border shadow-2xl rounded-2xl overflow-hidden
            transition-all duration-300 ease-in-out
            ${isExpanded
              ? 'bottom-4 right-4 top-16 sm:top-[72px] w-[calc(100vw-2rem)] max-w-[700px] max-h-[calc(100vh-5rem)] sm:max-h-[calc(100vh-88px)]'
              : 'bottom-20 sm:bottom-24 right-2 sm:right-4 w-[calc(100vw-1rem)] max-w-[340px] md:max-w-[380px] top-16 sm:top-[72px] max-h-[calc(100vh-7rem)] sm:max-h-[560px]'
            }
            animate-in slide-in-from-bottom-4 fade-in duration-200
          `}
        >
          {/* Chat header with agent avatar */}
          <div className="relative flex items-center gap-2.5 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 border-b border-border">
            <div className={`absolute inset-0 bg-gradient-to-r ${agent.gradient} opacity-[0.08]`} />
            <div className="relative flex items-center gap-2.5 sm:gap-3 w-full">
              <div className="relative w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden border-2 border-white/20 shadow-sm flex-shrink-0">
                <Image
                  src={agent.avatar}
                  alt={agent.name}
                  width={40}
                  height={40}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm sm:text-base font-bold text-foreground truncate">{agent.name}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">{agent.role}</p>
              </div>
              <div className="flex items-center gap-0.5 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 sm:h-7 sm:w-7 hover:bg-muted"
                  onClick={handleExpand}
                  aria-label={isExpanded ? 'Свернуть окно' : 'Развернуть окно'}
                >
                  {isExpanded ? <Shrink className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> : <Maximize2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 sm:h-7 sm:w-7 hover:bg-muted"
                  onClick={handleMinimize}
                  aria-label="Свернуть в аватар"
                >
                  <Minimize2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 sm:h-7 sm:w-7 hover:bg-muted"
                  onClick={handleClose}
                  aria-label="Закрыть чат"
                >
                  <X className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                </Button>
              </div>
            </div>
          </div>

          {/* Messages area */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-2.5 sm:p-3 min-h-0"
          >
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-4 sm:py-6 px-3 sm:px-4 text-center">
                <div className="relative w-12 h-12 sm:w-16 sm:h-16 rounded-full overflow-hidden border-2 border-primary/20 shadow-md mb-2.5 sm:mb-3">
                  <Image
                    src={agent.avatar}
                    alt={agent.name}
                    width={64}
                    height={64}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex items-center gap-1.5 mb-1.5 sm:mb-2">
                  <Sparkles className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-primary" />
                  <p className="text-sm sm:text-base font-semibold">{agent.name}</p>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-[260px] sm:max-w-[280px] mb-3 sm:mb-4">
                  {agent.greeting}
                </p>
                <div className="w-full max-w-[260px] sm:max-w-[280px] space-y-1 sm:space-y-1.5">
                  <p className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">Попробуйте спросить</p>
                  {agent.suggestions.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => sendMessage(s, systemPrompt)}
                      disabled={isLoading}
                      className="w-full text-left text-xs sm:text-sm px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg border border-border hover:border-primary/40 hover:bg-primary/5 transition-colors text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-2.5 sm:space-y-3">
                {messages.map((msg) => (
                  <ChatMessage key={msg.id} message={msg} />
                ))}
                {isLoading && (
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground animate-pulse">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full overflow-hidden border border-border flex-shrink-0">
                      <Image
                        src={agent.avatar}
                        alt={agent.name}
                        width={24}
                        height={24}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="text-xs sm:text-sm">Думаю...</span>
                  </div>
                )}

                {/* Retry button on error */}
                {!isLoading && lastMessageIsError && (
                  <div className="flex justify-center pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={retryLastMessage}
                      className="gap-1.5 text-[10px] sm:text-xs h-7 sm:h-8"
                    >
                      <RefreshCw className="h-3 w-3" />
                      Попробовать снова
                    </Button>
                  </div>
                )}

                {/* Suggestions after response */}
                {!isLoading && showSuggestions && !lastMessageIsError && agent.suggestions && (
                  <div className="pt-1.5 sm:pt-2 space-y-1 sm:space-y-1.5">
                    <p className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">Ещё вопросы</p>
                    {agent.suggestions.map((s, i) => (
                      <button
                        key={`follow-${i}`}
                        onClick={() => sendMessage(s, systemPrompt)}
                        className="w-full text-left text-[10px] sm:text-xs px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-border hover:border-primary/40 hover:bg-primary/5 transition-colors text-muted-foreground hover:text-foreground"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Input field */}
          <ChatInput systemPrompt={systemPrompt} />
        </div>
      )}
    </>
  );
}
