import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { messages, apiKey, baseUrl, model } = await request.json()

    if (!apiKey) {
      return NextResponse.json({ error: 'LLM API key not configured. Go to Configuration to set it up.' }, { status: 400 })
    }

    const url = (baseUrl || 'https://api.openai.com/v1').replace(/\/+$/, '') + '/chat/completions'

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model || 'gpt-4o-mini',
        messages,
        temperature: 0.7,
        max_tokens: 1024,
      }),
    })

    if (!response.ok) {
      const errText = await response.text().catch(() => 'Unknown error')
      return NextResponse.json({ error: `LLM API error (${response.status}): ${errText.substring(0, 200)}` }, { status: response.status })
    }

    const data = await response.json()
    const content = data?.choices?.[0]?.message?.content || 'No response from LLM.'

    return NextResponse.json({ success: true, message: content })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to call LLM' }, { status: 500 })
  }
}
