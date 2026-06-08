import { NextResponse } from 'next/server';

let cachedModels: { id: string; name: string; label: string }[] | null = null;
let cacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000;

export async function GET() {
  try {
    const now = Date.now();

    if (cachedModels && now - cacheTime < CACHE_TTL) {
      return NextResponse.json({ models: cachedModels });
    }

    const apiKey = process.env.OPENROUTER_API_KEY;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const response = await fetch('https://openrouter.ai/api/v1/models', {
      headers,
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      if (cachedModels) {
        return NextResponse.json({ models: cachedModels });
      }
      return NextResponse.json(
        { error: 'Failed to fetch models from OpenRouter' },
        { status: response.status }
      );
    }

    const data = await response.json();
    const allModels = data.data || [];

    const freeModels = allModels
      .filter((m: { id: string }) => m.id.endsWith(':free'))
      .filter((m: { id: string }) => !m.id.includes('content-safety'))
      .map((m: { id: string; name?: string }) => {
        const name = m.name || m.id.split('/').pop() || m.id;
        const label = name.replace(/\s*\(free\)\s*$/i, '').trim();
        return { id: m.id, name: m.name || m.id, label };
      })
      .sort((a: { label: string }, b: { label: string }) => a.label.localeCompare(b.label));

    cachedModels = freeModels;
    cacheTime = now;

    return NextResponse.json({ models: freeModels });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    if (cachedModels) {
      return NextResponse.json({ models: cachedModels });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
