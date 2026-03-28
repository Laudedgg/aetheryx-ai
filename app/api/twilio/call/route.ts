import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/twilio/call
 *
 * Two-leg call flow (when repPhone is provided):
 *   1. Twilio calls the sales rep's phone (repPhone)
 *   2. When rep picks up, TwiML dials the prospect (toNumber)
 *   3. Both are bridged — rep talks on their phone, dashboard shows AI coaching
 *
 * Single-leg fallback (no repPhone):
 *   Calls the prospect and holds them in a conference room.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { twilioSid, twilioAuth, toNumber, fromNumber, repPhone } = body

    if (!twilioSid || !twilioAuth || !toNumber) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: twilioSid, twilioAuth, toNumber' },
        { status: 400 }
      )
    }

    const auth = 'Basic ' + Buffer.from(`${twilioSid}:${twilioAuth}`).toString('base64')

    // Resolve the Twilio "from" number
    let from = fromNumber || ''
    if (!from) {
      const numbersRes = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/IncomingPhoneNumbers.json?PageSize=1`,
        { headers: { 'Authorization': auth } }
      )
      if (!numbersRes.ok) {
        const errText = await numbersRes.text()
        return NextResponse.json(
          { success: false, error: 'Failed to fetch Twilio phone numbers. Check your Account SID and Auth Token.', details: errText },
          { status: 401 }
        )
      }
      const numbersData = await numbersRes.json()
      const available = numbersData?.incoming_phone_numbers
      if (!Array.isArray(available) || available.length === 0) {
        return NextResponse.json(
          { success: false, error: 'No phone numbers found in your Twilio account. Purchase one at twilio.com/console/phone-numbers.' },
          { status: 400 }
        )
      }
      from = available[0].phone_number
    }

    if (repPhone) {
      // Two-leg: call the rep first, then bridge to prospect when rep picks up
      return await makeTwoLegCall(twilioSid, auth, from, repPhone, toNumber)
    } else {
      // No rep phone — hold the prospect in a conference (legacy fallback)
      return await makeSingleLegCall(twilioSid, auth, from, toNumber)
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Server error'
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}

/**
 * Two-leg call: Twilio calls the rep first.
 * When rep answers, TwiML dials the prospect and bridges them.
 */
async function makeTwoLegCall(accountSid: string, auth: string, from: string, repPhone: string, prospectPhone: string) {
  // TwiML executed when the rep picks up: dial the prospect and bridge
  const twiml = `<Response><Say voice="alice">Connecting you to the prospect now.</Say><Dial callerId="${escapeXml(from)}" timeout="30"><Number>${escapeXml(prospectPhone)}</Number></Dial></Response>`

  const formData = new URLSearchParams()
  formData.append('To', repPhone)       // Call the rep's phone first
  formData.append('From', from)          // Using Twilio number as caller ID
  formData.append('Twiml', twiml)        // When rep picks up, bridge to prospect

  return await placeCall(accountSid, auth, formData)
}

/**
 * Single-leg fallback: call the prospect and hold in a conference.
 */
async function makeSingleLegCall(accountSid: string, auth: string, from: string, to: string) {
  const roomName = `salesmaster-${Date.now()}`
  const twiml = `<Response><Say voice="alice">Please hold while we connect your call.</Say><Dial><Conference beep="false">${escapeXml(roomName)}</Conference></Dial></Response>`

  const formData = new URLSearchParams()
  formData.append('To', to)
  formData.append('From', from)
  formData.append('Twiml', twiml)

  return await placeCall(accountSid, auth, formData)
}

async function placeCall(accountSid: string, auth: string, formData: URLSearchParams) {
  const callRes = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls.json`,
    {
      method: 'POST',
      headers: { 'Authorization': auth, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString(),
    }
  )

  if (!callRes.ok) {
    const errText = await callRes.text()
    let errorMessage = `Twilio API error (${callRes.status})`
    try {
      const errJson = JSON.parse(errText)
      errorMessage = errJson?.message || errJson?.detail || errorMessage
      if (errJson?.code === 21214) errorMessage = 'The "To" phone number is not valid. Use E.164 format (e.g., +14155551234).'
      else if (errJson?.code === 21212) errorMessage = 'The "From" phone number is not a valid Twilio number.'
      else if (errJson?.code === 21602) errorMessage = 'This number is not verified. On trial accounts, verify numbers at twilio.com/console/phone-numbers/verified.'
      else if (errJson?.code === 20003) errorMessage = 'Authentication failed. Check your Twilio Account SID and Auth Token.'
    } catch (_e) {
      errorMessage = errText || errorMessage
    }
    return NextResponse.json({ success: false, error: errorMessage }, { status: callRes.status })
  }

  const callData = await callRes.json()
  return NextResponse.json({
    success: true,
    callSid: callData.sid,
    status: callData.status,
    from: callData.from,
    to: callData.to,
    direction: callData.direction,
    dateCreated: callData.date_created,
  })
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}
