import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

const GMAIL_USER = process.env.GMAIL_USER || ''
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD || ''

/**
 * POST /api/email
 * Send follow-up emails via Gmail SMTP
 * Body: { to, subject, body, cc?, bcc? }
 */
export async function POST(request: NextRequest) {
  if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
    return NextResponse.json({ success: false, error: 'Gmail credentials not configured' }, { status: 500 })
  }

  try {
    const { to, subject, body, cc, bcc } = await request.json()

    if (!to || !subject || !body) {
      return NextResponse.json({ success: false, error: 'to, subject, and body are required' }, { status: 400 })
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: GMAIL_USER,
        pass: GMAIL_APP_PASSWORD,
      },
    })

    const info = await transporter.sendMail({
      from: `Aetheryx AI <${GMAIL_USER}>`,
      to,
      cc,
      bcc,
      subject,
      html: body,
    })

    return NextResponse.json({
      success: true,
      messageId: info.messageId,
      recipient: to,
      subject,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Email send failed',
    }, { status: 500 })
  }
}
