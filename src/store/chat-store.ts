import { create } from 'zustand';
import type { ChatMessage } from '@/types';
import { useModelStore } from '@/store/model-store';

interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  activeCategory: string | null;
  showSuggestions: boolean;
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  appendToLastMessage: (content: string) => void;
  setLoading: (loading: boolean) => void;
  setActiveCategory: (slug: string | null) => void;
  clearMessages: () => void;
  sendMessage: (text: string, systemPrompt: string) => Promise<void>;
  retryLastMessage: () => Promise<void>;
  setShowSuggestions: (show: boolean) => void;
}

let currentAbortController: AbortController | null = null;
let lastSendParams: { text: string; systemPrompt: string } | null = null;

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  isLoading: false,
  activeCategory: null,
  showSuggestions: true,

  addMessage: (message) =>
    set((s) => ({
      messages: [
        ...s.messages,
        { ...message, id: crypto.randomUUID(), timestamp: Date.now() },
      ],
    })),
  appendToLastMessage: (content) =>
    set((s) => {
      const messages = [...s.messages];
      const last = messages[messages.length - 1];
      if (last && last.role === 'assistant') {
        messages[messages.length - 1] = { ...last, content: last.content + content };
      }
      return { messages };
    }),
  setLoading: (loading) => set({ isLoading: loading }),
  setActiveCategory: (slug) => set({ activeCategory: slug, showSuggestions: true }),
  clearMessages: () => set({ messages: [], showSuggestions: true }),
  setShowSuggestions: (show) => set({ showSuggestions }),

  retryLastMessage: async () => {
    if (!lastSendParams) return;
    const { text, systemPrompt } = lastSendParams;
    set((s) => {
      const messages = [...s.messages];
      const last = messages[messages.length - 1];
      if (last && last.role === 'assistant') {
        messages.pop();
      }
      return { messages };
    });
    await get().sendMessage(text, systemPrompt, true);
  },

  sendMessage: async (text: string, systemPrompt: string, isRetry = false) => {
    const trimmed = text.trim();
    if (!trimmed || get().isLoading) return;

    if (currentAbortController) {
      currentAbortController.abort();
      currentAbortController = null;
    }

    const currentMessages = get().messages;

    if (!isRetry) {
      lastSendParams = { text: trimmed, systemPrompt };
    }

    set({ showSuggestions: false });

    if (!isRetry) {
      get().addMessage({ role: 'user', content: trimmed });
    }
    get().setLoading(true);

    const controller = new AbortController();
    currentAbortController = controller;

    try {
      const chatMessages = [
        ...currentMessages,
        ...(isRetry ? [] : [{ role: 'user' as const, content: trimmed }]),
      ].map(m => ({
        role: m.role,
        content: m.content,
      }));

      const { currentModel, apiToken } = useModelStore.getState();

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: chatMessages,
          systemPrompt,
          model: currentModel,
          apiToken: apiToken || undefined,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        if (controller.signal.aborted) return;
        const errData = await response.json().catch(() => null);
        const errMsg = errData?.error === 'All models unavailable'
          ? 'Все модели заняты. Попробуйте выбрать другую модель или подождите пару минут.'
          : `Ошибка сервера (${response.status}). Попробуйте ещё раз.`;
        get().addMessage({ role: 'assistant', content: errMsg });
        get().setLoading(false);
        set({ showSuggestions: true });
        return;
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        get().addMessage({ role: 'assistant', content: 'Ошибка: нет потока данных. Попробуйте ещё раз.' });
        get().setLoading(false);
        set({ showSuggestions: true });
        return;
      }

      get().addMessage({ role: 'assistant', content: '' });

      let fullContent = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (controller.signal.aborted) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine) continue;

          if (trimmedLine.startsWith('data: ')) {
            const data = trimmedLine.slice(6).trim();
            if (data === '[DONE]') continue;
            try {
              const parsed = JSON.parse(data);
              if (parsed.type === 'model_info') {
                if (parsed.rateLimited && Array.isArray(parsed.rateLimited)) {
                  for (const modelId of parsed.rateLimited) {
                    useModelStore.getState().markModelRateLimited(modelId);
                  }
                }
                continue;
              }
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                fullContent += content;
                get().appendToLastMessage(content);
              }
            } catch {
              // skip malformed JSON
            }
          }
        }
      }

      // Process remaining buffer
      if (buffer.trim()) {
        const remainingLine = buffer.trim();
        if (remainingLine.startsWith('data: ')) {
          const data = remainingLine.slice(6).trim();
          if (data !== '[DONE]') {
            try {
              const parsed = JSON.parse(data);
              if (parsed.type !== 'model_info') {
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) {
                  fullContent += content;
                  get().appendToLastMessage(content);
                }
              }
            } catch {}
          }
        }
      }

      if (!fullContent) {
        get().appendToLastMessage('Не удалось получить ответ. Попробуйте другую модель или повторите запрос.');
      }

      set({ showSuggestions: true });
    } catch (error) {
      if (controller.signal.aborted) {
        return;
      }
      get().addMessage({ role: 'assistant', content: 'Произошла ошибка сети. Проверьте подключение и попробуйте снова.' });
      set({ showSuggestions: true });
    } finally {
      if (currentAbortController === controller) {
        currentAbortController = null;
      }
      get().setLoading(false);
    }
  },
}));
