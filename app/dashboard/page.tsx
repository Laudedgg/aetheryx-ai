'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { cn } from '@/lib/utils'
import { loadConfig, type AppConfig } from './sections/Configuration'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

// Lazy load sections to isolate errors
const LiveCallDashboard = React.lazy(() => import('./sections/LiveCallDashboard'))
const PostCallReview = React.lazy(() => import('./sections/PostCallReview'))
const CallHistory = React.lazy(() => import('./sections/CallHistory'))
const AnalyticsDashboard = React.lazy(() => import('./sections/AnalyticsDashboard'))
const Configuration = React.lazy(() => import('./sections/Configuration'))

// --- Types ---
interface TranscriptLine {
  id: string
  speaker: 'rep' | 'prospect'
  text: string
  timestamp: string
}

interface CallData {
  id: string
  startTime: string
  endTime?: string
  transcript: TranscriptLine[]
  researchData?: any
  strategyData?: any
  postCallData?: any
  syncData?: any
  status: 'active' | 'completed' | 'synced'
  phoneNumber?: string
  duration?: number
}

// --- Agent Info ---
const AGENTS = [
  { id: '69b03c357b2057cc3ff92a2b', name: 'Research Agent' },
  { id: '69b03c36778bd73de86e5ffd', name: 'Sales Strategy Agent' },
  { id: '69b03c5393c7264ffc5fcc0d', name: 'Post-Call Intelligence' },
  { id: '69b03c652f39e130540f1d49', name: 'CRM & Email Sync' },
]

type Section = 'live-call' | 'call-history' | 'analytics' | 'post-call-review' | 'configuration'

function SectionFallback() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-muted border-t-primary rounded-full animate-spin" />
    </div>
  )
}

// --- Main Page ---
export default function Page() {
  const [mounted, setMounted] = useState(false)
  const [activeSection, setActiveSection] = useState<Section>('live-call')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [useSampleData] = useState(false)
  const [darkMode, setDarkMode] = useState(true)
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null)

  // Saved config state
  const [config, setConfig] = useState<AppConfig>({ twilioSid: '', twilioAuth: '', fromNumber: '', deepgramKey: '', repPhone: '', llmApiKey: '', llmBaseUrl: 'https://api.openai.com/v1', llmModel: 'gpt-4o-mini' })

  // Call state
  const [callActive, setCallActive] = useState(false)
  const [currentCallId, setCurrentCallId] = useState<string | null>(null)
  const [transcript, setTranscript] = useState<TranscriptLine[]>([])
  const [researchData, setResearchData] = useState<any>(null)
  const [strategyData, setStrategyData] = useState<any>(null)
  const [postCallData, setPostCallData] = useState<any>(null)
  const [syncData, setSyncData] = useState<any>(null)
  const [callHistory, setCallHistory] = useState<CallData[]>([])

  // Global AI Chat state
  const [globalChatMessages, setGlobalChatMessages] = useState<{ id: string; role: 'user' | 'ai'; text: string }[]>([])
  const [globalChatInput, setGlobalChatInput] = useState('')
  const [globalChatLoading, setGlobalChatLoading] = useState(false)
  const globalChatScrollRef = useRef<HTMLDivElement>(null)

  // Telephony state
  const [phoneNumber, setPhoneNumber] = useState('')
  const [callDuration, setCallDuration] = useState(0)
  const [callStatus, setCallStatus] = useState('Idle')
  const [callStartTime, setCallStartTime] = useState<number | null>(null)
  const [autoTriggerPostCall, setAutoTriggerPostCall] = useState(false)
  const durationTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => { setMounted(true) }, [])

  // Load dark mode preference
  useEffect(() => {
    if (!mounted) return
    try {
      const saved = localStorage.getItem('salesmaster_dark_mode')
      if (saved !== null) setDarkMode(saved === 'true')
    } catch (_e) { /* ignore */ }
  }, [mounted])

  // Apply dark mode class to html element
  useEffect(() => {
    if (!mounted) return
    document.documentElement.classList.toggle('dark', darkMode)
    try { localStorage.setItem('salesmaster_dark_mode', String(darkMode)) } catch (_e) { /* ignore */ }
  }, [darkMode, mounted])

  useEffect(() => {
    if (!mounted) return
    // Load config from localStorage
    setConfig(loadConfig())
    // Load call history
    try {
      const saved = localStorage.getItem('salesmaster_call_history')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed)) setCallHistory(parsed)
      }
    } catch (_e) { /* ignore */ }
  }, [mounted])

  useEffect(() => {
    if (!mounted || callHistory.length === 0) return
    try {
      localStorage.setItem('salesmaster_call_history', JSON.stringify(callHistory))
    } catch (_e) { /* ignore */ }
  }, [callHistory, mounted])

  // Call duration timer
  useEffect(() => {
    if (callActive && callStartTime) {
      durationTimerRef.current = setInterval(function() {
        setCallDuration(Math.floor((Date.now() - callStartTime) / 1000))
      }, 1000)
    } else {
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current)
        durationTimerRef.current = null
      }
    }
    return function() {
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current)
      }
    }
  }, [callActive, callStartTime])

  const handleStartCall = useCallback(function(_dialNumber: string) {
    const id = 'call-' + Date.now()
    setCurrentCallId(id)
    setCallActive(true)
    setCallStartTime(Date.now())
    setCallDuration(0)
    setCallStatus('Connecting...')
    setTranscript([])
    setResearchData(null)
    setStrategyData(null)
    setPostCallData(null)
    setSyncData(null)
    setAutoTriggerPostCall(false)
    setTimeout(function() { setCallStatus('Call Active') }, 1500)
  }, [])

  const handleEndCall = useCallback(function() {
    setCallActive(false)
    setCallStatus('Call Ended')
    const duration = callDuration
    const call: CallData = {
      id: currentCallId || 'call-' + Date.now(),
      startTime: callStartTime ? new Date(callStartTime).toISOString() : new Date().toISOString(),
      endTime: new Date().toISOString(),
      transcript: transcript.slice(),
      researchData: researchData,
      strategyData: strategyData,
      status: 'completed',
      phoneNumber: phoneNumber,
      duration: duration
    }
    setCallHistory(function(prev) { return [call].concat(prev) })
    setAutoTriggerPostCall(true)
    setActiveSection('post-call-review')
    setTimeout(function() { setCallStatus('Idle') }, 3000)
  }, [currentCallId, transcript, researchData, strategyData, callDuration, phoneNumber, callStartTime])

  const handleAddTranscript = useCallback(function(line: TranscriptLine) {
    setTranscript(function(prev) { return prev.concat([line]) })
  }, [])

  const handlePostCallData = useCallback(function(data: any) {
    setPostCallData(data)
    setCallHistory(function(prev) {
      if (prev.length === 0) return prev
      var updated = prev.slice()
      updated[0] = Object.assign({}, updated[0], { postCallData: data })
      return updated
    })
  }, [])

  const handleSyncData = useCallback(function(data: any) {
    setSyncData(data)
    setCallHistory(function(prev) {
      if (prev.length === 0) return prev
      var updated = prev.slice()
      updated[0] = Object.assign({}, updated[0], { syncData: data, status: 'synced' as const })
      return updated
    })
  }, [])

  const handleViewCall = useCallback(function(call: CallData) {
    setTranscript(Array.isArray(call && call.transcript) ? call.transcript : [])
    setPostCallData(call && call.postCallData ? call.postCallData : null)
    setSyncData(call && call.syncData ? call.syncData : null)
    setAutoTriggerPostCall(false)
    setActiveSection('post-call-review')
  }, [])

  // Global chat auto-scroll
  useEffect(() => {
    if (globalChatScrollRef.current) {
      globalChatScrollRef.current.scrollTop = globalChatScrollRef.current.scrollHeight
    }
  }, [globalChatMessages.length])

  const handleGlobalChatSend = useCallback(async () => {
    const msg = globalChatInput.trim()
    if (!msg || globalChatLoading) return
    setGlobalChatInput('')
    const userMsg = { id: 'gc-u-' + Date.now(), role: 'user' as const, text: msg }
    setGlobalChatMessages((prev) => prev.concat([userMsg]))
    setGlobalChatLoading(true)
    try {
      // Build system context with call data
      let systemContext = "You are Aetheryx AI, a smart and friendly AI sales co-pilot. You help sales reps with coaching, call prep, follow-ups, objection handling, and general questions. Be conversational, concise, and actionable."
      if (transcript.length > 0) {
        systemContext += "\n\nCurrent live call transcript:\n" + transcript.map((l) =>
          (l.speaker === 'rep' ? 'Sales Rep' : 'Prospect') + ': ' + (l.text || '')
        ).join('\n')
      }
      if (callHistory.length > 0) {
        systemContext += "\n\nRecent call history (" + callHistory.length + " calls):"
        callHistory.slice(0, 5).forEach((c, i) => {
          systemContext += "\n\nCall " + (i + 1) + " - " + (c.phoneNumber || 'Unknown') + " (" + (c.status || '') + ", " + (c.duration ? Math.round(c.duration / 60) + " min" : 'N/A') + "):"
          if (c.transcript && c.transcript.length > 0) {
            systemContext += "\n" + c.transcript.slice(0, 10).map((l) =>
              (l.speaker === 'rep' ? 'Rep' : 'Prospect') + ': ' + (l.text || '')
            ).join('\n')
            if (c.transcript.length > 10) systemContext += "\n... (" + (c.transcript.length - 10) + " more lines)"
          }
        })
      }

      // Build messages array for the LLM
      const llmMessages = [
        { role: 'system', content: systemContext },
        ...globalChatMessages.map((m) => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.text })),
        { role: 'user', content: msg }
      ]

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: llmMessages,
          apiKey: config.llmApiKey,
          baseUrl: config.llmBaseUrl,
          model: config.llmModel,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setGlobalChatMessages((prev) => prev.concat([{ id: 'gc-a-' + Date.now(), role: 'ai' as const, text: data.message }]))
      } else {
        setGlobalChatMessages((prev) => prev.concat([{ id: 'gc-e-' + Date.now(), role: 'ai' as const, text: data.error || 'Failed to get response.' }]))
      }
    } catch (_e) {
      setGlobalChatMessages((prev) => prev.concat([{ id: 'gc-e-' + Date.now(), role: 'ai' as const, text: 'Connection error. Please try again.' }]))
    } finally {
      setGlobalChatLoading(false)
    }
  }, [globalChatInput, globalChatLoading, transcript, callHistory, globalChatMessages, config.llmApiKey, config.llmBaseUrl, config.llmModel])

  const showPostCallNav = postCallData !== null || (callHistory.length > 0 && !callActive)

  const sectionLabel: Record<Section, string> = {
    'live-call': 'Live Call Dashboard',
    'call-history': 'Call History',
    'analytics': 'Analytics',
    'post-call-review': 'Post-Call Review',
    'configuration': 'Configuration',
  }

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-muted border-t-primary rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Compute stats for the hero banner
  const totalCalls = callHistory.length
  const activeAgents = AGENTS.filter(function(a) { return activeAgentId === a.id }).length + (callActive ? 1 : 0)
  const syncedCalls = callHistory.filter(function(c) { return c.status === 'synced' }).length
  const avgDuration = totalCalls > 0
    ? Math.round(callHistory.reduce(function(sum, c) { return sum + (c.duration || 0) }, 0) / totalCalls)
    : 0

  return (
    <div className="min-h-screen bg-background text-foreground flex">

      {/* ===== LEFT SIDEBAR ===== hidden on mobile, shown on md+ */}
      <aside className="hidden md:flex flex-col w-60 flex-shrink-0 p-3 gap-3 overflow-y-auto">

        {/* Logo Card */}
        <div className="bg-sidebar border border-border rounded-2xl px-4 py-3.5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary/25">
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-bold font-display tracking-wide text-foreground leading-tight">Aetheryx AI</h1>
              <p className="text-[10px] text-muted-foreground mt-0.5">Sales Co-Pilot</p>
            </div>
          </div>
        </div>

        {/* Navigation Card */}
        <div className="bg-sidebar border border-border rounded-2xl p-2">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2.5 pt-1 pb-2">Navigation</p>
          <nav className="space-y-0.5">
            {[
              { key: 'live-call' as Section, label: 'Live Call', d: 'M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z' },
              { key: 'call-history' as Section, label: 'Call History', d: 'M12 2a10 10 0 1 0 10 10H12V2zM21.18 8.02A10 10 0 0 0 15.98 2.82' },
              { key: 'analytics' as Section, label: 'Analytics', d: 'M18 20V10M12 20V4M6 20v-6' },
              { key: 'configuration' as Section, label: 'Configuration', d: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14' },
            ].map(function(item) {
              return (
                <button key={item.key} onClick={function() { setActiveSection(item.key) }} className={cn(
                  'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-medium transition-all duration-200',
                  activeSection === item.key
                    ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}>
                  <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={item.d}/></svg>
                  <span>{item.label}</span>
                  {item.key === 'configuration' && config.twilioSid && config.twilioAuth && config.deepgramKey && (
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 ml-auto flex-shrink-0" />
                  )}
                </button>
              )
            })}
            {showPostCallNav && (
              <button onClick={function() { setActiveSection('post-call-review') }} className={cn(
                'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-medium transition-all duration-200',
                activeSection === 'post-call-review'
                  ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}>
                <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                <span>Post-Call</span>
              </button>
            )}
          </nav>
        </div>

        {/* Agent Status Card */}
        <div className="bg-sidebar border border-border rounded-2xl px-4 py-3">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">Agent Status</p>
          <div className="space-y-2">
            {AGENTS.map(function(agent) {
              return (
                <div key={agent.id} className="flex items-center gap-2.5">
                  <span className={cn(
                    'w-2 h-2 rounded-full flex-shrink-0',
                    activeAgentId === agent.id ? 'bg-green-400 animate-pulse' : 'bg-muted-foreground/30'
                  )} />
                  <span className="text-[11px] text-muted-foreground truncate">{agent.name}</span>
                </div>
              )
            })}
          </div>
          {callActive && (
            <div className="mt-3 pt-3 border-t border-border">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-[11px] text-green-400 font-semibold">Call Active</span>
              </div>
              <p className="text-xs text-muted-foreground font-mono mt-1 tabular-nums">
                {String(Math.floor(callDuration / 60)).padStart(2, '0')}:{String(callDuration % 60).padStart(2, '0')}
              </p>
            </div>
          )}
        </div>

        {/* Recent Calls Card */}
        {callHistory.length > 0 && (
          <div className="bg-sidebar border border-border rounded-2xl px-4 py-3">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">Recent Calls</p>
            <div className="space-y-2">
              {callHistory.slice(0, 3).map(function(call) {
                return (
                  <button
                    key={call.id}
                    onClick={function() { handleViewCall(call) }}
                    className="w-full flex items-center gap-2.5 p-2 rounded-lg hover:bg-muted transition-colors text-left"
                  >
                    <span className={cn(
                      'w-2 h-2 rounded-full flex-shrink-0',
                      call.status === 'synced' ? 'bg-primary' : call.status === 'completed' ? 'bg-amber-400' : 'bg-muted-foreground/30'
                    )} />
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] text-foreground truncate">{call.phoneNumber || 'Unknown'}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {call.duration ? Math.floor(call.duration / 60) + 'm ' + (call.duration % 60) + 's' : '--'}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Dark mode toggle at bottom */}
        <div className="mt-auto pt-2">
          <button
            onClick={function() { setDarkMode(!darkMode) }}
            className="w-full flex items-center gap-2.5 px-4 py-2 rounded-xl text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            {darkMode ? (
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
            )}
            <span className="font-medium">{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
        </div>
      </aside>

      {/* ===== CENTER CONTENT ===== */}
      <main className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">

        {/* Hero Banner */}
        <div className="mx-3 md:mx-4 mt-3 md:mt-4 rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border border-primary/20 p-4 md:p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-lg md:text-xl font-display font-bold text-foreground">Welcome back</h2>
              <p className="text-xs text-muted-foreground mt-1">
                {callActive ? 'You have an active call in progress.' : 'Your AI sales co-pilot is ready.'}
                {activeAgentId && (
                  <span className="inline-flex items-center gap-1.5 ml-2 text-green-400 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                    {(AGENTS.find(function(a) { return a.id === activeAgentId }) || {name:'Processing'}).name}...
                  </span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-4 md:gap-6">
              <div className="text-center">
                <p className="text-lg md:text-xl font-bold font-display text-foreground tabular-nums">{totalCalls}</p>
                <p className="text-[10px] text-muted-foreground">Total Calls</p>
              </div>
              <div className="w-px h-8 bg-border" />
              <div className="text-center">
                <p className="text-lg md:text-xl font-bold font-display text-foreground tabular-nums">{activeAgents || AGENTS.length}</p>
                <p className="text-[10px] text-muted-foreground">Agents</p>
              </div>
              <div className="w-px h-8 bg-border" />
              <div className="text-center">
                <p className="text-lg md:text-xl font-bold font-display text-foreground tabular-nums">
                  {avgDuration > 0 ? Math.floor(avgDuration / 60) + 'm' : '--'}
                </p>
                <p className="text-[10px] text-muted-foreground">Avg Duration</p>
              </div>
            </div>
          </div>

          {/* Call status badges */}
          {callActive && activeSection === 'live-call' && (
            <div className="mt-3">
              <span className="inline-flex items-center gap-1.5 bg-green-500/15 text-green-400 text-[11px] px-2.5 py-0.5 rounded-full font-medium border border-green-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" /> {callStatus}
              </span>
            </div>
          )}
          {!callActive && callStatus === 'Call Ended' && (
            <div className="mt-3">
              <span className="inline-flex items-center gap-1.5 bg-muted text-muted-foreground text-[11px] px-2.5 py-0.5 rounded-full font-medium border border-border">
                Call Ended
              </span>
            </div>
          )}
        </div>

        {/* Section Label */}
        <div className="px-3 md:px-4 pt-4 pb-2">
          <div className="flex items-center gap-2">
            {/* Mobile logo */}
            <div className="md:hidden flex items-center gap-2 mr-1">
              <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center flex-shrink-0">
                <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
              </div>
            </div>
            <h3 className="text-sm font-semibold font-display tracking-wide">{sectionLabel[activeSection]}</h3>
          </div>
        </div>

        {/* Active Section Content */}
        <div className="flex-1 px-3 md:px-4 pb-4 overflow-auto">
          <React.Suspense fallback={<SectionFallback />}>
            {activeSection === 'live-call' && (
              <LiveCallDashboard
                callActive={callActive}
                transcript={transcript}
                researchData={researchData}
                strategyData={strategyData}
                onStartCall={handleStartCall}
                onEndCall={handleEndCall}
                onAddTranscript={handleAddTranscript}
                onResearchData={setResearchData}
                onStrategyData={setStrategyData}
                activeAgentId={activeAgentId}
                setActiveAgentId={setActiveAgentId}
                useSampleData={useSampleData}
                callDuration={callDuration}
                callStatus={callStatus}
                phoneNumber={phoneNumber}
                onPhoneNumberChange={setPhoneNumber}
                twilioSid={config.twilioSid}
                twilioAuth={config.twilioAuth}
                fromNumber={config.fromNumber}
                deepgramKey={config.deepgramKey}
                repPhone={config.repPhone}
                onNavigateToConfig={function() { setActiveSection('configuration') }}
              />
            )}
            {activeSection === 'post-call-review' && (
              <PostCallReview
                transcript={transcript}
                postCallData={postCallData}
                syncData={syncData}
                onPostCallData={handlePostCallData}
                onSyncData={handleSyncData}
                activeAgentId={activeAgentId}
                setActiveAgentId={setActiveAgentId}
                useSampleData={useSampleData}
                autoTrigger={autoTriggerPostCall}
              />
            )}
            {activeSection === 'call-history' && (
              <CallHistory
                callHistory={callHistory}
                onViewCall={handleViewCall}
              />
            )}
            {activeSection === 'analytics' && (
              <AnalyticsDashboard
                callHistory={callHistory}
                useSampleData={useSampleData}
              />
            )}
            {activeSection === 'configuration' && (
              <Configuration
                onConfigSaved={function(cfg) { setConfig(cfg) }}
              />
            )}
          </React.Suspense>
        </div>

        {/* Floating Chat Input (SocietyAI "Ask Sai anything" style) */}
        <div className="px-3 md:px-4 pb-3 md:pb-4 flex-shrink-0">
          <div className="bg-sidebar border border-border rounded-2xl p-2 shadow-lg shadow-black/10">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-primary flex-shrink-0 ml-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
              <Input
                value={globalChatInput}
                onChange={function(e) { setGlobalChatInput(e.target.value) }}
                onKeyDown={function(e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleGlobalChatSend() } }}
                placeholder="Ask Aetheryx anything..."
                className="flex-1 h-9 text-xs bg-transparent border-0 shadow-none focus-visible:ring-0 placeholder:text-muted-foreground/50"
                disabled={globalChatLoading}
              />
              <Button
                onClick={handleGlobalChatSend}
                disabled={!globalChatInput.trim() || globalChatLoading}
                size="sm"
                className="h-8 w-8 p-0 flex-shrink-0 rounded-xl"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              </Button>
            </div>
          </div>
        </div>
      </main>

      {/* ===== RIGHT PANEL ===== hidden below xl */}
      <aside className="hidden xl:flex flex-col w-80 flex-shrink-0 p-3 gap-3 overflow-y-auto">

        {/* Agent Pulse Card */}
        <div className="bg-sidebar border border-border rounded-2xl px-4 py-3.5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold font-display tracking-wide text-foreground">Agent Pulse</p>
            <span className="inline-flex items-center gap-1.5 text-[10px] font-medium text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              Live
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-muted/50 rounded-xl p-3">
              <p className="text-lg font-bold font-display text-foreground tabular-nums">{totalCalls}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Total Calls</p>
            </div>
            <div className="bg-muted/50 rounded-xl p-3">
              <p className="text-lg font-bold font-display text-foreground tabular-nums">{syncedCalls}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Deals Synced</p>
            </div>
            <div className="bg-muted/50 rounded-xl p-3">
              <p className="text-lg font-bold font-display text-foreground tabular-nums">
                {avgDuration > 0 ? Math.floor(avgDuration / 60) + ':' + String(avgDuration % 60).padStart(2, '0') : '--:--'}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Avg Duration</p>
            </div>
            <div className="bg-muted/50 rounded-xl p-3">
              <p className="text-lg font-bold font-display text-foreground tabular-nums">
                {callHistory.filter(function(c) { return c.syncData }).length}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Emails Sent</p>
            </div>
          </div>
        </div>

        {/* AI Chat / Recent Activity Panel */}
        <div className="bg-sidebar border border-border rounded-2xl flex flex-col flex-1 min-h-0 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
              <span className="text-xs font-semibold font-display tracking-wide">AI Assistant</span>
            </div>
            <span className="text-[10px] text-muted-foreground font-medium px-1.5 py-0.5 rounded bg-muted">Always On</span>
          </div>

          {/* Context indicator */}
          <div className="px-4 py-2 border-b border-border flex-shrink-0">
            <div className="flex items-center gap-2">
              {callActive ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-[11px] text-green-400 font-medium">Live call context active</span>
                </>
              ) : callHistory.length > 0 ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-primary" />
                  <span className="text-[11px] text-muted-foreground font-medium">{callHistory.length} past call{callHistory.length !== 1 ? 's' : ''} loaded</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-muted-foreground/30" />
                  <span className="text-[11px] text-muted-foreground font-medium">No call context yet</span>
                </>
              )}
            </div>
          </div>

          {/* Messages */}
          <div ref={globalChatScrollRef} className="flex-1 overflow-y-auto p-3 space-y-3">
            {globalChatMessages.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 px-2">
                <svg className="w-10 h-10 text-muted-foreground/15 mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
                <p className="text-xs text-muted-foreground text-center font-medium">Your AI sales assistant</p>
                <p className="text-[11px] text-muted-foreground/60 text-center mt-1.5 leading-relaxed">
                  {config.llmApiKey
                    ? 'Ask about past calls, get coaching tips, prepare for upcoming calls, or just chat.'
                    : 'Add your LLM API key in Configuration to get started.'}
                </p>
                <div className="flex flex-wrap gap-1.5 mt-3 justify-center">
                  {[
                    'Summarize my last call',
                    'How did my calls go today?',
                    'Help me prep for a follow-up',
                  ].map(function(q) {
                    return (
                      <button
                        key={q}
                        onClick={function() { setGlobalChatInput(q) }}
                        className="text-[10px] px-2.5 py-1 rounded-full border border-border text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                      >
                        {q}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
            {globalChatMessages.map(function(msg) {
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
            {globalChatLoading && (
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

          {/* Right panel chat input */}
          <div className="border-t border-border p-2 flex-shrink-0">
            <div className="flex gap-2">
              <Input
                value={globalChatInput}
                onChange={function(e) { setGlobalChatInput(e.target.value) }}
                onKeyDown={function(e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleGlobalChatSend() } }}
                placeholder="Ask the AI..."
                className="flex-1 h-9 text-xs bg-muted/50 border-border"
                disabled={globalChatLoading}
              />
              <Button
                onClick={handleGlobalChatSend}
                disabled={!globalChatInput.trim() || globalChatLoading}
                size="sm"
                className="h-9 w-9 p-0 flex-shrink-0"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              </Button>
            </div>
          </div>
        </div>
      </aside>

      {/* ===== MOBILE BOTTOM NAV (PWA style) ===== */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-sidebar/95 backdrop-blur-xl border-t border-border safe-area-bottom">
        <div className="flex items-center justify-around h-14">
          {[
            { key: 'live-call' as Section, label: 'Call', icon: 'M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z' },
            { key: 'call-history' as Section, label: 'History', icon: 'M12 2a10 10 0 1 0 10 10H12V2z' },
            { key: 'analytics' as Section, label: 'Analytics', icon: 'M18 20V10M12 20V4M6 20v-6' },
            { key: 'configuration' as Section, label: 'Settings', icon: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z' },
          ].map(function(item) {
            const isActive = activeSection === item.key
            return (
              <button
                key={item.key}
                onClick={function() { setActiveSection(item.key) }}
                className={cn(
                  'flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors min-w-0',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={item.icon}/></svg>
                <span className="text-[10px] font-medium">{item.label}</span>
                {isActive && <span className="w-1 h-1 rounded-full bg-primary" />}
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
