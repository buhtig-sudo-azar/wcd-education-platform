import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: `OpenRouter API error: ${response.status}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    const freeModels = (data.data || [])
      .filter((model: { pricing: { prompt: string; completion: string } }) =>
        parseFloat(model.pricing?.prompt || '1') === 0 &&
        parseFloat(model.pricing?.completion || '1') === 0
      )
      .map((model: { id: string; name: string }) => ({
        id: model.id,
        name: model.name,
      }))
      .slice(0, 20)

    return NextResponse.json({ models: freeModels })
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to fetch models: ${(error as Error).message}` },
      { status: 500 }
    )
  }
}
