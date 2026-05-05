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

// JSON schema the Research Agent must return — drives Perplexity's structured-output mode
// and matches the keys the dashboard reads in LiveCallDashboard.tsx.
const RESEARCH_SCHEMA = {
  type: 'object',
  properties: {
    person_profile: {
      type: 'object',
      properties: {
        full_name: { type: 'string' },
        headline: { type: 'string' },
        current_role: { type: 'string' },
        current_company: { type: 'string' },
        location: { type: 'string' },
        background_summary: { type: 'string' },
        linkedin_url: { type: 'string' },
        twitter_url: { type: 'string' },
        instagram_url: { type: 'string' },
        github_url: { type: 'string' },
        personal_website: { type: 'string' },
        photo_url: { type: 'string' },
        confidence: { type: 'string' },
        other_profiles: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              label: { type: 'string' },
              url: { type: 'string' },
            },
          },
        },
      },
    },
    company_profile: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        industry: { type: 'string' },
        size: { type: 'string' },
        headquarters: { type: 'string' },
        description: { type: 'string' },
        key_products: { type: 'string' },
        website: { type: 'string' },
      },
    },
    funding: {
      type: 'object',
      properties: {
        total_raised: { type: 'string' },
        latest_round: { type: 'string' },
        key_investors: { type: 'string' },
        financial_health: { type: 'string' },
      },
    },
    tech_stack: {
      type: 'object',
      properties: {
        technologies: { type: 'string' },
        infrastructure: { type: 'string' },
        tools: { type: 'string' },
      },
    },
    recent_news: { type: 'string' },
    pitch_angles: { type: 'string' },
    pain_points: { type: 'string' },
  },
}

// Agent config from workflow_state
const AGENT_CONFIG: Record<string, { provider: string; model: string; temperature: number; top_p: number; systemPrompt: string; schema?: any }> = {
  '69b03c357b2057cc3ff92a2b': {
    provider: 'perplexity',
    model: 'sonar-pro',
    temperature: 0,
    top_p: 1,
    systemPrompt: `You are a Research Agent for Aetheryx AI, supporting a live sales call. Perform real web searches and capture EVERY useful URL you find about this person — do not narrowly focus on only LinkedIn/X/GitHub, since those platforms often block search indexing.

INPUT: a prospect name and/or company name extracted from a live call. Information is often sparse (sometimes just a first name).

SEARCH STRATEGY:
1. Run a broad open-web search for the name — collect ALL profile-like URLs that appear (any platform, any spelling variant).
2. Try targeted searches: \`"<name>" linkedin\`, \`"<name>" twitter\`, \`"<name>" github\`, \`"<name>" founder OR CEO\`, \`"<name>" company\`, \`"<name>" interview OR podcast\`.
3. From the collected URLs, populate fields:
   - linkedin_url: any linkedin.com/in/ URL found
   - twitter_url: any x.com or twitter.com URL found
   - instagram_url: any instagram.com URL
   - github_url: any github.com/<handle> URL
   - personal_website: their own domain (handle spelling variants of the name, e.g. "Galani" vs "Gilani" — list as personal_website if it clearly belongs to them based on content)
   - other_profiles: ARRAY of { label, url } for ANY OTHER public footprint — e.g. SoundCloud, Crunchbase, AngelList, Companies House (UK director registry), North Data, podcast appearances, conference speaker pages, Medium, Substack, university faculty pages. Capture as many as you find — these are GOLD for sales context.
4. Photo URL: pick the most reliable hot-linkable image (GitHub avatar > Twitter/X avatar > personal site headshot). Direct image URL only on a known CDN (avatars.githubusercontent.com, pbs.twimg.com, gravatar.com). Leave empty string if none confirmed hot-linkable.
5. Company: from search results, infer current_company, then research industry, size, headquarters, description, key_products, website, funding history, tech stack, recent news.

CONFIDENCE wording:
- "High — primary match: <reason>" when one strong unambiguous match
- "Medium — best of N candidates: <reason>" when multiple plausible profiles exist
- "Low — only <N> public references found, none confirmed" when search returned little

DO NOT report empty fields as failure. If LinkedIn was not found but Companies House + SoundCloud were, that's still valuable — fill other_profiles with both. The goal is to give the rep ANY public context that helps the sales conversation.

ALWAYS produce concrete pitch_angles (talking points for this person's role + company pain) and pain_points (problems Aetheryx-style sales-intelligence tooling solves for them) — even with sparse info, make educated B2B-relevant guesses.

OUTPUT: ONLY a JSON object — no markdown, no preamble, no inline citations like [1]. URLs MUST be full https:// links if found, or empty string if not found. Use "Not publicly available" only as a last resort for individual non-URL sub-fields. Required top-level keys: person_profile, company_profile, funding, tech_stack, recent_news, pitch_angles, pain_points.`,
    schema: RESEARCH_SCHEMA,
  },
  '69b03c36778bd73de86e5ffd': {
    provider: 'openai',
    model: 'gpt-4.1',
    temperature: 0.5,
    top_p: 0.95,
    systemPrompt: `You are a Sales Strategy Agent for Aetheryx AI. Analyze live conversation transcript chunks and generate contextual suggestions. Return a JSON object with: objection_handlers (specific responses to prospect pushback), next_questions (best follow-up questions), pitch_angles (recommended talking points), engagement_level (assessment), deal_signals (buying signals detected), closing_probability (estimated percentage with reasoning).`,
  },
  '69b03c5393c7264ffc5fcc0d': {
    provider: 'openai',
    model: 'gpt-4.1',
    temperature: 0.4,
    top_p: 0.95,
    systemPrompt: `You are a Post-Call Intelligence Agent for Aetheryx AI. Process the complete call transcript and return a JSON object.

CRITICAL ANTI-HALLUCINATION RULES — read carefully:
- ONLY use information that is EXPLICITLY stated in the transcript text. Never invent, guess, or "fill in" any name, company, role, number, or fact that wasn't said.
- For client_name: extract a real proper-noun name (e.g. "Sarah", "Aman Galani", "Victor Machino") that the CLIENT said in introduction patterns like "My name is X", "I'm X", "this is X", "X here". The name must be a capitalized proper noun, NOT a generic noun like "the prospect" / "the client" / "speaker" / "someone". If no real proper-noun name was given, set client_name to "Not provided".
- If company was never said, set "company" to "Not provided".
- If pain_points were not discussed, return an empty array [], not invented points.
- For follow_up_email recipient_suggestion: use the same proper-noun name as client_name. If client_name is "Not provided", use "Prospect".
- For follow_up_email body: open with "Hi {client_name}," when client_name is a real proper-noun name. If client_name is "Not provided", open with "Hi there,". Never invent a name and never use a generic descriptor like "Hi the prospect,".

REP introduces themselves often — that's the salesperson, NOT the client. Distinguish carefully.

Required keys:
- summary: { client_name, company, call_outcome, key_points (array of strings actually said), pain_points (array of points the CLIENT raised), next_steps (array of actions actually agreed) }
- deal_probability: { score (percentage 0-100), positive_signals (array), negative_signals (array), risk_factors (array) }
- follow_up_email: { subject, body, recipient_suggestion }

Be specific and grounded — every field must trace back to the transcript.`,
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
  const body: any = {
    model: config.model,
    temperature: config.temperature,
    top_p: config.top_p,
    messages: [
      { role: 'system', content: config.systemPrompt },
      { role: 'user', content: message },
    ],
    // Force deeper web search — sonar-pro defaults to "low" which often skips profile lookups.
    web_search_options: { search_context_size: 'high' },
  }
  if (config.schema) {
    body.response_format = { type: 'json_schema', json_schema: { schema: config.schema } }
  }
  const res = await fetch(PERPLEXITY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${PERPLEXITY_API_KEY}` },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Perplexity API error (${res.status}): ${err}`)
  }
  const data = await res.json()
  return data.choices[0].message.content
}

// Recursively strip Perplexity's inline citation markers like [1], [2,3] from any string field.
function stripCitations(value: any): any {
  if (typeof value === 'string') return value.replace(/\s*\[\d+(?:,\s*\d+)*\]/g, '').trim()
  if (Array.isArray(value)) return value.map(stripCitations)
  if (value && typeof value === 'object') {
    const out: Record<string, any> = {}
    for (const k of Object.keys(value)) out[k] = stripCitations(value[k])
    return out
  }
  return value
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

    // Strip Perplexity's inline citation markers ([1], [2,3]) so JSON parses cleanly.
    const cleanedText = rawText.replace(/(?<="[^"\n]*?)\s*\[\d+(?:,\s*\d+)*\](?=[^"\n]*")/g, '')

    // Try direct JSON.parse first (providers should return valid JSON via response_format)
    let parsed: any = null
    try {
      parsed = JSON.parse(cleanedText)
    } catch {
      // Fallback to tolerant parser (handles markdown fences, partial JSON, etc)
      parsed = parseLLMJson(cleanedText)
      // If parseLLMJson returned its failure shape, use the raw text as-is
      if (parsed && typeof parsed === 'object' && parsed.success === false && parsed.data === null && parsed.rawJson === null) {
        // Last resort: try to extract JSON from raw text by finding { ... }
        const firstBrace = cleanedText.indexOf('{')
        const lastBrace = cleanedText.lastIndexOf('}')
        if (firstBrace !== -1 && lastBrace > firstBrace) {
          try {
            parsed = JSON.parse(cleanedText.slice(firstBrace, lastBrace + 1))
          } catch {
            parsed = { text: rawText }
          }
        } else {
          parsed = { text: rawText }
        }
      }
    }

    // Strip any leftover citation markers from string values across the parsed tree.
    parsed = stripCitations(parsed)

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
