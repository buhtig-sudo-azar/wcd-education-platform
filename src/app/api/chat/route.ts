import { NextRequest } from 'next/server';

let cachedFreeModels: string[] = [];
let lastFetchTime = 0;
const CACHE_TTL = 5 * 60 * 1000;
const MODEL_TIMEOUT_MS = 8000;

const SYSTEM_PROMPT = `Ты — Кэш-страж, эксперт-ассистент по теме Web Cache Deception (WCD) и связанным технологиям веб-безопасности. Твоя задача — помогать пользователям разобраться в теме WCD, отвечая на вопросы понятно и подробно.

Твоя специализация:
- Web Cache Deception: механизмы, векторы атак, методы защиты
- HTTP-протокол: заголовки, методы, статус-коды
- Кэширование: CDN, Reverse Proxy, Browser Cache, Cache-Control
- CDN: Cloudflare, Akamai, AWS CloudFront, принципы работы
- Proxy и Reverse Proxy: Nginx, Varnish, HAProxy
- Web Security: OWASP, уязвимости, методы защиты
- Burp Suite: использование для тестирования WCD
- PortSwigger Web Security Academy: лаборатории и учебные материалы

Правила:
1. Отвечай на русском языке
2. Давай развёрнутые ответы с примерами
3. Используй техническую терминологию, но объясняй её
4. Приводи примеры URL и заголовков HTTP
5. Если вопрос не связан с твоей специализацией, вежливо скажи об этом
6. Рекомендуй практические упражнения и лаборатории PortSwigger
7. Формат ответа — обычный текст. НЕ используй markdown-разметку. Никаких звёздочек (**), решёток (#), бэктиков (\`\`\`), тире для списков (-), вертикальных черт (|). Пиши обычными предложениями и абзацами. Для перечислений используй слова «во-первых», «во-вторых» или нумерацию с точкой (1., 2.). Для примеров URL просто пиши текстом.`;

async function getFreeModels(): Promise<string[]> {
  const now = Date.now();
  if (cachedFreeModels.length > 0 && now - lastFetchTime < CACHE_TTL) {
    return cachedFreeModels;
  }

  try {
    const res = await fetch('https://openrouter.ai/api/v1/models', {
      headers: { 'Content-Type': 'application/json' },
      next: { revalidate: 300 },
    });

    if (!res.ok) {
      return cachedFreeModels.length > 0 ? cachedFreeModels : getFallbackModels();
    }

    const data = await res.json();
    const models = data?.data || [];

    cachedFreeModels = models
      .filter((m: { id: string }) =>
        m.id.endsWith(':free') && !m.id.includes('content-safety')
      )
      .map((m: { id: string }) => m.id);

    lastFetchTime = now;

    if (cachedFreeModels.length === 0) {
      return getFallbackModels();
    }

    return cachedFreeModels;
  } catch {
    return cachedFreeModels.length > 0 ? cachedFreeModels : getFallbackModels();
  }
}

function getFallbackModels(): string[] {
  return [
    'google/gemma-4-31b-it:free',
    'moonshotai/kimi-k2.6:free',
    'nvidia/nemotron-3-ultra-550b-a55b:free',
    'nousresearch/hermes-3-llama-3.1-405b:free',
    'meta-llama/llama-3.3-70b-instruct:free',
    'qwen/qwen3-next-80b-a3b-instruct:free',
  ];
}

function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  return fetch(url, {
    ...options,
    signal: controller.signal,
  }).finally(() => {
    clearTimeout(timeout);
  });
}

const JSON_HEADERS = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store, no-cache, must-revalidate' };

export async function POST(req: NextRequest) {
  try {
    const { messages, systemPrompt, model: clientModel, apiToken, max_tokens: clientMaxTokens, temperature: clientTemperature } = await req.json();

    const apiKey = apiToken || process.env.OPENROUTER_API_KEY;
    const preferredModel = clientModel || process.env.OPENROUTER_MODEL;
    const maxTokens = clientMaxTokens ?? 2048;
    const temperature = clientTemperature !== undefined ? Math.max(0, Math.min(2, clientTemperature)) : 0.7;

    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'API key not configured' }), {
        status: 500,
        headers: JSON_HEADERS,
      });
    }

    const allMessages = [
      { role: 'system', content: systemPrompt || SYSTEM_PROMPT },
      ...messages,
    ];

    const freeModels = await getFreeModels();

    const modelsToTry = preferredModel
      ? [preferredModel, ...freeModels.filter(m => m !== preferredModel)]
      : freeModels;

    let lastError = '';
    const rateLimitedModels: string[] = [];

    for (const model of modelsToTry) {
      try {
        const response = await fetchWithTimeout(
          'https://openrouter.ai/api/v1/chat/completions',
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': 'https://wcd-education-platform.vercel.app',
              'X-Title': 'WCD Education Platform',
            },
            body: JSON.stringify({
              model,
              messages: allMessages,
              stream: true,
              stream_options: { include_usage: true },
              max_tokens: maxTokens,
              temperature,
            }),
          },
          MODEL_TIMEOUT_MS,
        );

        if (response.ok) {
          const modelInfoEvent = `data: ${JSON.stringify({
            type: 'model_info',
            model,
            rateLimited: rateLimitedModels,
          })}\n\n`;

          const encoder = new TextEncoder();
          const infoChunk = encoder.encode(modelInfoEvent);
          const originalStream = response.body;

          if (!originalStream) {
            return new Response(JSON.stringify({ error: 'No stream body' }), {
              status: 500,
              headers: JSON_HEADERS,
            });
          }

          const combinedStream = new ReadableStream({
            async start(controller) {
              controller.enqueue(infoChunk);
              const reader = originalStream.getReader();
              try {
                while (true) {
                  const { done, value } = await reader.read();
                  if (done) break;
                  controller.enqueue(value);
                }
                controller.close();
              } catch (err) {
                controller.error(err);
              }
            },
          });

          return new Response(combinedStream, {
            headers: {
              'Content-Type': 'text/event-stream',
              'Cache-Control': 'no-store, no-cache, must-revalidate',
              Connection: 'keep-alive',
              'X-Model-Used': model,
              'X-Rate-Limited-Models': rateLimitedModels.join(','),
              'X-Max-Tokens': String(maxTokens),
              'X-Temperature': String(temperature),
            },
          });
        }

        if (response.status === 429) {
          rateLimitedModels.push(model);
        }

        const errText = await response.text().catch(() => 'unknown error');
        lastError = errText;
        continue;
      } catch (fetchError: unknown) {
        const errMsg = fetchError instanceof Error ? fetchError.message : 'unknown';
        if (errMsg.includes('abort')) {
          lastError = `Timeout after ${MODEL_TIMEOUT_MS}ms`;
        } else {
          lastError = errMsg;
        }
        continue;
      }
    }

    return new Response(JSON.stringify({
      error: 'All models unavailable',
      details: lastError,
      rateLimitedModels,
    }), {
      status: 503,
      headers: JSON_HEADERS,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: JSON_HEADERS,
    });
  }
}
