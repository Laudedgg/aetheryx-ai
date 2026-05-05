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
import { FiPhone, FiPhoneOff, FiCopy, FiCheck, FiAlertCircle, FiRefreshCw, FiUser, FiUsers, FiMic, FiMicOff, FiSettings, FiRadio, FiZap, FiSearch, FiActivity, FiInfo, FiPlay, FiDelete } from 'react-icons/fi'

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
  callHistory?: any[]
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
    // Single-name introductions: "My name is Victor", "I'm Sarah", "This is John"
    const singleNamePatterns = text.match(/(?:my name is|name is|name's|I'm|I am|this is|speaking with|it's)\s+([A-Z][a-z]{2,15})(?![A-Za-z])/gi)
    if (Array.isArray(singleNamePatterns)) {
      singleNamePatterns.forEach(function(m) {
        const parts = m.split(/\s+/)
        const name = parts[parts.length - 1]
        if (name && /^[A-Z][a-z]{2,15}$/.test(name) && !skipWords.has(name)
          && !people.includes(name)
          && !people.some(p => p.split(' ')[0] === name)) {
          people.push(name)
        }
      })
    }
  } catch (_e) { /* ignore */ }
  return { companies, people }
}

// ── ProspectCard ─────────────────────────────────────────────────────────────
// Slick profile-style card with avatar (photo or initials fallback),
// platform-coloured social icons, gradient cover, and entrance animation.

// Filter out placeholder strings the LLM uses when it didn't find real info.
function isRealValue(v: any): boolean {
  if (v === null || v === undefined) return false
  const s = String(v).toLowerCase().trim()
  if (!s) return false
  const placeholders = ['not publicly available', 'not yet identified', 'not provided', 'not specified', 'unknown', 'n/a', 'na', '-', 'null', 'undefined', 'not yet', 'no information']
  return !placeholders.some(p => s === p || s.includes(p))
}

// "Still searching" card shown while research is loading and a section has no real data yet.
// Replaces the empty placeholder card with active-feel UI.
function LiveSearchingCard({ label, hint, accent }: { label: string; hint: string; accent: 'blue' | 'amber' | 'emerald' }) {
  const colors = {
    blue: { dot: '#8A6CFF', text: 'rgba(138,108,255,0.6)' },
    amber: { dot: '#f59e0b', text: 'rgba(245,158,11,0.6)' },
    emerald: { dot: '#34d399', text: 'rgba(52,211,153,0.6)' },
  }[accent]
  return (
    <div className="rounded-xl p-2.5 relative overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-[9px] uppercase font-bold tracking-wider" style={{ color: 'rgba(255,255,255,0.3)' }}>{label}</p>
        <span className="flex items-center gap-1">
          <span className="w-1 h-1 rounded-full animate-pulse" style={{ background: colors.dot, animationDelay: '0ms' }} />
          <span className="w-1 h-1 rounded-full animate-pulse" style={{ background: colors.dot, animationDelay: '180ms' }} />
          <span className="w-1 h-1 rounded-full animate-pulse" style={{ background: colors.dot, animationDelay: '360ms' }} />
        </span>
      </div>
      <p className="text-[10px] leading-relaxed italic" style={{ color: colors.text }}>
        <FiSearch className="inline w-2.5 h-2.5 mr-1 -mt-0.5" />
        {hint}
      </p>
    </div>
  )
}

function getInitials(name: string): string {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function isUsableUrl(u: any): boolean {
  return typeof u === 'string' && /^https?:\/\//.test(u)
}

function confidenceColors(confidence: string): { bg: string; color: string; border: string; label: string } {
  const c = (confidence || '').toLowerCase()
  if (c.startsWith('high')) return { bg: 'rgba(52,211,153,0.12)', color: '#34d399', border: 'rgba(52,211,153,0.3)', label: 'High' }
  if (c.startsWith('medium')) return { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b', border: 'rgba(245,158,11,0.3)', label: 'Medium' }
  if (c.startsWith('low')) return { bg: 'rgba(239,68,68,0.10)', color: '#f87171', border: 'rgba(239,68,68,0.25)', label: 'Low' }
  return { bg: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.4)', border: 'rgba(255,255,255,0.08)', label: confidence ? confidence.split(' ')[0] : '—' }
}

const SocialIcon = ({ name }: { name: 'linkedin' | 'twitter' | 'instagram' | 'github' | 'website' }) => {
  const common = { width: 14, height: 14, viewBox: '0 0 24 24', fill: 'currentColor' as const, 'aria-hidden': true }
  switch (name) {
    case 'linkedin':
      return <svg {...common}><path d="M19 0H5a5 5 0 00-5 5v14a5 5 0 005 5h14a5 5 0 005-5V5a5 5 0 00-5-5zM8 19H5V8h3v11zM6.5 6.7a1.8 1.8 0 110-3.5 1.8 1.8 0 010 3.5zM20 19h-3v-5.6c0-3.4-4-3.1-4 0V19h-3V8h3v1.8c1.4-2.6 7-2.8 7 2.5V19z"/></svg>
    case 'twitter':
      return <svg {...common}><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
    case 'instagram':
      return <svg {...common}><path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.05.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.05.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.7 3.7 0 01-1.38-.9 3.7 3.7 0 01-.9-1.38c-.16-.42-.36-1.05-.41-2.23C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.05-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16zm0 5.34a4.5 4.5 0 100 9 4.5 4.5 0 000-9zm0 7.42a2.92 2.92 0 110-5.84 2.92 2.92 0 010 5.84zm5.74-7.6a1.05 1.05 0 11-2.1 0 1.05 1.05 0 012.1 0z"/></svg>
    case 'github':
      return <svg {...common}><path d="M12 .5C5.37.5 0 5.87 0 12.5c0 5.3 3.44 9.8 8.21 11.39.6.11.82-.26.82-.58v-2.04c-3.34.73-4.04-1.42-4.04-1.42-.55-1.39-1.34-1.76-1.34-1.76-1.09-.74.08-.73.08-.73 1.21.09 1.84 1.24 1.84 1.24 1.07 1.84 2.81 1.31 3.5 1 .11-.78.42-1.31.76-1.61-2.66-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.13-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.31 1.23a11.5 11.5 0 016.02 0c2.3-1.55 3.31-1.23 3.31-1.23.66 1.66.25 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.61-2.81 5.62-5.49 5.92.43.37.81 1.1.81 2.22v3.29c0 .32.22.7.83.58A12.01 12.01 0 0024 12.5C24 5.87 18.63.5 12 .5z"/></svg>
    case 'website':
      return <svg {...common}><path d="M12 2a10 10 0 100 20 10 10 0 000-20zm6.93 6h-2.95a15.7 15.7 0 00-1.38-3.56A8.03 8.03 0 0118.93 8zM12 4c.83 1.2 1.48 2.53 1.91 4h-3.82A14 14 0 0112 4zM4.26 14C4.1 13.36 4 12.69 4 12s.1-1.36.26-2h3.38a16.5 16.5 0 000 4H4.26zm.81 2h2.95a15.7 15.7 0 001.38 3.56A8.03 8.03 0 015.07 16zM8.02 8H5.07a8.03 8.03 0 014.33-3.56A15.7 15.7 0 008.02 8zM12 20c-.83-1.2-1.48-2.53-1.91-4h3.82A14 14 0 0112 20zm2.34-6H9.66a14.5 14.5 0 010-4h4.68a14.5 14.5 0 010 4zm.27 5.56A15.7 15.7 0 0015.98 16h2.95a8.03 8.03 0 01-4.32 3.56zM16.36 14a16.5 16.5 0 000-4h3.38c.16.64.26 1.31.26 2s-.1 1.36-.26 2h-3.38z"/></svg>
  }
}

const SOCIAL_THEMES: Record<string, { bg: string; hoverBg: string; color: string }> = {
  linkedin: { bg: 'rgba(10,102,194,0.12)', hoverBg: 'rgba(10,102,194,0.22)', color: '#4ea3ff' },
  twitter: { bg: 'rgba(255,255,255,0.06)', hoverBg: 'rgba(255,255,255,0.14)', color: '#ffffff' },
  instagram: { bg: 'rgba(225,48,108,0.12)', hoverBg: 'rgba(225,48,108,0.22)', color: '#e4407a' },
  github: { bg: 'rgba(255,255,255,0.04)', hoverBg: 'rgba(255,255,255,0.12)', color: '#e6edf3' },
  website: { bg: 'rgba(244,114,182,0.10)', hoverBg: 'rgba(244,114,182,0.20)', color: '#FF9CC2' },
}

function ProspectCard({ person }: { person: any }) {
  const [imgFailed, setImgFailed] = useState(false)
  const fullName = safeText(person?.full_name, '')
  const initials = getInitials(fullName)
  const photoUrl = safeText(person?.photo_url, '')
  const showPhoto = isUsableUrl(photoUrl) && !imgFailed
  const conf = confidenceColors(safeText(person?.confidence, ''))
  const fullConfidence = safeText(person?.confidence, '')

  const socials = [
    { key: 'linkedin' as const, url: person?.linkedin_url, label: 'LinkedIn' },
    { key: 'twitter' as const, url: person?.twitter_url, label: 'X' },
    { key: 'instagram' as const, url: person?.instagram_url, label: 'Instagram' },
    { key: 'github' as const, url: person?.github_url, label: 'GitHub' },
    { key: 'website' as const, url: person?.personal_website, label: 'Website' },
  ].filter(s => isUsableUrl(s.url))

  return (
    <div
      className="rounded-xl overflow-hidden animate-fade-rise relative"
      style={{ background: 'linear-gradient(180deg, rgba(244,114,182,0.06) 0%, rgba(244,114,182,0.02) 100%)', border: '1px solid rgba(244,114,182,0.15)' }}
    >
      {/* Cover gradient strip */}
      <div className="h-9 relative" style={{ background: 'linear-gradient(135deg, #FF9CC2 0%, #a855f7 50%, #6366f1 100%)' }}>
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 80% 100% at 30% 100%, rgba(0,0,0,0.4), transparent 70%)' }} />
        <div className="absolute top-1.5 left-2.5 flex items-center gap-1.5">
          <span className="text-[8px] font-bold uppercase tracking-[0.2em] text-white/90 drop-shadow">Prospect</span>
          <span className="w-1 h-1 rounded-full bg-white/60 animate-pulse" />
        </div>
        {fullConfidence && (
          <div className="absolute top-1.5 right-2 px-1.5 py-0.5 rounded-full text-[8px] font-bold flex items-center gap-1" style={{ background: conf.bg, color: conf.color, border: `1px solid ${conf.border}`, backdropFilter: 'blur(6px)' }} title={fullConfidence}>
            <span className="w-1 h-1 rounded-full" style={{ background: conf.color }} />
            {conf.label}
          </div>
        )}
      </div>

      {/* Avatar overlapping cover */}
      <div className="px-3 pb-3 -mt-5">
        <div className="flex items-end gap-2.5">
          <div className="w-[52px] h-[52px] rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0 ring-2 ring-[#0A0C14] shadow-lg" style={{ background: 'linear-gradient(135deg, #FF9CC2, #a855f7)' }}>
            {showPhoto ? (
              <img src={photoUrl} alt={fullName} referrerPolicy="no-referrer" onError={() => setImgFailed(true)} className="w-full h-full object-cover" />
            ) : (
              <span className="text-[18px] font-bold text-white tracking-tight">{initials}</span>
            )}
          </div>
          <div className="min-w-0 pb-0.5 flex-1">
            {fullName && <p className="text-[13px] font-bold text-white truncate" title={fullName}>{fullName}</p>}
            {person?.headline && <p className="text-[10px] text-white/55 leading-snug line-clamp-2" title={safeText(person.headline)}>{safeText(person.headline)}</p>}
          </div>
        </div>

        {(person?.current_role || person?.current_company || person?.location) && (
          <div className="mt-2.5 space-y-0.5">
            {(person?.current_role || person?.current_company) && (
              <div className="flex items-center gap-1 text-[10px] text-white/40">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" className="flex-shrink-0"><path d="M20 6h-4V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2H4a2 2 0 00-2 2v11a2 2 0 002 2h16a2 2 0 002-2V8a2 2 0 00-2-2zm-6 0h-4V4h4v2z"/></svg>
                <span className="truncate">
                  {safeText(person.current_role)}
                  {person?.current_role && person?.current_company && <span className="text-white/25"> · </span>}
                  {safeText(person.current_company)}
                </span>
              </div>
            )}
            {person?.location && (
              <div className="flex items-center gap-1 text-[10px] text-white/35">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" className="flex-shrink-0"><path d="M12 2a8 8 0 00-8 8c0 5.4 7 11.5 7.3 11.7a1 1 0 001.4 0C13 21.5 20 15.4 20 10a8 8 0 00-8-8zm0 11a3 3 0 110-6 3 3 0 010 6z"/></svg>
                <span className="truncate">{safeText(person.location)}</span>
              </div>
            )}
          </div>
        )}

        {/* Social icons row */}
        {socials.length > 0 && (
          <div className="flex items-center gap-1.5 mt-2.5 pt-2.5" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
            {socials.map(s => {
              const theme = SOCIAL_THEMES[s.key]
              return (
                <a
                  key={s.key}
                  href={safeText(s.url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={`Open ${s.label}`}
                  aria-label={s.label}
                  className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:scale-110 active:scale-95"
                  style={{ background: theme.bg, color: theme.color }}
                  onMouseEnter={e => (e.currentTarget.style.background = theme.hoverBg)}
                  onMouseLeave={e => (e.currentTarget.style.background = theme.bg)}
                >
                  <SocialIcon name={s.key} />
                </a>
              )
            })}
            <span className="ml-auto text-[8px] text-white/20 font-mono">{socials.length} {socials.length === 1 ? 'profile' : 'profiles'}</span>
          </div>
        )}

        {/* Other profiles found around the web (Crunchbase, Companies House, SoundCloud, podcasts, ...) */}
        {Array.isArray(person?.other_profiles) && person.other_profiles.filter((p: any) => isUsableUrl(p?.url)).length > 0 && (
          <div className="mt-2.5 pt-2.5" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
            <p className="text-[8px] uppercase tracking-[0.18em] font-bold mb-1.5" style={{ color: 'rgba(255,255,255,0.3)' }}>Public footprint</p>
            <div className="flex flex-wrap gap-1">
              {person.other_profiles.filter((p: any) => isUsableUrl(p?.url)).slice(0, 8).map((p: any, i: number) => (
                <a
                  key={i}
                  href={safeText(p.url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={safeText(p.url)}
                  className="text-[9px] px-1.5 py-0.5 rounded-full transition-colors hover:bg-white/[0.08]"
                  style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.55)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  {safeText(p.label, 'Link')} ↗
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
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
  twilioSid, twilioAuth, fromNumber, deepgramKey, repPhone, onNavigateToConfig, callHistory
}: LiveCallDashboardProps) {
  const [researchLoading, setResearchLoading] = useState(false)
  const [strategyLoading, setStrategyLoading] = useState(false)
  const [researchError, setResearchError] = useState('')
  const [strategyError, setStrategyError] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [muted, setMuted] = useState(false)
  const [detectedEntities, setDetectedEntities] = useState<{ companies: string[]; people: string[] }>({ companies: [], people: [] })
  // Track the (company, person) tuple last used to fire research, so we can re-fire when the
  // prospect updates their name/company mid-call ("My name is Victor" → "actually Aman Galani").
  const [lastResearchKey, setLastResearchKey] = useState('')
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
  const sseRef = useRef<EventSource | null>(null)

  // AI Chat state
  const [chatOpen, setChatOpen] = useState(false)
  const [chatMessages, setChatMessages] = useState<{ id: string; role: 'user' | 'ai'; text: string }[]>([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const chatScrollRef = useRef<HTMLDivElement>(null)

  const safeTranscript = Array.isArray(transcript) ? transcript : []
  const safeHistory = Array.isArray(callHistory) ? callHistory : []
  // Show current data, or fall back to last call's data
  // Only fall back to a previous call's data when NOT in an active call.
  // During an active call, show standby/loading until the new research/strategy completes —
  // otherwise users see stale data from a previous prospect on a fresh call.
  const lastCallResearch = !callActive && !researchData && safeHistory.length > 0 ? safeHistory.find(c => c.researchData)?.researchData : null
  const lastCallStrategy = !callActive && !strategyData && safeHistory.length > 0 ? safeHistory.find(c => c.strategyData)?.strategyData : null
  const displayResearch = useSampleData ? SAMPLE_RESEARCH : (researchData || lastCallResearch)
  const displayStrategy = useSampleData ? SAMPLE_STRATEGY : (strategyData || lastCallStrategy)
  const isShowingLastCall = !researchData && !!lastCallResearch
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

  // Entity detection from transcript — prioritise prospect's words
  // (rep introducing themselves shouldn't trigger research on the rep)
  useEffect(() => {
    if (safeTranscript.length === 0) return
    try {
      const prospectText = safeTranscript
        .filter(function(l) { return l?.speaker === 'prospect' })
        .map(function(l) { return safeText(l?.text, '') })
        .join(' ')
      const fullText = safeTranscript.map(function(l) { return safeText(l?.text, '') }).join(' ')
      // Prefer prospect-only entities; fall back to full transcript only if prospect text is empty
      const fromProspect = extractEntities(prospectText)
      const hasProspectEntities = fromProspect.companies.length > 0 || fromProspect.people.length > 0
      const entities = hasProspectEntities ? fromProspect : extractEntities(fullText)
      setDetectedEntities(entities)
    } catch (_e) { /* ignore */ }
  }, [safeTranscript.length])

  // Auto-trigger Research Agent when entities are detected OR after meaningful conversation.
  // Key insight: re-fire when the (company, person) tuple changes — so if the prospect first
  // says "Victor" and later corrects to "Aman Galani", the agent re-runs on the new name.
  useEffect(() => {
    if (!callActive || researchLoading) return
    if (safeTranscript.length < 1) return
    if (autoResearchCount >= 5) return // safety cap

    // Pick the BEST person name from detected entities:
    //   1. Prefer full names (multi-word) over single first names
    //   2. Among same specificity, prefer the most recently detected
    const people = detectedEntities.people || []
    const fullNames = people.filter(p => p.split(/\s+/).filter(Boolean).length >= 2)
    const bestPerson = fullNames.length > 0 ? fullNames[fullNames.length - 1] : (people[people.length - 1] || '')
    // For company, prefer the most recently detected (mid-call corrections also handled)
    const companies = detectedEntities.companies || []
    const bestCompany = companies[companies.length - 1] || ''

    const currentKey = bestCompany.toLowerCase().trim() + '|' + bestPerson.toLowerCase().trim()
    const hasEntities = !!(bestCompany || bestPerson)

    // Path A: Entities present AND key has changed since the last research run → fire
    if (hasEntities && currentKey !== lastResearchKey) {
      setLastResearchKey(currentKey)
      if (!researchTriggered) setResearchTriggered(true)
      handleAutoResearch(bestCompany, bestPerson)
      return
    }

    // Path B: No entities yet, but enough transcript content → fire transcript-based research
    if (!researchTriggered && safeTranscript.length >= 3) {
      const prospectText = safeTranscript
        .filter(l => l?.speaker === 'prospect')
        .map(l => safeText(l?.text, ''))
        .join(' ')
      const fullText = safeTranscript.map(l => safeText(l?.text, '')).join(' ')
      const prospectWordCount = prospectText.split(/\s+/).filter(Boolean).length
      const totalWordCount = fullText.split(/\s+/).filter(Boolean).length
      const hasSubstance = prospectWordCount >= 5 || totalWordCount >= 12

      if (hasSubstance) {
        setResearchTriggered(true)
        const rawText = safeTranscript.map(function(l) {
          return (l?.speaker === 'rep' ? 'Sales Rep' : 'Client') + ': ' + safeText(l?.text, '')
        }).join('\n')
        handleAutoResearchFromTranscript(rawText)
      }
      return
    }

    // Path C: Already researched but result looks weak → re-fire with full transcript
    if (researchTriggered && autoResearchCount < 4) {
      const cpName = safeText(researchData?.company_profile?.name, '').toLowerCase()
      const ppName = safeText(researchData?.person_profile?.full_name, '').toLowerCase()
      const looksUnidentified = !researchData
        || !cpName || cpName.includes('not yet') || cpName.includes('unknown') || cpName.includes('not provided') || cpName.includes('not publicly')
        || !ppName || ppName.includes('not yet') || ppName.includes('unknown') || ppName.includes('not publicly')
      if (looksUnidentified && safeTranscript.length >= 2) {
        const rawText = safeTranscript.map(function(l) {
          return (l?.speaker === 'rep' ? 'Sales Rep' : 'Client') + ': ' + safeText(l?.text, '')
        }).join('\n')
        handleAutoResearchFromTranscript(rawText)
      }
    }
  }, [detectedEntities, callActive, researchTriggered, researchLoading, researchData, safeTranscript.length, autoResearchCount, lastResearchKey])

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
      // Build a query that's actionable for Perplexity even when only a name is given.
      let query: string
      if (company && person) {
        query = 'Live sales call. Prospect: "' + person + '" at "' + company + '". Search LinkedIn, Instagram, X/Twitter, GitHub, and the open web for this person. Capture their social URLs. Then research the company in depth.'
      } else if (company) {
        query = 'Live sales call. Prospect company: "' + company + '". Research the company in depth — industry, size, funding, tech stack, recent news, and pain points.'
      } else {
        query = 'Live sales call. Only a prospect name has been said: "' + person + '". Search LinkedIn first, then Instagram, X/Twitter, GitHub, and personal sites. Capture every social URL you find. If multiple matches exist, pick the most likely B2B/SaaS one and note alternatives in person_profile.confidence. Then research their company. Always return concrete pitch_angles and pain_points.'
      }
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
      const query = 'You are listening to a live sales call transcript. Your job: extract person names and company names the CLIENT (not the rep) mentions, then research them across LinkedIn, Instagram, X/Twitter, GitHub, and the open web.\n\nRULES:\n1. The REP is the salesperson — ignore introductions like "this is Aman from Aetheryx".\n2. The CLIENT is the prospect — focus on their words.\n3. For any person name found: search LinkedIn first ("site:linkedin.com" + name), then Instagram, X/Twitter, GitHub, personal sites. Capture every social URL. Fill person_profile fully.\n4. For any company name found: research industry, size, funding, tech stack, news, pain points.\n5. If only a first name appears, search aggressively in B2B/SaaS context and pick the strongest match. Note confidence in person_profile.confidence.\n6. NEVER refuse with "not yet identified" — make best-effort guesses and state confidence.\n7. Speech-to-text may have errors — guess the most plausible real name if garbled.\n8. ALWAYS produce concrete pitch_angles and pain_points.\n\nTranscript:\n' + rawTranscript
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
      return (l?.speaker === 'rep' ? 'Sales Rep' : 'Client') + ': ' + safeText(l?.text, '')
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
            return (l?.speaker === 'rep' ? 'Sales Rep' : 'Client') + ': ' + safeText(l?.text, '')
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

  // --- Live Mode: Subscribe to media-bridge SSE for two-sided transcripts ---
  const startMediaBridgeSSE = useCallback((callSid: string) => {
    const bridgeHost = process.env.NEXT_PUBLIC_MEDIA_BRIDGE_HOST || 'aetheryx.ai'
    const url = `https://${bridgeHost}/bridge/events?callSid=${encodeURIComponent(callSid)}`
    console.log('[Aetheryx] Subscribing to media-bridge:', url)

    try {
      const es = new EventSource(url)
      sseRef.current = es
      setDeepgramConnected(true)

      es.onopen = () => console.log('[Aetheryx] ✅ Media-bridge SSE connected')
      es.onerror = (e) => {
        console.error('[Aetheryx] Media-bridge SSE error', e)
        setDeepgramConnected(false)
      }
      es.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          if (!data.text) return
          const speakerLabel: 'rep' | 'prospect' = data.speaker === 'rep' ? 'rep' : 'prospect'
          const ts = new Date(data.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
          onAddTranscript({
            id: 'bridge-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
            speaker: speakerLabel,
            text: data.text,
            timestamp: ts,
          })
          console.log('[Aetheryx] 📝 Transcript (', speakerLabel, '):', data.text.substring(0, 60))
        } catch (e) {
          console.error('[Aetheryx] SSE parse error', e)
        }
      }
    } catch (e) {
      console.error('[Aetheryx] Failed to subscribe to media-bridge', e)
    }
  }, [onAddTranscript])

  // --- Legacy: In-browser Deepgram (kept as fallback if bridge fails) ---
  const startDeepgramTranscription = useCallback(async () => {
    console.log('[Aetheryx] Starting Deepgram transcription. Key length:', deepgramKey?.length)
    if (!deepgramKey || deepgramKey === 'server-managed' || deepgramKey.length < 10) {
      console.error('[Aetheryx] Deepgram key not configured:', deepgramKey)
      setLiveCallError('Deepgram key not configured — reload the page to sync keys')
      return
    }
    try {
      console.log('[Aetheryx] Requesting microphone access...')
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { sampleRate: 16000, channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true }
      })
      console.log('[Aetheryx] Mic access granted. Tracks:', stream.getAudioTracks().length)
      mediaStreamRef.current = stream

      const dgUrl = 'wss://api.deepgram.com/v1/listen?model=nova-2&encoding=linear16&sample_rate=16000&channels=1&punctuate=true&interim_results=true&utterance_end_ms=1500&vad_events=true&smart_format=true&language=en&filler_words=false&numerals=true'
      console.log('[Aetheryx] Connecting to Deepgram WebSocket...')
      const ws = new WebSocket(dgUrl, ['token', deepgramKey])
      deepgramWsRef.current = ws

      ws.onopen = function() {
        console.log('[Aetheryx] ✅ Deepgram WebSocket OPEN')
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
      let lastTranscriptText = ''
      let lastTranscriptTime = 0

      ws.onmessage = function(event: MessageEvent) {
        try {
          const data = JSON.parse(event.data)
          if (data.type === 'Results' && data.channel) {
            const alt = data.channel?.alternatives?.[0]
            if (!alt) return
            const transcriptText = alt.transcript?.trim()
            if (!transcriptText) return

            const isFinal = data.is_final
            // This Deepgram connection is mic-only = always the Sales Rep
            const speakerLabel: 'rep' | 'prospect' = 'rep'
            const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })

            if (isFinal) {
              interimLineId = null

              // Aggressive deduplication: skip if same text within 8 seconds
              // OR if new text is substring of last text (Deepgram sometimes sends partial repeats)
              const now = Date.now()
              const lt = lastTranscriptText.toLowerCase().trim()
              const tt = transcriptText.toLowerCase().trim()
              const isDuplicate = (tt === lt) || (lt.length > 0 && (lt.includes(tt) || tt.includes(lt)))
              if (isDuplicate && (now - lastTranscriptTime) < 8000) {
                console.log('[Aetheryx] Skipped duplicate:', transcriptText.substring(0, 40))
                return
              }
              lastTranscriptText = transcriptText
              lastTranscriptTime = now

              const line: TranscriptLine = {
                id: 'live-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
                speaker: speakerLabel,
                text: transcriptText,
                timestamp: timestamp
              }
              console.log('[Aetheryx] 📝 Transcript added (', speakerLabel, '):', transcriptText.substring(0, 60))
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
    console.log('[Aetheryx] Starting remote transcription. Call object keys:', call ? Object.keys(call) : 'null')
    for (let attempt = 0; attempt < 15; attempt++) {
      try {
        // Method 1: Twilio SDK v2 getRemoteStream()
        if (typeof call?.getRemoteStream === 'function') {
          const rs = call.getRemoteStream()
          if (rs) {
            const tracks = rs.getAudioTracks()
            console.log(`[Aetheryx] Attempt ${attempt}: getRemoteStream() returned stream with ${tracks.length} tracks`)
            if (tracks.length > 0) {
              console.log('[Aetheryx] ✅ Got remote stream via getRemoteStream()')
              return startRemoteDgStream(rs)
            }
          } else {
            console.log(`[Aetheryx] Attempt ${attempt}: getRemoteStream() returned null`)
          }
        }

        // Method 2: Internal _remoteStream
        const rs2 = call?._mediaHandler?._remoteStream
        if (rs2 && rs2.getAudioTracks().length > 0) {
          console.log('[Aetheryx] ✅ Got remote stream via _mediaHandler._remoteStream')
          return startRemoteDgStream(rs2)
        }

        // Method 3: PeerConnection receivers
        const pc: RTCPeerConnection | undefined =
          call?._mediaHandler?.version?.pc ??
          call?._mediaHandler?.peerConnection ??
          call?._mediaHandler?._pc
        if (pc) {
          const receivers = pc.getReceivers()
          console.log(`[Aetheryx] Attempt ${attempt}: PC has ${receivers.length} receivers`)
          const ms = new MediaStream()
          receivers.forEach((r: RTCRtpReceiver) => {
            if (r.track?.kind === 'audio' && r.track.readyState === 'live') ms.addTrack(r.track)
          })
          if (ms.getAudioTracks().length > 0) {
            console.log('[Aetheryx] ✅ Got remote stream via PeerConnection receivers')
            return startRemoteDgStream(ms)
          }
        }

        // Method 4: Capture from <audio> elements Twilio creates
        if (attempt >= 2) {
          const audioEls = document.querySelectorAll('audio')
          console.log(`[Aetheryx] Attempt ${attempt}: Found ${audioEls.length} audio elements in DOM`)
          for (const audio of audioEls) {
            try {
              const srcObj = (audio as HTMLAudioElement).srcObject as MediaStream | null
              if (srcObj && srcObj.getAudioTracks().length > 0) {
                console.log('[Aetheryx] ✅ Got remote stream via audio.srcObject')
                return startRemoteDgStream(srcObj)
              }
              const cap = (audio as any).captureStream?.() || (audio as any).mozCaptureStream?.()
              if (cap && cap.getAudioTracks().length > 0) {
                console.log('[Aetheryx] ✅ Got remote stream via audio.captureStream()')
                return startRemoteDgStream(cap)
              }
            } catch (e) {
              console.log('[Aetheryx] audio element error:', e)
            }
          }
        }
      } catch (e) {
        console.log(`[Aetheryx] Attempt ${attempt} error:`, e)
      }

      await new Promise(r => setTimeout(r, 600 + attempt * 300))
    }
    console.error('[Aetheryx] ❌ Could not capture remote audio after 15 attempts')
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
        // Connect to the media-bridge SSE stream for two-sided transcripts.
        // The bridge receives Twilio Media Streams audio and forwards to Deepgram.
        const callSid = call.parameters?.CallSid
        if (callSid) {
          startMediaBridgeSSE(callSid)
        } else {
          console.warn('[Aetheryx] No CallSid available for SSE subscription')
        }
      })
      call.on('disconnect', () => {
        activeCallRef.current = null
        if (sseRef.current) { try { sseRef.current.close() } catch {} sseRef.current = null }
        onEndCall()
      })
      call.on('error', (err: any) => {
        setLiveCallError('Call error: ' + (err?.message || 'Unknown'))
        setDialingLive(false)
      })
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
    setLastResearchKey('')
  }

  // --- Pre-Call State: Dialer ---
  if (!callActive) {
    return (
      <div className="rounded-2xl border border-white/[0.06] flex flex-col flex-1" style={{ background: '#0A0C14' }}>

        {/* Center: Phone input + Dial Pad — fills space, centered */}
        <div className="flex-1 flex flex-col items-center justify-center px-5 py-3">
          {/* Title */}
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: isLiveMode ? 'rgba(52,211,153,0.1)' : 'rgba(138,108,255,0.1)' }}>
              {isLiveMode ? <FiPhone className="w-4 h-4 text-emerald-400" /> : <FiPlay className="w-4 h-4 text-[#8A6CFF]" />}
            </div>
            <div>
              <h3 className="text-[13px] font-semibold text-white/70" style={{ fontFamily: "'Instrument Serif', serif" }}>
                {isLiveMode ? 'Start a Sales Call' : 'Run Demo Simulation'}
              </h3>
              <p className="text-[10px] text-white/20">{isLiveMode ? 'Twilio + Deepgram' : 'Simulated with AI agents'}</p>
            </div>
          </div>

          {/* Phone number input */}
          <div className="w-full max-w-[240px] mb-3">
            <Input
              value={phoneNumber}
              onChange={(e) => onPhoneNumberChange(e.target.value)}
              placeholder={isLiveMode ? '+1 (555) 123-4567' : '+971 55 123 4567'}
              className="h-10 text-center text-sm font-mono tracking-wider bg-white/[0.03] border-white/[0.08] rounded-xl"
              onKeyDown={(e) => { if (e.key === 'Enter') handleDial() }}
            />
          </div>

          {/* Dial pad — compact */}
          <div className="grid grid-cols-3 gap-1.5 w-full max-w-[240px]">
            {['1','2','3','4','5','6','7','8','9','+','0','#'].map(d => (
              <button
                key={d}
                onClick={() => onPhoneNumberChange(phoneNumber + d)}
                className="h-10 rounded-xl text-sm font-mono font-semibold transition-all hover:bg-white/[0.06] active:bg-white/[0.1] active:scale-95"
                style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                {d}
              </button>
            ))}
          </div>

          {/* Delete / clear row */}
          <div className="flex items-center justify-between w-full max-w-[240px] mt-1.5 gap-1.5">
            <button
              onClick={() => onPhoneNumberChange(phoneNumber.slice(0, -1))}
              disabled={!phoneNumber}
              aria-label="Delete last digit"
              className="flex-1 h-9 rounded-xl flex items-center justify-center gap-1.5 text-[11px] font-medium text-white/60 transition-all hover:bg-white/[0.06] hover:text-white active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <FiDelete className="w-3.5 h-3.5" />
              Delete
            </button>
            <button
              onClick={() => onPhoneNumberChange('')}
              disabled={!phoneNumber}
              aria-label="Clear number"
              className="px-3 h-9 rounded-xl text-[11px] font-medium text-white/40 transition-all hover:bg-white/[0.06] hover:text-white/70 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              Clear
            </button>
          </div>

          {/* Dial button */}
          <button
            onClick={handleDial}
            disabled={!phoneNumber.trim() || dialingLive}
            className="mt-3 w-full max-w-[240px] h-10 rounded-xl flex items-center justify-center gap-2 text-[13px] font-semibold text-white transition-all hover:shadow-lg disabled:opacity-40 active:scale-[0.98]"
            style={{ background: isLiveMode ? 'linear-gradient(135deg, #059669, #047857)' : 'linear-gradient(135deg, #8A6CFF, #5B6CFF)', boxShadow: isLiveMode ? '0 4px 16px rgba(5,150,105,0.2)' : '0 4px 16px rgba(138,108,255,0.2)' }}
          >
            {dialingLive ? <FiRefreshCw className="w-4 h-4 animate-spin" /> : isLiveMode ? <><FiPhone className="w-3.5 h-3.5" /> Dial Number</> : <><FiPlay className="w-3.5 h-3.5" /> Start Demo Call</>}
          </button>

          {/* Error */}
          {liveCallError && (
            <div className="mt-2 w-full max-w-[240px] rounded-xl p-2.5 flex items-start gap-2" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}>
              <FiAlertCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-[10px] text-red-400 leading-relaxed">{liveCallError}</p>
            </div>
          )}
        </div>

        {/* Mode bar — bottom */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-white/[0.06] flex-shrink-0">
          <div className="flex items-center gap-1.5">
            <span className={`w-[5px] h-[5px] rounded-full ${isLiveMode ? 'bg-emerald-400' : 'bg-[#8A6CFF]'}`} />
            <span className="text-[10px] text-white/20 font-medium">{isLiveMode ? 'Live Mode' : 'Demo Mode'}</span>
          </div>
          <Button variant="ghost" size="sm" className="h-5 text-[9px] gap-1 px-1.5 text-white/15 hover:text-white/30" onClick={onNavigateToConfig}>
            <FiSettings className="w-2.5 h-2.5" /> Configure
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
      <div className="grid grid-cols-12 gap-2 flex-1 min-h-0">
        {/* Panel 1: TRANSCRIPT */}
        <div className="col-span-4 flex flex-col min-h-0">
          <div className="flex-1 flex flex-col rounded-2xl overflow-hidden" style={{ background: '#0A0C14', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center justify-between px-3.5 py-2.5 flex-shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <h3 className="text-[13px] font-bold text-white/70" style={{ fontFamily: "'Instrument Serif', serif" }}>Live Transcript</h3>
              </div>
              <span className="text-[9px] text-white/20 font-mono">{safeTranscript.length} lines</span>
            </div>

            {/* Call momentum strip — one bar per recent line, tinted by speaker */}
            <div className="px-3.5 py-2 flex items-center gap-[3px] flex-shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              {(() => {
                const SLOTS = 18
                const recent = safeTranscript.slice(-SLOTS)
                const pad = SLOTS - recent.length
                return (
                  <>
                    {Array.from({ length: pad }).map((_, i) => (
                      <span key={'p' + i} className="flex-1 h-[3px] rounded-full" style={{ background: 'rgba(255,255,255,0.04)' }} />
                    ))}
                    {recent.map((l, i) => {
                      const isLast = i === recent.length - 1
                      const color = l?.speaker === 'rep' ? '#8A6CFF' : '#FF9CC2'
                      const opacity = 0.35 + (i / Math.max(1, recent.length - 1)) * 0.55
                      return (
                        <span key={'b' + (l?.id || i)} className={'flex-1 h-[3px] rounded-full' + (isLast && callActive ? ' animate-pulse' : '')} style={{ background: color, opacity }} />
                      )
                    })}
                  </>
                )
              })()}
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2">
              {safeTranscript.length === 0 && (
                <div className="flex flex-col items-center justify-center py-10">
                  <FiMic className="w-6 h-6 text-white/5 mb-2" />
                  <p className="text-[12px] text-white/25 text-center font-medium">Waiting for conversation...</p>
                </div>
              )}
              {safeTranscript.map((line) => {
                const isRep = line?.speaker === 'rep'
                const accent = isRep ? '#8A6CFF' : '#FF9CC2'
                return (
                  <div
                    key={line?.id ?? Math.random()}
                    className="rounded-xl px-3.5 py-3 relative animate-fade-rise"
                    style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)' }}
                  >
                    {/* Left-edge speaker accent */}
                    <span className="absolute left-0 top-3 bottom-3 w-[2px] rounded-full" style={{ background: accent, opacity: 0.5 }} />
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: accent, opacity: 0.85 }}>
                        {isRep ? 'Rep' : 'Prospect'}
                      </span>
                      <span className="text-[9px] text-white/15 font-mono">{safeText(line?.timestamp, '')}</span>
                    </div>
                    <p className="text-[13px] text-white/75 leading-relaxed">{safeText(line?.text, '')}</p>
                  </div>
                )
              })}
              {callActive && safeTranscript.length > 0 && (
                <div className="flex items-center gap-1.5 py-1 px-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] text-white/30 uppercase tracking-widest font-semibold">Listening</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Panel 2: RESEARCH AGENT */}
        <div className="col-span-4 flex flex-col min-h-0">
          <div className="flex-1 flex flex-col rounded-2xl overflow-hidden" style={{ background: '#0A0C14', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center justify-between px-3 py-2.5 flex-shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex items-center gap-2">
                <span className="text-[12px]">🔍</span>
                <h3 className="text-[13px] font-bold text-white/70" style={{ fontFamily: "'Instrument Serif', serif" }}>Research Agent</h3>
              </div>
              <span className="text-[9px] px-2 py-0.5 rounded-full font-semibold" style={{ background: researchLoading ? 'rgba(138,108,255,0.08)' : displayResearch ? 'rgba(52,211,153,0.08)' : 'rgba(255,255,255,0.03)', color: researchLoading ? '#8A6CFF' : displayResearch ? '#34d399' : 'rgba(255,255,255,0.2)' }}>
                {researchLoading ? 'Researching...' : researchData ? 'Complete' : isShowingLastCall ? 'Previous' : 'Standby'}
              </span>
            </div>
            <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5">
              {researchError && <p className="text-[10px] text-red-400 py-1">{researchError}</p>}
              {researchLoading && !displayResearch && <LoadingPlaceholder count={3} />}
              {displayResearch ? (
                <>
                  {/* Prospect card — slick profile-style with avatar + platform-coloured social icons */}
                  {(displayResearch?.person_profile?.full_name || displayResearch?.person_profile?.linkedin_url || displayResearch?.person_profile?.headline) && (
                    <ProspectCard person={displayResearch.person_profile} />
                  )}
                  {/* Company card */}
                  <div className="rounded-xl p-2.5" style={{ background: 'rgba(138,108,255,0.04)', border: '1px solid rgba(138,108,255,0.08)' }}>
                    <p className="text-[9px] text-[#8A6CFF] uppercase font-bold tracking-wider mb-1">Company</p>
                    <p className="text-[13px] font-bold text-white/70">{safeText(displayResearch?.company_profile?.name, 'Unknown')}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {displayResearch?.company_profile?.industry && <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(138,108,255,0.06)', color: 'rgba(138,108,255,0.6)' }}>{safeText(displayResearch.company_profile.industry)}</span>}
                      {displayResearch?.company_profile?.size && <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.3)' }}>{safeText(displayResearch.company_profile.size)}</span>}
                    </div>
                    {displayResearch?.company_profile?.headquarters && <p className="text-[10px] text-white/25 mt-1">{safeText(displayResearch.company_profile.headquarters)}</p>}
                    {displayResearch?.company_profile?.website && /^https?:\/\//.test(safeText(displayResearch.company_profile.website)) && (
                      <a href={safeText(displayResearch.company_profile.website)} target="_blank" rel="noopener noreferrer" className="text-[9px] text-[#8A6CFF]/70 hover:text-[#8A6CFF] mt-1 inline-block transition-colors">Visit website ↗</a>
                    )}
                  </div>
                  {/* Funding — show only when we have real data; show "searching" while loading; hide otherwise */}
                  {(() => {
                    const f = displayResearch?.funding || {}
                    const realFunding = isRealValue(f.total_raised) || isRealValue(f.latest_round) || isRealValue(f.key_investors)
                    if (realFunding) {
                      return (
                        <div className="rounded-xl p-2.5" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                          <p className="text-[9px] text-white/30 uppercase font-bold tracking-wider mb-1">Funding</p>
                          {isRealValue(f.total_raised) && <p className="text-[11px] text-white/65 font-semibold">{safeText(f.total_raised)}</p>}
                          {isRealValue(f.latest_round) && <p className="text-[10px] text-white/40">{safeText(f.latest_round)}</p>}
                          {isRealValue(f.key_investors) && <p className="text-[10px] text-white/30 mt-0.5">{safeText(f.key_investors)}</p>}
                        </div>
                      )
                    }
                    if (researchLoading) return <LiveSearchingCard label="Funding" hint="Scanning Crunchbase, AngelList & public filings…" accent="amber" />
                    return null
                  })()}

                  {/* Tech Stack — same logic */}
                  {(() => {
                    const t = displayResearch?.tech_stack || {}
                    const techList = safeText(t.technologies, '').split(',').map((x: string) => x.trim()).filter((x: string) => x && isRealValue(x))
                    const realTech = techList.length > 0 || isRealValue(t.infrastructure) || isRealValue(t.tools)
                    if (realTech) {
                      return (
                        <div className="rounded-xl p-2.5" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                          <p className="text-[9px] text-white/30 uppercase font-bold tracking-wider mb-1">Tech Stack</p>
                          <div className="flex flex-wrap gap-1">
                            {techList.slice(0, 8).map((tech: string, i: number) => <span key={i} className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(138,108,255,0.08)', color: 'rgba(138,108,255,0.7)' }}>{tech}</span>)}
                          </div>
                          {isRealValue(t.infrastructure) && <p className="text-[10px] text-white/30 mt-1.5">{safeText(t.infrastructure)}</p>}
                        </div>
                      )
                    }
                    if (researchLoading) return <LiveSearchingCard label="Tech Stack" hint="Scanning company GitHub, BuiltWith & job listings…" accent="blue" />
                    return null
                  })()}

                  {/* Recent News — show only when real */}
                  {(() => {
                    const news = safeText(displayResearch?.recent_news, '')
                    if (isRealValue(news)) {
                      return (
                        <div className="rounded-xl p-2.5" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                          <p className="text-[9px] text-white/30 uppercase font-bold tracking-wider mb-1">Recent News</p>
                          <p className="text-[10px] text-white/45 leading-relaxed">{news.substring(0, 240)}</p>
                        </div>
                      )
                    }
                    if (researchLoading) return <LiveSearchingCard label="Recent News" hint="Looking at news, blogs & podcasts…" accent="blue" />
                    return null
                  })()}

                  {/* Pitch Angles — almost always show; emerald accent. Hide only if truly empty AND not loading */}
                  {(() => {
                    const pitch = safeText(displayResearch?.pitch_angles, '')
                    if (isRealValue(pitch)) {
                      return (
                        <div className="rounded-xl p-2.5" style={{ background: 'rgba(52,211,153,0.03)', border: '1px solid rgba(52,211,153,0.06)' }}>
                          <p className="text-[9px] text-emerald-400/60 uppercase font-bold tracking-wider mb-1">Pitch Angles</p>
                          <p className="text-[10px] text-white/45 leading-relaxed">{pitch.substring(0, 280)}</p>
                        </div>
                      )
                    }
                    if (researchLoading) return <LiveSearchingCard label="Pitch Angles" hint="Synthesising talking points…" accent="emerald" />
                    return null
                  })()}
                </>
              ) : !researchLoading && !researchError ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <FiSearch className="w-6 h-6 text-white/5 mb-2" />
                  <p className="text-[11px] text-white/20 text-center">Auto-triggers on entity detection</p>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {/* Panel 3: STRATEGY AGENT */}
        <div className="col-span-4 flex flex-col min-h-0">
          <div className="flex-1 flex flex-col rounded-2xl overflow-hidden" style={{ background: '#0A0C14', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center justify-between px-3 py-2.5 flex-shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex items-center gap-2">
                <span className="text-[12px]">🎯</span>
                <h3 className="text-[13px] font-bold text-white/70" style={{ fontFamily: "'Instrument Serif', serif" }}>Sales Strategy</h3>
              </div>
              <span className="text-[9px] px-2 py-0.5 rounded-full font-semibold" style={{ background: strategyLoading ? 'rgba(138,108,255,0.08)' : displayStrategy ? 'rgba(52,211,153,0.08)' : 'rgba(255,255,255,0.03)', color: strategyLoading ? '#8A6CFF' : displayStrategy ? '#34d399' : 'rgba(255,255,255,0.2)' }}>
                {strategyLoading ? 'Processing...' : strategyData ? 'Complete' : (displayStrategy && !strategyData) ? 'Previous' : 'Standby'}
              </span>
            </div>
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
                    <div className="rounded-xl p-2.5" style={{ background: 'rgba(52,211,153,0.04)', border: '1px solid rgba(52,211,153,0.1)' }}>
                      <div className="flex items-center justify-between mb-1.5">
                        <h4 className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
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
          </div>
        </div>
      </div>{/* end grid */}
      </div>{/* end main dashboard area */}

      {/* AI Chat removed — using right panel AI Assistant instead */}
    </div>
  )
}
