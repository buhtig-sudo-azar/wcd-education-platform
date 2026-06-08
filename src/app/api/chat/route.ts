import { NextRequest, NextResponse } from 'next/server'

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
7. Структурируй ответы с использованием заголовков и списков`

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { messages, model } = body

    const apiKey = process.env.OPENROUTER_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OpenRouter API key not configured' },
        { status: 500 }
      )
    }

    const apiMessages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...(messages || []),
    ]

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://wcd-education-platform.vercel.app',
        'X-Title': 'WCD Education Platform',
      },
      body: JSON.stringify({
        model: model || 'google/gemma-4-31b-it:free',
        messages: apiMessages,
        stream: true,
        max_tokens: 2048,
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json(
        { error: `OpenRouter API error: ${response.status} - ${errorText}` },
        { status: response.status }
      )
    }

    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader()
        if (!reader) {
          controller.close()
          return
        }

        const decoder = new TextDecoder()
        let buffer = ''

        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) {
              controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'))
              controller.close()
              break
            }

            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split('\n')
            buffer = lines.pop() || ''

            for (const line of lines) {
              const trimmed = line.trim()
              if (trimmed.startsWith('data: ')) {
                const data = trimmed.slice(6)
                if (data === '[DONE]') continue
                try {
                  JSON.parse(data)
                  controller.enqueue(new TextEncoder().encode(`${trimmed}\n\n`))
                } catch {
                  // skip malformed JSON
                }
              }
            }
          }
        } catch (error) {
          controller.error(error)
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: `Internal server error: ${(error as Error).message}` },
      { status: 500 }
    )
  }
}
