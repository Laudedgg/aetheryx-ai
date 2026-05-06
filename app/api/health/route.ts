import { NextResponse } from 'next/server'

export function GET() {
  const has = (k: string) => !!(process.env[k] && process.env[k]!.trim().length > 0)
  return NextResponse.json({
    status: 'ok',
    keys: {
      OPENAI_API_KEY: has('OPENAI_API_KEY'),
      ANTHROPIC_API_KEY: has('ANTHROPIC_API_KEY'),
      PERPLEXITY_API_KEY: has('PERPLEXITY_API_KEY'),
      DEEPGRAM_API_KEY: has('DEEPGRAM_API_KEY'),
      PINECONE_API_KEY: has('PINECONE_API_KEY'),
      HUBSPOT_ACCESS_TOKEN: has('HUBSPOT_ACCESS_TOKEN'),
      TWILIO_ACCOUNT_SID: has('TWILIO_ACCOUNT_SID'),
      TWILIO_AUTH_TOKEN: has('TWILIO_AUTH_TOKEN'),
      MEDIA_BRIDGE_HOST: has('MEDIA_BRIDGE_HOST'),
      NEXT_PUBLIC_MEDIA_BRIDGE_HOST: has('NEXT_PUBLIC_MEDIA_BRIDGE_HOST'),
    },
  })
}
