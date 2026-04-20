import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/twilio/twiml
 *
 * Twilio webhook — called when a call connects via the TwiML App.
 * Returns TwiML that:
 *   1. Starts a media stream (sends remote audio to our WebSocket for Deepgram)
 *   2. Dials the prospect number
 *
 * Twilio sends form-encoded data with: To, From, CallSid, etc.
 */
export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || ''
    let toNumber = ''
    let callSid = ''

    if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await request.formData()
      toNumber = (formData.get('To') as string) || ''
      callSid = (formData.get('CallSid') as string) || ''
    } else {
      const body = await request.json().catch(() => ({}))
      toNumber = body.To || body.toNumber || ''
      callSid = body.CallSid || ''
    }

    // Build the WebSocket URL for media streaming
    // Points to the Fly.io media-bridge service which handles Deepgram transcription
    const bridgeHost = process.env.MEDIA_BRIDGE_HOST || 'aetheryx-media-bridge.fly.dev'
    const streamUrl = `wss://${bridgeHost}/twilio`

    // If toNumber is a client identity (not a phone number), just connect
    const isPhoneNumber = toNumber.startsWith('+')

    let twiml: string

    if (isPhoneNumber) {
      // Outbound call to a phone number with media stream
      const fromNumber = process.env.TWILIO_FROM_NUMBER || ''
      twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Start>
    <Stream url="${streamUrl}" track="both_tracks">
      <Parameter name="callSid" value="${callSid}" />
    </Stream>
  </Start>
  <Say voice="Polly.Amy">Connecting your call now.</Say>
  <Dial callerId="${escapeXml(fromNumber)}" timeout="30">
    <Number>${escapeXml(toNumber)}</Number>
  </Dial>
</Response>`
    } else {
      // WebRTC client call — just acknowledge with stream
      twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Start>
    <Stream url="${streamUrl}" track="both_tracks">
      <Parameter name="callSid" value="${callSid}" />
    </Stream>
  </Start>
  <Say voice="Polly.Amy">Connected. Your AI assistant is listening.</Say>
  <Dial>
    <Client>salesrep</Client>
  </Dial>
</Response>`
    }

    return new NextResponse(twiml, {
      status: 200,
      headers: { 'Content-Type': 'application/xml' },
    })
  } catch (error) {
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Amy">Sorry, there was an error connecting your call.</Say>
  <Hangup/>
</Response>`
    return new NextResponse(twiml, {
      status: 200,
      headers: { 'Content-Type': 'application/xml' },
    })
  }
}

function escapeXml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')
}
