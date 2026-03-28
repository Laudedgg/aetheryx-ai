import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/twilio/status
 *
 * Polls the status of an active Twilio call.
 * Returns: status, duration, and other call metadata.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { twilioSid, twilioAuth, callSid } = body

    if (!twilioSid || !twilioAuth || !callSid) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: twilioSid, twilioAuth, callSid' },
        { status: 400 }
      )
    }

    const callRes = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Calls/${callSid}.json`,
      {
        headers: {
          'Authorization': 'Basic ' + Buffer.from(`${twilioSid}:${twilioAuth}`).toString('base64'),
        },
      }
    )

    if (!callRes.ok) {
      const errText = await callRes.text()
      return NextResponse.json(
        { success: false, error: `Failed to fetch call status: ${callRes.status}`, details: errText },
        { status: callRes.status }
      )
    }

    const callData = await callRes.json()

    return NextResponse.json({
      success: true,
      callSid: callData.sid,
      status: callData.status, // queued, ringing, in-progress, completed, busy, no-answer, canceled, failed
      duration: callData.duration ? parseInt(callData.duration, 10) : null,
      from: callData.from,
      to: callData.to,
      direction: callData.direction,
      startTime: callData.start_time,
      endTime: callData.end_time,
      price: callData.price,
      priceUnit: callData.price_unit,
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Server error'
    return NextResponse.json(
      { success: false, error: msg },
      { status: 500 }
    )
  }
}

/**
 * POST /api/twilio/status with action=hangup
 * Ends an active call
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { twilioSid, twilioAuth, callSid } = body

    if (!twilioSid || !twilioAuth || !callSid) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const formData = new URLSearchParams()
    formData.append('Status', 'completed')

    const callRes = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Calls/${callSid}.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + Buffer.from(`${twilioSid}:${twilioAuth}`).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      }
    )

    if (!callRes.ok) {
      const errText = await callRes.text()
      return NextResponse.json(
        { success: false, error: `Failed to end call: ${callRes.status}`, details: errText },
        { status: callRes.status }
      )
    }

    return NextResponse.json({ success: true, status: 'completed' })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Server error'
    return NextResponse.json(
      { success: false, error: msg },
      { status: 500 }
    )
  }
}
