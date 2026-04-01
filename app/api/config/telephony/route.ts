import { NextResponse } from 'next/server'

/**
 * GET /api/config/telephony
 * Returns telephony credentials from server env vars.
 * Keys stay server-side in .env.local, never committed to git.
 */
export async function GET() {
  const twilioSid = process.env.TWILIO_ACCOUNT_SID || ''
  const twilioAuth = process.env.TWILIO_AUTH_TOKEN || ''
  const fromNumber = process.env.TWILIO_FROM_NUMBER || ''
  const deepgramKey = process.env.DEEPGRAM_API_KEY || ''

  if (!twilioSid || !twilioAuth) {
    return NextResponse.json({ success: false, error: 'Twilio credentials not configured on server' }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    config: {
      twilioSid,
      twilioAuth,
      fromNumber,
      deepgramKey,
    },
  })
}
