'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { callAIAgent } from '@/lib/aiAgent'
import { copyToClipboard } from '@/lib/clipboard'
import fetchWrapper from '@/lib/fetchWrapper'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { FiPhone, FiPhoneOff, FiCopy, FiCheck, FiAlertCircle, FiRefreshCw, FiUser, FiUsers, FiMic, FiMicOff, FiSettings, FiRadio, FiZap, FiSearch, FiActivity, FiInfo, FiPlay } from 'react-icons/fi'

const RESEARCH_AGENT_ID = '69b03c357b2057cc3ff92a2b'
const STRATEGY_AGENT_ID = '69b03c36778bd73de86e5ffd'

interface TranscriptLine {
  id: string
  speaker: 'rep' | 'prospect'
  text: string
  timestamp: string
}

interface LiveCallDashboardProps {
  callActive: boolean
  transcript: TranscriptLine[]
  researchData: any
  strategyData: any
  onStartCall: (phoneNumber: string) => void
  onEndCall: () => void
  onAddTranscript: (line: TranscriptLine) => void
  onResearchData: (data: any) => void
  onStrategyData: (data: any) => void
  activeAgentId: string | null
  setActiveAgentId: (id: string | null) => void
  useSampleData: boolean
  callDuration: number
  callStatus: string
  phoneNumber: string
  onPhoneNumberChange: (num: string) => void
  twilioSid: string
  twilioAuth: string
  fromNumber: string
  deepgramKey: string
  repPhone: string
  onNavigateToConfig: () => void
}

function safeText(val: any, fallback: string = 'N/A'): string {
  if (val === null || val === undefined) return fallback
  if (typeof val === 'string') return val
  if (typeof val === 'number') return String(val)
  try { return JSON.stringify(val) } catch (_e) { return fallback }
}

function formatInline(text: string): React.ReactNode {
  try {
    const parts = text.split(/\*\*(.*?)\*\*/g)
    if (parts.length === 1) return text
    return parts.map((part, i) =>
      i % 2 === 1 ? <strong key={i} className="font-semibold">{part}</strong> : part
    )
  } catch (_e) {
    return text
  }
}

function renderLines(text: any): React.ReactNode {
  const str = safeText(text, '')
  if (!str) return null
  try {
    return (
      <div className="space-y-1">
        {str.split('\n').map((line: string, i: number) => {
          const trimmed = line.trim()
          if (!trimmed) return <div key={i} className="h-0.5" />
          if (trimmed.startsWith('### ')) return <h4 key={i} className="font-medium text-xs mt-2 mb-0.5">{trimmed.slice(4)}</h4>
          if (trimmed.startsWith('## ')) return <h3 key={i} className="font-medium text-sm mt-2 mb-0.5">{trimmed.slice(3)}</h3>
          if (trimmed.startsWith('# ')) return <h2 key={i} className="font-semibold text-sm mt-2 mb-1">{trimmed.slice(2)}</h2>
          if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) return <li key={i} className="ml-3 list-disc text-xs leading-relaxed">{formatInline(trimmed.slice(2))}</li>
          if (/^\d+\.\s/.test(trimmed)) return <li key={i} className="ml-3 list-decimal text-xs leading-relaxed">{formatInline(trimmed.replace(/^\d+\.\s/, ''))}</li>
          return <p key={i} className="text-xs leading-relaxed">{formatInline(trimmed)}</p>
        })}
      </div>
    )
  } catch (_e) {
    return <p className="text-xs">{str}</p>
  }
}

// --- Simulated real-time transcript data ---
const SIMULATED_CONVERSATION: Array<{ speaker: 'rep' | 'prospect'; text: string; delay: number }> = [
  { speaker: 'rep', text: 'Hi, this is Alex from SalesMaster AI. Am I speaking with Sarah Johnson?', delay: 2000 },
  { speaker: 'prospect', text: 'Yes, this is Sarah. Hi Alex, I was expecting your call.', delay: 4000 },
  { speaker: 'rep', text: 'Great! Thanks for taking the time today. I understand you are the VP of Operations at Acme Corp and you have been looking into workflow automation solutions.', delay: 6500 },
  { speaker: 'prospect', text: 'That is correct. We have been evaluating several platforms. Our team is spending way too much time on manual data entry across multiple systems.', delay: 9000 },
  { speaker: 'rep', text: 'I hear that a lot from companies your size. Can you tell me a bit more about your current workflow? How many systems does your team interact with daily?', delay: 12000 },
  { speaker: 'prospect', text: 'We use about five different tools — Salesforce, Jira, Slack, Datadog, and our internal ERP. The problem is none of them talk to each other seamlessly. Our team wastes at least 10 hours per week on manual data syncing.', delay: 16000 },
  { speaker: 'rep', text: 'That is significant. Ten hours per week across how many team members?', delay: 18500 },
  { speaker: 'prospect', text: 'About 50 people in operations. So you can imagine the cost. We have a budget allocated for Q2 to solve this, around 200K annually.', delay: 22000 },
  { speaker: 'rep', text: 'Understood. And what has your experience been with the other solutions you have evaluated so far?', delay: 25000 },
  { speaker: 'prospect', text: 'We looked at Zapier Enterprise but it felt too basic for our needs. We need something with AI capabilities that can learn our workflows, not just simple if-then rules.', delay: 29000 },
  { speaker: 'rep', text: 'That is exactly where we differentiate. Our platform uses AI-powered automation that adapts to your processes. Would it be helpful if I showed you how we integrate with Salesforce and Jira specifically?', delay: 33000 },
  { speaker: 'prospect', text: 'Absolutely. And what about security? We need SOC 2 Type II compliance. That is non-negotiable for us.', delay: 36000 },
  { speaker: 'rep', text: 'We are SOC 2 Type II certified and also GDPR compliant. Security is foundational for us, especially with enterprise clients like Acme Corp.', delay: 39000 },
  { speaker: 'prospect', text: 'Good to hear. Can we schedule a technical demo with my engineering team? Our VP of Engineering, Mike Chen, would need to sign off on this.', delay: 43000 },
  { speaker: 'rep', text: 'Of course! I would love to set that up. How does next Tuesday at 2 PM work for your team?', delay: 46000 },
  { speaker: 'prospect', text: 'Let me check... Yes, Tuesday at 2 PM Pacific works for us. I will loop in Mike and two of our senior engineers.', delay: 49000 },
  { speaker: 'rep', text: 'Perfect. I will send over a calendar invite and a brief overview document so your team can prepare any technical questions ahead of time.', delay: 52000 },
  { speaker: 'prospect', text: 'That sounds great Alex. Looking forward to it. One last thing — what is your typical implementation timeline?', delay: 55000 },
  { speaker: 'rep', text: 'For a company your size, we typically do a 30-day pilot with dedicated support, then full rollout within 60 days. We assign a dedicated customer success manager for the entire process.', delay: 59000 },
  { speaker: 'prospect', text: 'That timeline works well for us. We want to have something in place before Q3. Thanks Alex, this has been very helpful.', delay: 62000 },
]

const SAMPLE_RESEARCH = {
  company_profile: { name: 'Acme Corp', industry: 'Enterprise SaaS', size: '500-1000 employees', headquarters: 'San Francisco, CA', description: 'Leading provider of cloud-based workflow automation solutions for mid-market enterprises.', key_products: 'Acme Flow, Acme Automate, Acme Analytics' },
  funding: { total_raised: '$85M', latest_round: 'Series C - $40M (2024)', key_investors: 'Sequoia Capital, Andreessen Horowitz', financial_health: 'Strong - 40% YoY revenue growth' },
  tech_stack: { technologies: 'React, Node.js, Python, Kubernetes', infrastructure: 'AWS, CloudFlare', tools: 'Salesforce, Slack, Jira, Datadog' },
  recent_news: '- Launched new AI-powered automation features in Q1 2025\n- Expanded to European market with London office\n- Named a Gartner Cool Vendor in Process Automation',
  pitch_angles: '- Their current workflow tools lack AI capabilities we provide\n- Recent expansion means need for scalable solutions\n- Integration with their existing Salesforce stack is a differentiator',
  pain_points: '- Manual data entry across systems\n- Lack of real-time analytics on workflows\n- Difficulty scaling automation rules'
}

const SAMPLE_STRATEGY = {
  objection_handlers: '- "Too expensive": Highlight ROI from reduced manual work (avg 30% time savings)\n- "Already have a solution": Focus on AI differentiation and integration depth\n- "Need to think about it": Offer a 14-day pilot with dedicated support',
  next_questions: '- What does your current workflow automation process look like?\n- How many hours per week does your team spend on manual data entry?\n- What integrations are most critical for your tech stack?',
  pitch_angles: '- AI-powered automation reduces manual work by 40%\n- Seamless Salesforce integration (they already use it)\n- Enterprise-grade security with SOC 2 Type II compliance',
  engagement_level: 'High - Prospect is asking detailed technical questions and has mentioned budget availability',
  deal_signals: '- Budget mentioned: Q2 budget allocated for automation tools\n- Timeline: Looking to implement within 60 days\n- Decision maker on the call\n- Integration questions indicate serious evaluation',
  closing_probability: '72%'
}

function LoadingPlaceholder({ count }: { count: number }) {
  return (
    <div className="space-y-3 pt-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse bg-muted rounded h-16 w-full" />
      ))}
    </div>
  )
}

function CopyBtn({ text, id, copiedId, onCopy }: { text: string; id: string; copiedId: string | null; onCopy: (t: string, i: string) => void }) {
  return (
    <button onClick={() => onCopy(text, id)} className="text-muted-foreground hover:text-foreground p-0.5">
      {copiedId === id ? <FiCheck className="w-3 h-3 text-green-600" /> : <FiCopy className="w-3 h-3" />}
    </button>
  )
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0')
}

// Simple entity extraction from transcript text
function extractEntities(text: string): { companies: string[]; people: string[] } {
  const companies: string[] = []
  const people: string[] = []
  // Common filler words that look like names but aren't
  const skipWords = new Set(['The', 'This', 'That', 'What', 'When', 'Where', 'How', 'Well', 'Just', 'Also', 'Thank', 'Thanks', 'Hello', 'Good', 'Great', 'Sure', 'Yeah', 'Yes', 'Hey', 'Hi', 'Okay', 'Right', 'Let', 'But', 'And', 'So', 'Now', 'Actually', 'Really', 'Very', 'Much', 'Some', 'Any', 'Our', 'Your', 'Their', 'About', 'Been', 'Have', 'Would', 'Could', 'Should', 'Will', 'Can', 'May', 'Might'])
  try {
    // Match company names: "at/from/with/for CompanyName" or "CompanyName Corp/Inc/etc"
    const companyPatterns = text.match(/(?:at|from|with|for|called|named|company|work at|works at)\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*)/g)
    if (Array.isArray(companyPatterns)) {
      companyPatterns.forEach(function(m) {
        const name = m.replace(/^(?:at|from|with|for|called|named|company|work at|works at)\s+/, '').trim()
        if (name.length > 2 && !companies.includes(name) && !skipWords.has(name)) companies.push(name)
      })
    }
    // Match explicit company suffixes anywhere: "Acme Corp", "TechFlow Inc"
    const suffixPatterns = text.match(/[A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*\s+(?:Corp|Inc|Ltd|LLC|Co|AI|Tech|Solutions|Software|Labs|Group|Systems|Global|Digital|Cloud|Media|Health|Bio|Finance|Capital|Ventures|Partners|Consulting|Services|Technologies|Dynamics|Industries|Networks|Analytics|Platform|Enterprises)/g)
    if (Array.isArray(suffixPatterns)) {
      suffixPatterns.forEach(function(m) {
        const name = m.trim()
        if (name.length > 2 && !companies.includes(name)) companies.push(name)
      })
    }
    // Match person names: "I'm John Smith", "this is Jane Doe", "my name is ...", "speaking with ..."
    const namePatterns = text.match(/(?:I'm|I am|this is|name is|name's|speaking with|with|to|ask|loop in|contact|meet|meeting|call with|called|calling)\s+([A-Z][a-z]+\s+[A-Z][a-z]+)/g)
    if (Array.isArray(namePatterns)) {
      namePatterns.forEach(function(m) {
        const name = m.replace(/^(?:I'm|I am|this is|name is|name's|speaking with|with|to|ask|loop in|contact|meet|meeting|call with|called|calling)\s+/, '').trim()
        if (name.length > 3 && !people.includes(name) && !skipWords.has(name.split(' ')[0])) people.push(name)
      })
    }
    // Also catch standalone "FirstName LastName" patterns (two consecutive capitalized words)
    const standaloneNames = text.match(/\b([A-Z][a-z]{1,15}\s+[A-Z][a-z]{1,15})\b/g)
    if (Array.isArray(standaloneNames)) {
      standaloneNames.forEach(function(m) {
        const name = m.trim()
        const first = name.split(' ')[0]
        if (name.length > 5 && !people.includes(name) && !skipWords.has(first) && !companies.includes(name)) {
          people.push(name)
        }
      })
    }
  } catch (_e) { /* ignore */ }
  return { companies, people }
}

export default function LiveCallDashboard(props: LiveCallDashboardProps) {
  try {
    return <LiveCallDashboardInner {...props} />
  } catch (_e) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-destructive">Failed to render Live Call Dashboard. Please try refreshing the page.</p>
      </div>
    )
  }
}

function LiveCallDashboardInner({
  callActive, transcript, researchData, strategyData,
  onStartCall, onEndCall, onAddTranscript, onResearchData, onStrategyData,
  activeAgentId, setActiveAgentId, useSampleData,
  callDuration, callStatus, phoneNumber, onPhoneNumberChange,
  twilioSid, twilioAuth, fromNumber, deepgramKey, repPhone, onNavigateToConfig
}: LiveCallDashboardProps) {
  const [researchLoading, setResearchLoading] = useState(false)
  const [strategyLoading, setStrategyLoading] = useState(false)
  const [researchError, setResearchError] = useState('')
  const [strategyError, setStrategyError] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [muted, setMuted] = useState(false)
  const [detectedEntities, setDetectedEntities] = useState<{ companies: string[]; people: string[] }>({ companies: [], people: [] })
  const [researchTriggered, setResearchTriggered] = useState(false)
  const [strategyTriggered, setStrategyTriggered] = useState(false)
  const [autoResearchCount, setAutoResearchCount] = useState(0)
  const [autoStrategyCount, setAutoStrategyCount] = useState(0)
  const [liveCallSid, setLiveCallSid] = useState<string | null>(null)
  const [liveCallError, setLiveCallError] = useState('')
  const [deepgramConnected, setDeepgramConnected] = useState(false)
  const [dialingLive, setDialingLive] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const simulationRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const strategyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const deepgramWsRef = useRef<WebSocket | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const callPollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const twilioDeviceRef = useRef<any>(null)
  const activeCallRef = useRef<any>(null)
  const remoteDeepgramWsRef = useRef<WebSocket | null>(null)

  // AI Chat state
  const [chatOpen, setChatOpen] = useState(false)
  const [chatMessages, setChatMessages] = useState<{ id: string; role: 'user' | 'ai'; text: string }[]>([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const chatScrollRef = useRef<HTMLDivElement>(null)

  const safeTranscript = Array.isArray(transcript) ? transcript : []
  const displayResearch = useSampleData ? SAMPLE_RESEARCH : researchData
  const displayStrategy = useSampleData ? SAMPLE_STRATEGY : strategyData
  const isLiveMode = Boolean(twilioSid && twilioAuth && deepgramKey)

  // Auto-scroll transcript
  useEffect(() => {
    try {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight
      }
    } catch (_e) { /* ignore */ }
  }, [transcript])

  // Cleanup live call resources when call ends
  useEffect(() => {
    if (!callActive) {
      // Stop Deepgram WebSockets (both local mic and remote)
      try {
        if (deepgramWsRef.current) {
          deepgramWsRef.current.close()
          deepgramWsRef.current = null
        }
      } catch (_e) { /* ignore */ }
      try {
        if (remoteDeepgramWsRef.current) {
          remoteDeepgramWsRef.current.close()
          remoteDeepgramWsRef.current = null
        }
      } catch (_e) { /* ignore */ }
      // Stop media stream
      try {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
          mediaRecorderRef.current.stop()
        }
        mediaRecorderRef.current = null
      } catch (_e) { /* ignore */ }
      try {
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach(function(track) { track.stop() })
          mediaStreamRef.current = null
        }
      } catch (_e) { /* ignore */ }
      // Stop call status polling
      try {
        if (callPollRef.current) {
          clearInterval(callPollRef.current)
          callPollRef.current = null
        }
      } catch (_e) { /* ignore */ }
      setDeepgramConnected(false)
      setLiveCallSid(null)
    }
  }, [callActive])

  // Simulate real-time transcription when call is active (DEMO MODE ONLY)
  useEffect(() => {
    if (!callActive || isLiveMode) {
      // Clear all simulation timers
      simulationRef.current.forEach(function(t) { clearTimeout(t) })
      simulationRef.current = []
      return
    }

    // Start simulated transcript streaming (only in demo mode)
    const timers: ReturnType<typeof setTimeout>[] = []

    SIMULATED_CONVERSATION.forEach(function(entry, idx) {
      const timer = setTimeout(function() {
        try {
          const line: TranscriptLine = {
            id: 'auto-' + Date.now() + '-' + idx,
            speaker: entry.speaker,
            text: entry.text,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
          }
          onAddTranscript(line)
        } catch (_e) { /* ignore */ }
      }, entry.delay)
      timers.push(timer)
    })

    simulationRef.current = timers

    return function() {
      timers.forEach(function(t) { clearTimeout(t) })
    }
  }, [callActive, isLiveMode, onAddTranscript])

  // Entity detection from transcript
  useEffect(() => {
    if (safeTranscript.length === 0) return
    try {
      const fullText = safeTranscript.map(function(l) { return safeText(l?.text, '') }).join(' ')
      const entities = extractEntities(fullText)
      setDetectedEntities(entities)
    } catch (_e) { /* ignore */ }
  }, [safeTranscript.length])

  // Auto-trigger Research Agent when entities detected OR after enough transcript lines
  useEffect(() => {
    if (!callActive || researchTriggered || researchLoading) return
    if (safeTranscript.length < 1) return

    const hasEntities = detectedEntities.companies.length > 0 || detectedEntities.people.length > 0

    if (hasEntities) {
      // Entity found — trigger immediately with structured data
      const companyName = detectedEntities.companies[0] || ''
      const personName = detectedEntities.people[0] || ''
      if (!companyName && !personName) return
      setResearchTriggered(true)
      handleAutoResearch(companyName, personName)
    } else if (safeTranscript.length >= 3) {
      // No entities detected by regex after 3 lines — send raw transcript to AI
      // The AI agent is smarter at extracting names from garbled transcription
      setResearchTriggered(true)
      const rawText = safeTranscript.map(function(l) {
        return (l?.speaker === 'rep' ? 'Sales Rep' : 'Prospect') + ': ' + safeText(l?.text, '')
      }).join('\n')
      handleAutoResearchFromTranscript(rawText)
    }
  }, [detectedEntities, callActive, researchTriggered, researchLoading, safeTranscript.length])

  // Auto-trigger Strategy Agent periodically during call
  useEffect(() => {
    if (!callActive || safeTranscript.length < 2) return

    // Trigger strategy every ~15 seconds of new transcript data
    if (strategyTimerRef.current) {
      clearTimeout(strategyTimerRef.current)
    }

    strategyTimerRef.current = setTimeout(function() {
      if (!strategyLoading) {
        handleAutoStrategy()
      }
    }, 3000) // Wait 3s after last transcript update

    return function() {
      if (strategyTimerRef.current) {
        clearTimeout(strategyTimerRef.current)
      }
    }
  }, [safeTranscript.length, callActive])

  const handleAutoResearch = async (company: string, person: string) => {
    setResearchLoading(true)
    setResearchError('')
    setActiveAgentId(RESEARCH_AGENT_ID)
    setAutoResearchCount(function(c) { return c + 1 })
    try {
      const query = 'Research this prospect/company for a sales call: ' + company + (person ? ' (contact: ' + person + ')' : '')
      const result = await callAIAgent(query, RESEARCH_AGENT_ID)
      if (result?.success) {
        onResearchData(result?.response?.result ?? {})
      } else {
        setResearchError(safeText(result?.error, 'Research failed'))
      }
    } catch (err: any) {
      setResearchError(safeText(err?.message, 'Network error'))
    } finally {
      setResearchLoading(false)
      setActiveAgentId(null)
    }
  }

  const handleAutoResearchFromTranscript = async (rawTranscript: string) => {
    setResearchLoading(true)
    setResearchError('')
    setActiveAgentId(RESEARCH_AGENT_ID)
    setAutoResearchCount(function(c) { return c + 1 })
    try {
      const query = 'You are listening to a live sales call. Extract the prospect\'s name, company, and any details from this transcript, then research them thoroughly. The transcript may have speech-to-text errors so infer the most likely real names/companies:\n\n' + rawTranscript
      const result = await callAIAgent(query, RESEARCH_AGENT_ID)
      if (result?.success) {
        onResearchData(result?.response?.result ?? {})
      } else {
        setResearchError(safeText(result?.error, 'Research failed'))
      }
    } catch (err: any) {
      setResearchError(safeText(err?.message, 'Network error'))
    } finally {
      setResearchLoading(false)
      setActiveAgentId(null)
    }
  }

  const handleAutoStrategy = async () => {
    if (safeTranscript.length === 0) return
    const transcriptText = safeTranscript.map(function(l) {
      return (l?.speaker === 'rep' ? 'Sales Rep' : 'Prospect') + ': ' + safeText(l?.text, '')
    }).join('\n')
    if (!transcriptText.trim()) return
    setStrategyLoading(true)
    setStrategyError('')
    setActiveAgentId(STRATEGY_AGENT_ID)
    setAutoStrategyCount(function(c) { return c + 1 })
    try {
      const result = await callAIAgent('Analyze this live sales call transcript and provide real-time coaching suggestions. Focus on immediate next best actions:\n\n' + transcriptText, STRATEGY_AGENT_ID)
      if (result?.success) {
        onStrategyData(result?.response?.result ?? {})
      } else {
        setStrategyError(safeText(result?.error, 'Strategy analysis failed'))
      }
    } catch (err: any) {
      setStrategyError(safeText(err?.message, 'Network error'))
    } finally {
      setStrategyLoading(false)
      setActiveAgentId(null)
    }
  }

  // Auto-scroll chat
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight
    }
  }, [chatMessages.length])

  const handleChatSend = async () => {
    const msg = chatInput.trim()
    if (!msg || chatLoading) return
    setChatInput('')
    const userMsg = { id: 'chat-u-' + Date.now(), role: 'user' as const, text: msg }
    setChatMessages(function(prev) { return prev.concat([userMsg]) })
    setChatLoading(true)
    try {
      const transcriptContext = safeTranscript.length > 0
        ? '\n\nCurrent live call transcript:\n' + safeTranscript.map(function(l) {
            return (l?.speaker === 'rep' ? 'Sales Rep' : 'Prospect') + ': ' + safeText(l?.text, '')
          }).join('\n')
        : ''
      const query = 'You are an AI sales coach assisting a sales rep during a live call. Answer their question concisely and actionably.' + transcriptContext + '\n\nSales rep asks: ' + msg
      const result = await callAIAgent(query, STRATEGY_AGENT_ID)
      const aiText = result?.success
        ? safeText(result?.response?.message, '') || safeText(result?.response?.result?.response, '') || safeText(result?.response?.result?.text, '') || JSON.stringify(result?.response?.result ?? 'No response')
        : 'Sorry, I could not process that request.'
      setChatMessages(function(prev) { return prev.concat([{ id: 'chat-a-' + Date.now(), role: 'ai', text: aiText }]) })
    } catch (_e) {
      setChatMessages(function(prev) { return prev.concat([{ id: 'chat-e-' + Date.now(), role: 'ai', text: 'Connection error. Please try again.' }]) })
    } finally {
      setChatLoading(false)
    }
  }

  const handleCopy = async (text: string, id: string) => {
    try {
      await copyToClipboard(text)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 1500)
    } catch (_e) { /* ignore */ }
  }

  // --- Live Mode: Connect to Deepgram for real-time transcription ---
  const startDeepgramTranscription = useCallback(async () => {
    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { sampleRate: 16000, channelCount: 1, echoCancellation: true, noiseSuppression: true }
      })
      mediaStreamRef.current = stream

      // Connect to Deepgram WebSocket
      const dgUrl = 'wss://api.deepgram.com/v1/listen?model=nova-2&encoding=linear16&sample_rate=16000&channels=1&punctuate=true&interim_results=true&utterance_end_ms=1500&vad_events=true&smart_format=true&diarize=true&language=en&filler_words=false&numerals=true'
      const ws = new WebSocket(dgUrl, ['token', deepgramKey])
      deepgramWsRef.current = ws

      ws.onopen = function() {
        setDeepgramConnected(true)
        setLiveCallError('')

        // Create AudioContext to process mic audio
        try {
          const audioContext = new AudioContext({ sampleRate: 16000 })
          const source = audioContext.createMediaStreamSource(stream)
          const processor = audioContext.createScriptProcessor(4096, 1, 1)

          processor.onaudioprocess = function(e: AudioProcessingEvent) {
            if (ws.readyState !== WebSocket.OPEN) return
            try {
              const inputData = e.inputBuffer.getChannelData(0)
              // Convert Float32 to Int16 PCM
              const pcm16 = new Int16Array(inputData.length)
              for (let i = 0; i < inputData.length; i++) {
                const s = Math.max(-1, Math.min(1, inputData[i]))
                pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF
              }
              ws.send(pcm16.buffer)
            } catch (_e) { /* ignore */ }
          }

          source.connect(processor)
          // Connect to a silent gain node (NOT audioContext.destination to avoid echo)
          const silentGain = audioContext.createGain()
          silentGain.gain.value = 0
          silentGain.connect(audioContext.destination)
          processor.connect(silentGain)
        } catch (audioErr) {
          console.error('Audio processing error:', audioErr)
        }
      }

      let interimLineId: string | null = null

      ws.onmessage = function(event: MessageEvent) {
        try {
          const data = JSON.parse(event.data)
          if (data.type === 'Results' && data.channel) {
            const alt = data.channel?.alternatives?.[0]
            if (!alt) return
            const transcriptText = alt.transcript?.trim()
            if (!transcriptText) return

            const isFinal = data.is_final
            const speaker = data.channel?.alternatives?.[0]?.words?.[0]?.speaker
            // Speaker 0 = rep (user), Speaker 1 = prospect (other party)
            const speakerLabel: 'rep' | 'prospect' = speaker === 1 ? 'prospect' : 'rep'
            const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })

            if (isFinal) {
              // Remove interim line if it exists
              interimLineId = null
              const line: TranscriptLine = {
                id: 'live-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
                speaker: speakerLabel,
                text: transcriptText,
                timestamp: timestamp
              }
              onAddTranscript(line)
            }
            // We skip interim results in the transcript to avoid flicker
          }
        } catch (_e) { /* ignore parse errors */ }
      }

      ws.onerror = function() {
        setLiveCallError('Deepgram connection error. Check your API key.')
        setDeepgramConnected(false)
      }

      ws.onclose = function() {
        setDeepgramConnected(false)
      }
    } catch (err: any) {
      if (err?.name === 'NotAllowedError') {
        setLiveCallError('Microphone access denied. Please allow microphone access in your browser settings to enable live transcription.')
      } else {
        setLiveCallError('Failed to start transcription: ' + (err?.message || 'Unknown error'))
      }
    }
  }, [deepgramKey, onAddTranscript])

  // --- Live Mode: Transcribe prospect's voice (remote WebRTC audio) ---
  const startRemoteTranscription = useCallback(async (call: any) => {
    // Retry loop — remote stream may not be available immediately after 'accept'
    for (let attempt = 0; attempt < 10; attempt++) {
      try {
        // Method 1: Twilio SDK v2 getRemoteStream()
        if (typeof call?.getRemoteStream === 'function') {
          const rs = call.getRemoteStream()
          if (rs && rs.getAudioTracks().length > 0) {
            console.log('[Aetheryx] Got remote stream via getRemoteStream() on attempt', attempt)
            return startRemoteDgStream(rs)
          }
        }

        // Method 2: Internal _remoteStream
        const rs2 = call?._mediaHandler?._remoteStream
        if (rs2 && rs2.getAudioTracks().length > 0) {
          console.log('[Aetheryx] Got remote stream via _mediaHandler._remoteStream on attempt', attempt)
          return startRemoteDgStream(rs2)
        }

        // Method 3: PeerConnection receivers
        const pc: RTCPeerConnection | undefined =
          call?._mediaHandler?.version?.pc ??
          call?._mediaHandler?.peerConnection
        if (pc) {
          const ms = new MediaStream()
          pc.getReceivers().forEach((r: RTCRtpReceiver) => {
            if (r.track?.kind === 'audio') ms.addTrack(r.track)
          })
          if (ms.getAudioTracks().length > 0) {
            console.log('[Aetheryx] Got remote stream via PeerConnection receivers on attempt', attempt)
            return startRemoteDgStream(ms)
          }
        }

        // Method 4: Capture from <audio> elements Twilio creates
        if (attempt >= 3) {
          const audioEls = document.querySelectorAll('audio')
          for (const audio of audioEls) {
            const cap = (audio as any).captureStream?.() || (audio as any).mozCaptureStream?.()
            if (cap && cap.getAudioTracks().length > 0) {
              console.log('[Aetheryx] Got remote stream via audio element capture on attempt', attempt)
              return startRemoteDgStream(cap)
            }
          }
        }
      } catch (_e) { /* retry */ }

      // Wait before retrying — increasing delay
      await new Promise(r => setTimeout(r, 500 + attempt * 300))
    }
    console.log('[Aetheryx] Could not capture remote audio after 10 attempts')
  }, [deepgramKey, onAddTranscript])

  const startRemoteDgStream = useCallback(async (remoteStream: MediaStream) => {
    try {
      if (remoteStream.getTracks().length === 0) return

      const dgUrl = 'wss://api.deepgram.com/v1/listen?model=nova-2&encoding=linear16&sample_rate=16000&channels=1&punctuate=true&interim_results=false&utterance_end_ms=1500&smart_format=true&language=en&filler_words=false&numerals=true'
      const ws = new WebSocket(dgUrl, ['token', deepgramKey])
      remoteDeepgramWsRef.current = ws

      ws.onopen = function() {
        try {
          const audioContext = new AudioContext({ sampleRate: 16000 })
          const source = audioContext.createMediaStreamSource(remoteStream)
          const processor = audioContext.createScriptProcessor(4096, 1, 1)
          processor.onaudioprocess = function(e: AudioProcessingEvent) {
            if (ws.readyState !== WebSocket.OPEN) return
            try {
              const inputData = e.inputBuffer.getChannelData(0)
              const pcm16 = new Int16Array(inputData.length)
              for (let i = 0; i < inputData.length; i++) {
                const s = Math.max(-1, Math.min(1, inputData[i]))
                pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF
              }
              ws.send(pcm16.buffer)
            } catch (_e) { /* ignore */ }
          }
          source.connect(processor)
          const silentGain = audioContext.createGain()
          silentGain.gain.value = 0
          silentGain.connect(audioContext.destination)
          processor.connect(silentGain)
        } catch (_e) { /* ignore */ }
      }

      ws.onmessage = function(event: MessageEvent) {
        try {
          const data = JSON.parse(event.data)
          if (data.type === 'Results' && data.is_final) {
            const text = data.channel?.alternatives?.[0]?.transcript?.trim()
            if (text) {
              onAddTranscript({
                id: 'remote-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
                speaker: 'prospect',
                text,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
              })
            }
          }
        } catch (_e) { /* ignore */ }
      }

      ws.onerror = function() { remoteDeepgramWsRef.current = null }
      ws.onclose = function() { remoteDeepgramWsRef.current = null }
    } catch (_e) { /* ignore — remote transcription is best-effort */ }
  }, [deepgramKey, onAddTranscript])

  // --- Live Mode: Initialize Twilio Device (WebRTC) + auto-refresh token ---
  useEffect(() => {
    if (!isLiveMode || !twilioSid) return
    let device: any = null
    let refreshTimer: ReturnType<typeof setTimeout> | null = null

    async function getToken(): Promise<string | null> {
      try {
        const res = await fetchWrapper('/api/twilio/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accountSid: twilioSid }),
        })
        if (!res) return null
        const data = await res.json()
        if (!data.success || !data.token) return null
        return data.token
      } catch { return null }
    }

    async function initDevice() {
      try {
        const token = await getToken()
        if (!token) {
          setLiveCallError('Failed to get Twilio access token')
          return
        }
        const { Device } = await import('@twilio/voice-sdk')
        device = new Device(token, { logLevel: 1 })

        // Auto-refresh token before it expires (every 50 minutes)
        device.on('tokenWillExpire', async () => {
          const newToken = await getToken()
          if (newToken && device) {
            device.updateToken(newToken)
          }
        })

        device.on('error', (err: any) => {
          // If token expired, silently refresh instead of showing error
          if (err?.code === 20104 || err?.message?.includes('expired')) {
            getToken().then(newToken => {
              if (newToken && device) device.updateToken(newToken)
            })
            return
          }
          setLiveCallError('Twilio Device error: ' + (err?.message || 'Unknown'))
        })

        await device.register()
        twilioDeviceRef.current = device

        // Backup: refresh token every 50 minutes in case tokenWillExpire doesn't fire
        refreshTimer = setInterval(async () => {
          const newToken = await getToken()
          if (newToken && twilioDeviceRef.current) {
            try { twilioDeviceRef.current.updateToken(newToken) } catch {}
          }
        }, 50 * 60 * 1000)

      } catch (err: any) {
        setLiveCallError('Failed to initialize voice device: ' + (err?.message || 'Unknown error'))
      }
    }

    initDevice()
    return () => {
      if (refreshTimer) clearInterval(refreshTimer)
      if (device) { try { device.destroy() } catch {} }
      twilioDeviceRef.current = null
    }
  }, [isLiveMode, twilioSid])

  // --- Live Mode: Place call via WebRTC ---
  const handleLiveDial = async () => {
    if (!phoneNumber.trim()) return
    setLiveCallError('')
    setDialingLive(true)

    const cleanNumber = phoneNumber.replace(/[\s\-\(\)]/g, '')
    if (!cleanNumber.startsWith('+')) {
      setLiveCallError('Phone number must be in E.164 format starting with "+". Example: +14155551234')
      setDialingLive(false)
      return
    }

    try {
      if (!twilioDeviceRef.current) {
        setLiveCallError('Voice device not ready yet — please wait a moment and try again.')
        setDialingLive(false)
        return
      }

      const call = await twilioDeviceRef.current.connect({
        params: {
          To: cleanNumber,
          CallerId: fromNumber ? fromNumber.replace(/[\s\-\(\)]/g, '') : '',
        },
      })

      activeCallRef.current = call
      setDialingLive(false)
      onStartCall(phoneNumber)

      call.on('accept', () => {
        // Start transcribing the prospect's side once WebRTC is established
        startRemoteTranscription(call)
      })
      call.on('disconnect', () => {
        activeCallRef.current = null
        onEndCall()
      })
      call.on('error', (err: any) => {
        setLiveCallError('Call error: ' + (err?.message || 'Unknown'))
        setDialingLive(false)
      })

      // Start Deepgram transcription in parallel
      await startDeepgramTranscription()
    } catch (err: any) {
      setLiveCallError('Failed to connect call: ' + (err?.message || 'Unknown error'))
      setDialingLive(false)
    }
  }

  // --- Live Mode: End call ---
  const handleLiveEndCall = async () => {
    if (activeCallRef.current) {
      try { activeCallRef.current.disconnect() } catch (_e) { /* ignore */ }
      activeCallRef.current = null
    }
    onEndCall()
  }

  const handleDial = () => {
    if (!phoneNumber.trim()) return

    if (isLiveMode) {
      // Live mode: place real call via Twilio + start Deepgram
      handleLiveDial()
    } else {
      // Demo mode: run simulation
      onStartCall(phoneNumber)
    }

    setResearchTriggered(false)
    setAutoResearchCount(0)
    setAutoStrategyCount(0)
    setDetectedEntities({ companies: [], people: [] })
  }

  // --- Pre-Call State: Full-height Dialer ---
  if (!callActive) {
    return (
      <div className="rounded-2xl border border-white/[0.06] flex flex-col" style={{ background: '#0c1120', height: 'calc(100vh - 180px)', minHeight: 400 }}>

        {/* Header */}
        <div className="flex items-center gap-3 px-5 pt-5 pb-3 flex-shrink-0">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: isLiveMode ? 'rgba(52,211,153,0.1)' : 'rgba(33,107,228,0.1)' }}>
            {isLiveMode ? <FiPhone className="w-5 h-5 text-emerald-400" /> : <FiPlay className="w-5 h-5 text-[#216BE4]" />}
          </div>
          <div>
            <h3 className="text-[15px] font-semibold text-white/80" style={{ fontFamily: "'Instrument Serif', serif" }}>
              {isLiveMode ? 'Start a Sales Call' : 'Run Demo Simulation'}
            </h3>
            <p className="text-[11px] text-white/25">{isLiveMode ? 'Real call via Twilio + Deepgram' : 'Simulated conversation with AI agents'}</p>
          </div>
        </div>

        {/* Center: Phone input + Dial Pad — fills remaining space */}
        <div className="flex-1 flex flex-col items-center justify-center px-5 py-4">
          {/* Phone number display */}
          <div className="w-full max-w-xs mb-4">
            <Input
              value={phoneNumber}
              onChange={(e) => onPhoneNumberChange(e.target.value)}
              placeholder={isLiveMode ? '+1 (555) 123-4567' : '+971 55 123 4567'}
              className="h-12 text-center text-lg font-mono tracking-wider bg-white/[0.03] border-white/[0.08] rounded-xl"
              onKeyDown={(e) => { if (e.key === 'Enter') handleDial() }}
            />
          </div>

          {/* Dial pad — centered, larger buttons */}
          <div className="grid grid-cols-3 gap-2 w-full max-w-xs">
            {['1','2','3','4','5','6','7','8','9','+','0','#'].map(d => (
              <button
                key={d}
                onClick={() => onPhoneNumberChange(phoneNumber + d)}
                className="h-14 rounded-2xl text-base font-mono font-semibold transition-all hover:bg-white/[0.06] active:bg-white/[0.1] active:scale-95"
                style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                {d}
              </button>
            ))}
          </div>

          {/* Dial button */}
          <button
            onClick={handleDial}
            disabled={!phoneNumber.trim() || dialingLive}
            className="mt-5 w-full max-w-xs h-12 rounded-2xl flex items-center justify-center gap-2 text-sm font-semibold text-white transition-all hover:shadow-lg disabled:opacity-40 active:scale-[0.98]"
            style={{ background: isLiveMode ? 'linear-gradient(135deg, #059669, #047857)' : 'linear-gradient(135deg, #216BE4, #1a5bc7)', boxShadow: isLiveMode ? '0 4px 20px rgba(5,150,105,0.25)' : '0 4px 20px rgba(33,107,228,0.25)' }}
          >
            {dialingLive ? (
              <FiRefreshCw className="w-4 h-4 animate-spin" />
            ) : isLiveMode ? (
              <><FiPhone className="w-4 h-4" /> Dial Number</>
            ) : (
              <><FiPlay className="w-4 h-4" /> Start Demo Call</>
            )}
          </button>

          {/* Error */}
          {liveCallError && (
            <div className="mt-3 w-full max-w-xs rounded-xl p-3 flex items-start gap-2.5" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}>
              <FiAlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-[11px] text-red-400 leading-relaxed">{liveCallError}</p>
            </div>
          )}
        </div>

        {/* Mode bar — bottom */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-white/[0.06] flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className={`w-[6px] h-[6px] rounded-full ${isLiveMode ? 'bg-emerald-400' : 'bg-[#216BE4]'}`} />
            <span className="text-[11px] text-white/25 font-medium">{isLiveMode ? 'Live Mode (Twilio + Deepgram)' : 'Demo Simulation Mode'}</span>
          </div>
          <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1 px-2 text-white/20 hover:text-white/40" onClick={onNavigateToConfig}>
            <FiSettings className="w-3 h-3" /> Configure
          </Button>
        </div>
      </div>
    )
  }

  // --- Active Call State: 4-Panel Real-time Dashboard ---
  return (
    <div className="flex gap-3" style={{ height: 'calc(100vh - 120px)' }}>
      {/* Main dashboard area */}
      <div className={'flex flex-col gap-3 min-w-0 transition-all duration-300 ' + (chatOpen ? 'flex-1' : 'flex-1')}>
      {/* Call Control Bar */}
      <Card className="border border-border flex-shrink-0 shadow-sm">
        <div className="px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {!isLiveMode && (
              <Badge variant="outline" className="text-[11px] h-6 px-2.5 border-amber-400 bg-amber-50 text-amber-700 gap-1.5 font-semibold">
                <FiInfo className="w-3.5 h-3.5" /> SIMULATION
              </Badge>
            )}
            <div className="flex items-center gap-2">
              <span className={'w-2.5 h-2.5 rounded-full animate-pulse ' + (isLiveMode ? 'bg-green-500' : 'bg-amber-500')} />
              <span className="text-sm font-medium">{isLiveMode ? callStatus : 'Simulated Call'}</span>
            </div>
            <Separator orientation="vertical" className="h-6" />
            <span className="text-sm text-muted-foreground font-mono">{phoneNumber}</span>
            <Separator orientation="vertical" className="h-6" />
            <span className="text-base font-mono font-bold text-primary tabular-nums">{formatDuration(callDuration)}</span>
          </div>
          <div className="flex items-center gap-2.5">
            {/* Auto-processing indicators */}
            {autoResearchCount > 0 && (
              <Badge variant="secondary" className="text-[11px] h-6 px-2 gap-1.5">
                <FiSearch className="w-3.5 h-3.5" /> Research: {autoResearchCount}
              </Badge>
            )}
            {autoStrategyCount > 0 && (
              <Badge variant="secondary" className="text-[11px] h-6 px-2 gap-1.5">
                <FiZap className="w-3.5 h-3.5" /> Strategy: {autoStrategyCount}
              </Badge>
            )}
            {(autoResearchCount > 0 || autoStrategyCount > 0) && <Separator orientation="vertical" className="h-6" />}
            {isLiveMode && (
              <Button
                variant={muted ? 'destructive' : 'outline'}
                size="sm"
                className="h-8 text-xs gap-1.5 px-3"
                onClick={() => setMuted(!muted)}
              >
                {muted ? <FiMicOff className="w-3.5 h-3.5" /> : <FiMic className="w-3.5 h-3.5" />}
                {muted ? 'Muted' : 'Mic On'}
              </Button>
            )}
            <Button variant="destructive" size="sm" onClick={isLiveMode ? handleLiveEndCall : onEndCall} className="h-8 text-xs gap-2 px-3 font-medium">
              <FiPhoneOff className="w-3.5 h-3.5" /> {isLiveMode ? 'End Call' : 'End Simulation'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Live Call Error / Status */}
      {isLiveMode && liveCallError && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2 flex items-center gap-2.5 flex-shrink-0">
          <FiAlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <p className="text-xs text-red-700 font-medium">{liveCallError}</p>
        </div>
      )}
      {isLiveMode && callActive && (
        <div className="flex items-center gap-4 px-2 flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className={'w-2 h-2 rounded-full ' + (deepgramConnected ? 'bg-green-500 animate-pulse' : 'bg-red-400')} />
            <span className="text-[11px] text-muted-foreground font-medium">
              {deepgramConnected ? 'Deepgram: Transcribing' : 'Deepgram: Disconnected'}
            </span>
          </div>
          {liveCallSid && (
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[11px] text-muted-foreground font-mono">Call: {liveCallSid.substring(0, 12)}...</span>
            </div>
          )}
        </div>
      )}

      {/* Detected Entities Bar */}
      {(detectedEntities.companies.length > 0 || detectedEntities.people.length > 0) && (
        <div className="flex items-center gap-2.5 px-2 flex-shrink-0">
          <FiActivity className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
          <span className="text-[11px] text-muted-foreground font-medium">Detected:</span>
          {detectedEntities.companies.map(function(c, i) {
            return <Badge key={'c-' + i} variant="default" className="text-[11px] h-5">{c}</Badge>
          })}
          {detectedEntities.people.map(function(p, i) {
            return <Badge key={'p-' + i} variant="secondary" className="text-[11px] h-5">{p}</Badge>
          })}
          {researchLoading && (
            <span className="text-[11px] text-green-600 flex items-center gap-1.5 font-medium">
              <FiRefreshCw className="w-3 h-3 animate-spin" /> Researching...
            </span>
          )}
        </div>
      )}

      {/* Main 3-Panel Grid */}
      <div className="grid grid-cols-12 gap-3 flex-1 min-h-0">
        {/* Left: Live Transcript */}
        <div className="col-span-5 flex flex-col min-h-0">
          <Card className="flex-1 flex flex-col border border-border overflow-hidden shadow-sm">
            <CardHeader className="py-2.5 px-4 flex flex-row items-center justify-between space-y-0 flex-shrink-0">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <span className={'w-2 h-2 rounded-full animate-pulse ' + (isLiveMode ? 'bg-green-500' : 'bg-amber-500')} />
                {isLiveMode ? 'Live Transcript' : 'Simulated Transcript'}
              </CardTitle>
              <Badge variant="outline" className="text-[11px] h-5 font-mono">{safeTranscript.length} lines</Badge>
            </CardHeader>
            <Separator />
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2.5">
              {safeTranscript.length === 0 && (
                <div className="flex flex-col items-center justify-center py-10">
                  <FiMic className="w-8 h-8 text-muted-foreground/20 mb-3" />
                  <p className="text-xs text-muted-foreground text-center font-medium">
                    {isLiveMode ? 'Waiting for conversation to begin...' : 'Loading simulated conversation...'}
                  </p>
                  <p className="text-[11px] text-muted-foreground/70 text-center mt-1">
                    {isLiveMode ? 'Audio is being streamed and transcribed automatically' : 'A pre-recorded demo conversation will stream shortly'}
                  </p>
                </div>
              )}
              {safeTranscript.map((line) => (
                <div key={line?.id ?? Math.random()} className={'flex gap-2.5 ' + (line?.speaker === 'rep' ? '' : 'flex-row-reverse')}>
                  <div className={'w-7 h-7 rounded-full flex items-center justify-center text-xs flex-shrink-0 ' + (line?.speaker === 'rep' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground')}>
                    {line?.speaker === 'rep' ? <FiUser className="w-3.5 h-3.5" /> : <FiUsers className="w-3.5 h-3.5" />}
                  </div>
                  <div className={'max-w-[80%] px-3 py-2 rounded-lg text-xs leading-relaxed ' + (line?.speaker === 'rep' ? 'bg-primary/5 border border-primary/10' : 'bg-secondary border border-border')}>
                    <span className="text-[10px] font-semibold text-muted-foreground block mb-0.5">
                      {line?.speaker === 'rep' ? 'Sales Rep' : 'Prospect'} - {safeText(line?.timestamp, '')}
                    </span>
                    {safeText(line?.text, '')}
                  </div>
                </div>
              ))}
              {callActive && safeTranscript.length > 0 && (
                <div className="flex items-center gap-2 py-1">
                  <span className={'w-2 h-2 rounded-full animate-pulse ' + (isLiveMode ? 'bg-green-500' : 'bg-amber-500')} />
                  <span className="text-[11px] text-muted-foreground">
                    {isLiveMode ? 'Listening...' : 'Streaming demo transcript...'}
                  </span>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Center: Prospect Intelligence */}
        <div className="col-span-3 flex flex-col min-h-0">
          <Card className="flex-1 flex flex-col border border-border overflow-hidden shadow-sm">
            <CardHeader className="py-2.5 px-4 flex flex-row items-center justify-between space-y-0 flex-shrink-0">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <FiSearch className="w-3.5 h-3.5 text-primary" /> Research
              </CardTitle>
              {researchLoading && <FiRefreshCw className="w-3.5 h-3.5 animate-spin text-primary" />}
            </CardHeader>
            <Separator />
            <div className="flex-1 overflow-y-auto px-3 pb-3">
              {researchError ? (
                <p className="text-xs text-destructive flex items-center gap-1.5 py-2"><FiAlertCircle className="w-3.5 h-3.5" /> {researchError}</p>
              ) : null}
              {researchLoading && !displayResearch ? <LoadingPlaceholder count={3} /> : null}
              {displayResearch ? (
                <div className="space-y-2 pt-2">
                  <div className="border border-border rounded-lg p-2.5">
                    <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Company Profile</h4>
                    <p className="text-xs font-semibold">{safeText(displayResearch?.company_profile?.name)}</p>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {displayResearch?.company_profile?.industry ? <Badge variant="secondary" className="text-[10px] h-5">{safeText(displayResearch.company_profile.industry)}</Badge> : null}
                      {displayResearch?.company_profile?.size ? <Badge variant="outline" className="text-[10px] h-5">{safeText(displayResearch.company_profile.size)}</Badge> : null}
                    </div>
                    {displayResearch?.company_profile?.headquarters ? <p className="text-[11px] text-muted-foreground mt-1.5">{safeText(displayResearch.company_profile.headquarters)}</p> : null}
                    {displayResearch?.company_profile?.description ? <p className="text-[11px] text-muted-foreground mt-1">{safeText(displayResearch.company_profile.description)}</p> : null}
                    {displayResearch?.company_profile?.key_products ? <p className="text-[11px] mt-1"><span className="font-semibold">Products:</span> {safeText(displayResearch.company_profile.key_products)}</p> : null}
                  </div>
                  <div className="border border-border rounded-lg p-2.5">
                    <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Funding</h4>
                    {displayResearch?.funding?.total_raised ? <Badge variant="default" className="text-[10px] h-5 mb-1">{safeText(displayResearch.funding.total_raised)}</Badge> : null}
                    {displayResearch?.funding?.latest_round ? <p className="text-[11px]">{safeText(displayResearch.funding.latest_round)}</p> : null}
                    {displayResearch?.funding?.key_investors ? <p className="text-[11px] text-muted-foreground">{safeText(displayResearch.funding.key_investors)}</p> : null}
                    {displayResearch?.funding?.financial_health ? <p className="text-[11px] text-green-600 font-semibold mt-0.5">{safeText(displayResearch.funding.financial_health)}</p> : null}
                  </div>
                  <div className="border border-border rounded-lg p-2.5">
                    <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Tech Stack</h4>
                    {displayResearch?.tech_stack?.technologies ? <p className="text-[11px]"><span className="font-semibold">Tech:</span> {safeText(displayResearch.tech_stack.technologies)}</p> : null}
                    {displayResearch?.tech_stack?.infrastructure ? <p className="text-[11px]"><span className="font-semibold">Infra:</span> {safeText(displayResearch.tech_stack.infrastructure)}</p> : null}
                    {displayResearch?.tech_stack?.tools ? <p className="text-[11px]"><span className="font-semibold">Tools:</span> {safeText(displayResearch.tech_stack.tools)}</p> : null}
                  </div>
                  {displayResearch?.recent_news ? (
                    <div className="border border-border rounded-lg p-2.5">
                      <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Recent News</h4>
                      {renderLines(displayResearch.recent_news)}
                    </div>
                  ) : null}
                  {displayResearch?.pitch_angles ? (
                    <div className="border border-border rounded-lg p-2.5">
                      <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Pitch Angles</h4>
                      {renderLines(displayResearch.pitch_angles)}
                    </div>
                  ) : null}
                  {displayResearch?.pain_points ? (
                    <div className="border border-border rounded-lg p-2.5">
                      <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Pain Points</h4>
                      {renderLines(displayResearch.pain_points)}
                    </div>
                  ) : null}
                </div>
              ) : null}
              {!researchLoading && !displayResearch && !researchError ? (
                <div className="flex flex-col items-center justify-center py-10">
                  <FiSearch className="w-8 h-8 text-muted-foreground/20 mb-3" />
                  <p className="text-xs text-muted-foreground text-center font-medium">Waiting for entity detection...</p>
                  <p className="text-[11px] text-muted-foreground/70 text-center mt-1">Research triggers automatically when names are detected in the conversation</p>
                </div>
              ) : null}
            </div>
          </Card>
        </div>

        {/* Right: AI Whisper Panel */}
        <div className="col-span-4 flex flex-col min-h-0">
          <Card className="flex-1 flex flex-col border border-border overflow-hidden shadow-sm">
            <CardHeader className="py-2.5 px-4 flex flex-row items-center justify-between space-y-0 flex-shrink-0">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <FiZap className="w-4 h-4 text-primary" /> AI Whisper Panel
              </CardTitle>
              <div className="flex items-center gap-2">
                {strategyLoading && <FiRefreshCw className="w-3.5 h-3.5 animate-spin text-primary" />}
                <Badge variant="outline" className="text-[11px] h-5">Auto</Badge>
              </div>
            </CardHeader>
            <Separator />
            <div className="flex-1 overflow-y-auto px-3 pb-3">
              {strategyError ? (
                <p className="text-xs text-destructive flex items-center gap-1.5 py-2"><FiAlertCircle className="w-3.5 h-3.5" /> {strategyError}</p>
              ) : null}
              {strategyLoading && !displayStrategy ? <LoadingPlaceholder count={4} /> : null}
              {displayStrategy ? (
                <div className="space-y-2.5 pt-2">
                  <div className="border border-border rounded-lg p-3 text-center">
                    <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Closing Probability</h4>
                    <p className="text-3xl font-bold text-primary font-mono">{safeText(displayStrategy?.closing_probability)}</p>
                    {displayStrategy?.engagement_level ? <p className="text-[11px] text-green-600 font-semibold mt-1">{safeText(displayStrategy.engagement_level)}</p> : null}
                  </div>
                  {displayStrategy?.deal_signals ? (
                    <div className="border border-border rounded-lg p-2.5">
                      <div className="flex items-center justify-between mb-1.5">
                        <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Deal Signals</h4>
                        <CopyBtn text={safeText(displayStrategy.deal_signals, '')} id="signals" copiedId={copiedId} onCopy={handleCopy} />
                      </div>
                      {renderLines(displayStrategy.deal_signals)}
                    </div>
                  ) : null}
                  {displayStrategy?.next_questions ? (
                    <div className="border border-green-200 bg-green-50/50 rounded-lg p-2.5">
                      <div className="flex items-center justify-between mb-1.5">
                        <h4 className="text-[10px] font-semibold text-green-700 uppercase tracking-wider flex items-center gap-1.5">
                          <FiZap className="w-3 h-3" /> Ask Next
                        </h4>
                        <CopyBtn text={safeText(displayStrategy.next_questions, '')} id="questions" copiedId={copiedId} onCopy={handleCopy} />
                      </div>
                      {renderLines(displayStrategy.next_questions)}
                    </div>
                  ) : null}
                  {displayStrategy?.objection_handlers ? (
                    <div className="border border-border rounded-lg p-2.5">
                      <div className="flex items-center justify-between mb-1.5">
                        <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Objection Handlers</h4>
                        <CopyBtn text={safeText(displayStrategy.objection_handlers, '')} id="objections" copiedId={copiedId} onCopy={handleCopy} />
                      </div>
                      {renderLines(displayStrategy.objection_handlers)}
                    </div>
                  ) : null}
                  {displayStrategy?.pitch_angles ? (
                    <div className="border border-border rounded-lg p-2.5">
                      <div className="flex items-center justify-between mb-1.5">
                        <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Pitch Angles</h4>
                        <CopyBtn text={safeText(displayStrategy.pitch_angles, '')} id="pitch" copiedId={copiedId} onCopy={handleCopy} />
                      </div>
                      {renderLines(displayStrategy.pitch_angles)}
                    </div>
                  ) : null}
                </div>
              ) : null}
              {!strategyLoading && !displayStrategy && !strategyError ? (
                <div className="flex flex-col items-center justify-center py-10">
                  <FiZap className="w-8 h-8 text-muted-foreground/20 mb-3" />
                  <p className="text-xs text-muted-foreground text-center font-medium">AI coaching activates automatically</p>
                  <p className="text-[11px] text-muted-foreground/70 text-center mt-1">Strategy suggestions will appear once enough conversation context is captured</p>
                </div>
              ) : null}
            </div>
          </Card>
        </div>
      </div>
      </div>{/* end main dashboard area */}

      {/* AI Chat Toggle Button (when closed) */}
      {!chatOpen && (
        <button
          onClick={function() { setChatOpen(true) }}
          className="flex-shrink-0 w-10 h-full bg-card border border-border rounded-lg flex flex-col items-center justify-center gap-2 hover:bg-muted transition-colors cursor-pointer"
          title="Chat with AI"
        >
          <FiZap className="w-4 h-4 text-primary" />
          <span className="text-[9px] text-muted-foreground font-semibold [writing-mode:vertical-rl] rotate-180">AI Chat</span>
        </button>
      )}

      {/* AI Chat Panel (when open) */}
      {chatOpen && (
        <div className="flex-shrink-0 w-80 flex flex-col border border-border rounded-lg bg-card overflow-hidden">
          {/* Chat Header */}
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-border flex-shrink-0">
            <div className="flex items-center gap-2">
              <FiZap className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold">AI Assistant</span>
            </div>
            <button onClick={function() { setChatOpen(false) }} className="text-muted-foreground hover:text-foreground p-1 rounded hover:bg-muted transition-colors">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          {/* Chat Messages */}
          <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-3 space-y-3">
            {chatMessages.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 px-2">
                <FiZap className="w-8 h-8 text-muted-foreground/20 mb-3" />
                <p className="text-xs text-muted-foreground text-center font-medium">Ask me anything during the call</p>
                <p className="text-[11px] text-muted-foreground/60 text-center mt-1.5 leading-relaxed">
                  I have full context of the live transcript. Ask for advice, objection handling, or quick research.
                </p>
                <div className="flex flex-wrap gap-1.5 mt-3 justify-center">
                  {['What should I ask next?', 'How to handle pricing objection?', 'Summarize the call so far'].map(function(q) {
                    return (
                      <button
                        key={q}
                        onClick={function() { setChatInput(q) }}
                        className="text-[10px] px-2 py-1 rounded-full border border-border text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                      >
                        {q}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
            {chatMessages.map(function(msg) {
              return (
                <div key={msg.id} className={'flex ' + (msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                  <div className={'max-w-[90%] px-3 py-2 rounded-lg text-xs leading-relaxed ' + (
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-br-sm'
                      : 'bg-muted text-foreground rounded-bl-sm'
                  )}>
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                  </div>
                </div>
              )
            })}
            {chatLoading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg px-3 py-2 rounded-bl-sm">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse [animation-delay:0.4s]" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Chat Input */}
          <div className="border-t border-border p-2 flex-shrink-0">
            <div className="flex gap-2">
              <Input
                value={chatInput}
                onChange={function(e) { setChatInput(e.target.value) }}
                onKeyDown={function(e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleChatSend() } }}
                placeholder="Ask the AI..."
                className="flex-1 h-9 text-xs bg-muted/50 border-border"
                disabled={chatLoading}
              />
              <Button
                onClick={handleChatSend}
                disabled={!chatInput.trim() || chatLoading}
                size="sm"
                className="h-9 w-9 p-0 flex-shrink-0"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
