import { NextRequest, NextResponse } from 'next/server'
import parseLLMJson from '@/lib/jsonParser'

// Provider API endpoints
const OPENAI_URL = 'https://api.openai.com/v1/chat/completions'
const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages'
const PERPLEXITY_URL = 'https://api.perplexity.ai/chat/completions'

// Keys
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || ''
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || ''
const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY || ''

// Agent config from workflow_state
const AGENT_CONFIG: Record<string, { provider: string; model: string; temperature: number; top_p: number; systemPrompt: string }> = {
  '69b03c357b2057cc3ff92a2b': {
    provider: 'perplexity',
    model: 'sonar-pro',
    temperature: 0.2,
    top_p: 1,
    systemPrompt: `You are a Research Agent for Aetheryx AI. Research prospect and company information using web search. Return a JSON object with: company_profile (name, industry, size, headquarters, description, key_products), funding (total_raised, latest_round, key_investors, financial_health), tech_stack (technologies, infrastructure, tools), recent_news, pitch_angles, pain_points. Be thorough and factual.`,
  },
  '69b03c36778bd73de86e5ffd': {
    provider: 'anthropic',
    model: 'claude-sonnet-4-5-20250514',
    temperature: 0.5,
    top_p: 0.95,
    systemPrompt: `You are a Sales Strategy Agent for Aetheryx AI. Analyze live conversation transcript chunks and generate contextual suggestions. Return a JSON object with: objection_handlers (specific responses to prospect pushback), next_questions (best follow-up questions), pitch_angles (recommended talking points), engagement_level (assessment), deal_signals (buying signals detected), closing_probability (estimated percentage with reasoning).`,
  },
  '69b03c5393c7264ffc5fcc0d': {
    provider: 'openai',
    model: 'gpt-4.1',
    temperature: 0.4,
    top_p: 0.95,
    systemPrompt: `You are a Post-Call Intelligence Agent for Aetheryx AI. Process the complete call transcript. Return a JSON object with: summary (client_name, company, call_outcome, key_points, pain_points, next_steps), deal_probability (score as percentage, positive_signals, negative_signals, risk_factors), follow_up_email (subject, body, recipient_suggestion). Be specific and actionable.`,
  },
  '69b03c652f39e130540f1d49': {
    provider: 'openai',
    model: 'gpt-4.1',
    temperature: 0.2,
    top_p: 1,
    systemPrompt: `You are a CRM & Email Sync Agent for Aetheryx AI. Take the approved call summary and follow-up email data, then describe the HubSpot and Gmail sync actions. Return a JSON object with: hubspot_sync (contact_status, contact_id, deal_status, deal_id, notes_added), email_status (sent, recipient, subject, timestamp), sync_summary. If actual API integration isn't available, describe what would be synced.`,
  },
}

// Types
interface NormalizedAgentResponse {
  status: 'success' | 'error'
  result: Record<string, any>
  message?: string
  metadata?: {
    agent_name?: string
    timestamp?: string
    [key: string]: any
  }
}

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

function normalizeResponse(parsed: any): NormalizedAgentResponse {
  if (!parsed) return { status: 'error', result: {}, message: 'Empty response from agent' }
  if (typeof parsed === 'string') return { status: 'success', result: { text: parsed }, message: parsed }
  if (typeof parsed !== 'object') return { status: 'success', result: { value: parsed }, message: String(parsed) }
  if ('status' in parsed && 'result' in parsed) return { status: parsed.status === 'error' ? 'error' : 'success', result: parsed.result || {}, message: parsed.message, metadata: parsed.metadata }
  if ('result' in parsed) {
    const r = parsed.result
    const msg = parsed.message ?? (typeof r === 'string' ? r : null) ?? (r && typeof r === 'object' ? (r.text ?? r.message ?? r.response ?? r.answer ?? r.summary ?? r.content) : null)
    return { status: 'success', result: typeof r === 'string' ? { text: r } : (r || {}), message: typeof msg === 'string' ? msg : undefined, metadata: parsed.metadata }
  }
  if ('message' in parsed && typeof parsed.message === 'string') return { status: 'success', result: { text: parsed.message }, message: parsed.message }
  if ('response' in parsed) return normalizeResponse(parsed.response)
  return { status: 'success', result: parsed, message: undefined, metadata: undefined }
}

// ── Provider call functions ──

async function callOpenAI(message: string, config: typeof AGENT_CONFIG[string]): Promise<string> {
  const res = await fetch(OPENAI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_API_KEY}` },
    body: JSON.stringify({
      model: config.model,
      temperature: config.temperature,
      top_p: config.top_p,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: config.systemPrompt },
        { role: 'user', content: message },
      ],
    }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`OpenAI API error (${res.status}): ${err}`)
  }
  const data = await res.json()
  return data.choices[0].message.content
}

async function callAnthropic(message: string, config: typeof AGENT_CONFIG[string]): Promise<string> {
  const res = await fetch(ANTHROPIC_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: config.model,
      max_tokens: 4096,
      temperature: config.temperature,
      top_p: config.top_p,
      system: config.systemPrompt,
      messages: [{ role: 'user', content: message }],
    }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Anthropic API error (${res.status}): ${err}`)
  }
  const data = await res.json()
  return data.content[0].text
}

async function callPerplexity(message: string, config: typeof AGENT_CONFIG[string]): Promise<string> {
  const res = await fetch(PERPLEXITY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${PERPLEXITY_API_KEY}` },
    body: JSON.stringify({
      model: config.model,
      temperature: config.temperature,
      top_p: config.top_p,
      messages: [
        { role: 'system', content: config.systemPrompt },
        { role: 'user', content: message },
      ],
    }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Perplexity API error (${res.status}): ${err}`)
  }
  const data = await res.json()
  return data.choices[0].message.content
}

async function callProvider(message: string, agentId: string): Promise<string> {
  const config = AGENT_CONFIG[agentId]
  if (!config) throw new Error(`Unknown agent_id: ${agentId}`)

  switch (config.provider) {
    case 'openai': return callOpenAI(message, config)
    case 'anthropic': return callAnthropic(message, config)
    case 'perplexity': return callPerplexity(message, config)
    default: throw new Error(`Unknown provider: ${config.provider}`)
  }
}

/**
 * POST /api/agent
 *
 * Two modes:
 *   1. Submit + execute: body has { message, agent_id } → calls provider directly, returns result
 *   2. Poll (legacy compat): body has { task_id } → returns completed (tasks execute synchronously now)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Poll mode: client sends { task_id } to check status
    if (body.task_id) {
      const taskId = body.task_id

      if (pendingTasks.has(taskId)) {
        return NextResponse.json({ status: 'processing' })
      }

      const result = completedTasks.get(taskId)
      if (result) {
        completedTasks.delete(taskId)
        return NextResponse.json(result)
      }

      // Task might still be starting up
      return NextResponse.json({ status: 'processing' })
    }

    const { message, agent_id, user_id, session_id } = body

    if (!message || !agent_id) {
      return NextResponse.json({
        success: false,
        response: { status: 'error', result: {}, message: 'message and agent_id are required' },
        error: 'message and agent_id are required',
      }, { status: 400 })
    }

    // Check we have the right API key
    const config = AGENT_CONFIG[agent_id]
    if (!config) {
      return NextResponse.json({
        success: false,
        response: { status: 'error', result: {}, message: `Unknown agent_id: ${agent_id}` },
        error: `Unknown agent_id: ${agent_id}`,
      }, { status: 400 })
    }

    const keyCheck = (config.provider === 'openai' && !OPENAI_API_KEY)
      || (config.provider === 'anthropic' && !ANTHROPIC_API_KEY)
      || (config.provider === 'perplexity' && !PERPLEXITY_API_KEY)

    if (keyCheck) {
      return NextResponse.json({
        success: false,
        response: { status: 'error', result: {}, message: `${config.provider.toUpperCase()}_API_KEY not configured` },
        error: `${config.provider.toUpperCase()}_API_KEY not configured`,
      }, { status: 500 })
    }

    const finalUserId = user_id || `user-${generateUUID()}`
    const finalSessionId = session_id || `${agent_id}-${generateUUID().substring(0, 12)}`

    // For backward compatibility with the polling client, we return a task_id first
    // Then when the client polls, we execute and return
    // BUT — to make it simpler, let's store the request and execute inline

    // Actually, the client-side callAIAgent uses submit→poll pattern.
    // We need to keep that interface. So: submit returns task_id, poll executes.

    // Store pending tasks in memory (simple Map — works for single-instance)
    const taskId = generateUUID()
    pendingTasks.set(taskId, { message, agent_id, user_id: finalUserId, session_id: finalSessionId })

    // Start execution in background
    executeTask(taskId).catch(() => {})

    return NextResponse.json({
      task_id: taskId,
      agent_id,
      user_id: finalUserId,
      session_id: finalSessionId,
    })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Server error'
    return NextResponse.json({
      success: false,
      response: { status: 'error', result: {}, message: errorMsg },
      error: errorMsg,
    }, { status: 500 })
  }
}

// In-memory task store
const pendingTasks = new Map<string, { message: string; agent_id: string; user_id: string; session_id: string }>()
const completedTasks = new Map<string, any>()

async function executeTask(taskId: string) {
  const task = pendingTasks.get(taskId)
  if (!task) return

  try {
    const rawText = await callProvider(task.message, task.agent_id)
    const parsed = parseLLMJson(rawText)
    const normalized = normalizeResponse(parsed)

    completedTasks.set(taskId, {
      success: true,
      status: 'completed',
      response: normalized,
      timestamp: new Date().toISOString(),
      raw_response: rawText,
    })
  } catch (error) {
    completedTasks.set(taskId, {
      success: false,
      status: 'failed',
      response: { status: 'error', result: {}, message: error instanceof Error ? error.message : 'Agent execution failed' },
      error: error instanceof Error ? error.message : 'Agent execution failed',
    })
  } finally {
    pendingTasks.delete(taskId)
  }
}

// Also handle poll via a separate check
export async function GET(request: NextRequest) {
  const taskId = request.nextUrl.searchParams.get('task_id')
  if (!taskId) {
    return NextResponse.json({ error: 'task_id required' }, { status: 400 })
  }

  if (pendingTasks.has(taskId)) {
    return NextResponse.json({ status: 'processing' })
  }

  const result = completedTasks.get(taskId)
  if (result) {
    completedTasks.delete(taskId) // Clean up
    return NextResponse.json(result)
  }

  return NextResponse.json({ status: 'processing' }) // Not found yet, might still be executing
}
