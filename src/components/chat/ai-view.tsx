'use client'

import { useState, useRef, useEffect } from 'react'
import { useChatStore } from '@/store/chat-store'
import { wcdAgent } from '@/data/agent-data'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Send,
  User,
  RotateCcw,
  Trash2,
  Loader2,
} from 'lucide-react'

export function AIView() {
  const {
    messages,
    isStreaming,
    sendMessage,
    clearMessages,
    retryLastMessage,
  } = useChatStore()
  const [input, setInput] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSend = () => {
    if (!input.trim() || isStreaming) return
    sendMessage(input.trim())
    setInput('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const visibleMessages = messages.filter((m) => m.role !== 'system')

  return (
    <div className="flex flex-col h-[calc(100vh-7.5rem)] max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br ${wcdAgent.gradient} text-white text-lg`}>
            {wcdAgent.avatar}
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">{wcdAgent.name}</h2>
            <p className="text-xs text-muted-foreground">{wcdAgent.role}</p>
          </div>
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" onClick={retryLastMessage} disabled={isStreaming || messages.length < 2} title="Повторить">
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={clearMessages} disabled={isStreaming} title="Очистить">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {visibleMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${wcdAgent.gradient} text-white text-2xl mb-4`}>
              {wcdAgent.avatar}
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">{wcdAgent.name}</h3>
            <p className="text-sm text-muted-foreground max-w-md mb-6">{wcdAgent.greeting}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
              {wcdAgent.suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => sendMessage(suggestion)}
                  className="text-left px-3 py-2 rounded-lg border border-border hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-colors text-xs text-muted-foreground hover:text-foreground"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          visibleMessages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.role === 'assistant' && (
                <div className={`flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br ${wcdAgent.gradient} text-white text-sm shrink-0`}>
                  {wcdAgent.avatar}
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-xl px-4 py-2.5 ${
                  message.role === 'user'
                    ? 'bg-emerald-500 text-white'
                    : 'bg-card border border-border'
                }`}
              >
                <p className={`text-sm whitespace-pre-wrap ${
                  message.role === 'user' ? 'text-white' : 'text-foreground'
                }`}>
                  {message.content || (
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Думает...
                    </span>
                  )}
                </p>
              </div>
              {message.role === 'user' && (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted shrink-0">
                  <User className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border shrink-0">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Задайте вопрос о Web Cache Deception..."
            className="min-h-[44px] max-h-32 resize-none text-sm"
            rows={1}
            disabled={isStreaming}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isStreaming}
            className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white shrink-0 self-end"
          >
            {isStreaming ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Нажмите Enter для отправки, Shift+Enter для новой строки
        </p>
      </div>
    </div>
  )
}
