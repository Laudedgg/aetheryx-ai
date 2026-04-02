import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

const API_KEY_SID = process.env.TWILIO_API_KEY_SID || ''
const API_KEY_SECRET = process.env.TWILIO_API_KEY_SECRET || ''
const TWIML_APP_SID = process.env.TWILIO_TWIML_APP_SID || ''
const ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || ''

function base64url(input: string | Buffer): string {
  const buf = typeof input === 'string' ? Buffer.from(input) : input
  return buf.toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
}

function generateAccessToken(accountSid: string): string {
  const header = { alg: 'HS256', typ: 'JWT', cty: 'twilio-fpa;v=1' }
  const now = Math.floor(Date.now() / 1000)
  const payload = {
    jti: `${API_KEY_SID}-${now}`,
    iss: API_KEY_SID,
    sub: accountSid,
    exp: now + 3600,
    grants: {
      identity: 'salesrep',
      voice: {
        incoming: { allow: false },
        outgoing: { application_sid: TWIML_APP_SID },
      },
    },
  }
  const headerB64 = base64url(JSON.stringify(header))
  const payloadB64 = base64url(JSON.stringify(payload))
  const signingInput = `${headerB64}.${payloadB64}`
  const signature = crypto.createHmac('sha256', API_KEY_SECRET).update(signingInput).digest()
  return `${signingInput}.${base64url(signature)}`
}

export async function POST(request: NextRequest) {
  if (!API_KEY_SID || !API_KEY_SECRET || !TWIML_APP_SID) {
    return NextResponse.json(
      { success: false, error: 'Twilio API keys not configured on server' },
      { status: 500 }
    )
  }

  // Use server-side account SID, fall back to client-provided
  const body = await request.json()
  const accountSid = ACCOUNT_SID || body.accountSid

  if (!accountSid) {
    return NextResponse.json({ success: false, error: 'No Twilio Account SID available' }, { status: 400 })
  }

  const token = generateAccessToken(accountSid)
  return NextResponse.json({ success: true, token })
}
