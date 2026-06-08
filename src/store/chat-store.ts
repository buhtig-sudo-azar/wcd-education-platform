import { create } from 'zustand'
import type { ChatMessage } from '@/types'

interface ChatState {
  messages: ChatMessage[]
  isStreaming: boolean
  abortController: AbortController | null
  addMessage: (message: ChatMessage) => void
  appendToLastMessage: (content: string) => void
  setStreaming: (streaming: boolean) => void
  setAbortController: (controller: AbortController | null) => void
  clearMessages: () => void
  retryLastMessage: () => void
  sendMessage: (content: string) => Promise<void>
}

const DEFAULT_MODEL = 'google/gemma-4-31b-it:free'

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  isStreaming: false,
  abortController: null,

  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),

  appendToLastMessage: (content) =>
    set((state) => {
      const messages = [...state.messages]
      const lastMessage = messages[messages.length - 1]
      if (lastMessage && lastMessage.role === 'assistant') {
        messages[messages.length - 1] = {
          ...lastMessage,
          content: lastMessage.content + content,
        }
      }
      return { messages }
    }),

  setStreaming: (streaming) => set({ isStreaming: streaming }),

  setAbortController: (controller) => set({ abortController: controller }),

  clearMessages: () => set({ messages: [] }),

  retryLastMessage: () => {
    const { messages } = get()
    if (messages.length >= 2) {
      const userMessages = messages.filter((m) => m.role === 'user')
      const lastUserMessage = userMessages[userMessages.length - 1]
      const newMessages = messages.slice(0, -1)
      set({ messages: newMessages })
      if (lastUserMessage) {
        get().sendMessage(lastUserMessage.content)
      }
    }
  },

  sendMessage: async (content) => {
    const { isStreaming } = get()
    if (isStreaming) return

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: Date.now(),
    }

    const assistantMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
    }

    set((state) => ({
      messages: [...state.messages, userMessage, assistantMessage],
      isStreaming: true,
    }))

    const abortController = new AbortController()
    set({ abortController })

    try {
      const { messages } = get()
      const chatMessages = messages
        .filter((m) => m.id !== assistantMessage.id)
        .map((m) => ({ role: m.role, content: m.content }))

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: chatMessages,
          model: DEFAULT_MODEL,
        }),
        signal: abortController.signal,
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6)
              if (data === '[DONE]') continue
              try {
                const parsed = JSON.parse(data)
                const delta = parsed.choices?.[0]?.delta?.content
                if (delta) {
                  get().appendToLastMessage(delta)
                }
              } catch {
                // skip malformed JSON
              }
            }
          }
        }
      }
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        // User cancelled
      } else {
        get().appendToLastMessage(
          `\n\nОшибка: ${(error as Error).message}. Попробуйте ещё раз.`
        )
      }
    } finally {
      set({ isStreaming: false, abortController: null })
    }
  },
}))
