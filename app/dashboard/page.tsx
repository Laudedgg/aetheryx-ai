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
  { id: '69b03c357b2057cc3ff92a2b', name: 'Research Agent', icon: '🔍' },
  { id: '69b03c36778bd73de86e5ffd', name: 'Sales Strategy', icon: '🎯' },
  { id: '69b03c5393c7264ffc5fcc0d', name: 'Post-Call Intel', icon: '📊' },
  { id: '69b03c652f39e130540f1d49', name: 'CRM & Email', icon: '🔗' },
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

  const [config, setConfig] = useState<AppConfig>({ twilioSid: '', twilioAuth: '', fromNumber: '', deepgramKey: '', repPhone: '', llmApiKey: '', llmBaseUrl: 'https://api.openai.com/v1', llmModel: 'gpt-4o-mini' })

  const [callActive, setCallActive] = useState(false)
  const [currentCallId, setCurrentCallId] = useState<string | null>(null)
  const [transcript, setTranscript] = useState<TranscriptLine[]>([])
  const [researchData, setResearchData] = useState<any>(null)
  const [strategyData, setStrategyData] = useState<any>(null)
  const [postCallData, setPostCallData] = useState<any>(null)
  const [syncData, setSyncData] = useState<any>(null)
  const [callHistory, setCallHistory] = useState<CallData[]>([])

  const [globalChatMessages, setGlobalChatMessages] = useState<{ id: string; role: 'user' | 'ai'; text: string }[]>([])
  const [globalChatInput, setGlobalChatInput] = useState('')
  const [globalChatLoading, setGlobalChatLoading] = useState(false)
  const globalChatScrollRef = useRef<HTMLDivElement>(null)

  const [phoneNumber, setPhoneNumber] = useState('')
  const [callDuration, setCallDuration] = useState(0)
  const [callStatus, setCallStatus] = useState('Idle')
  const [callStartTime, setCallStartTime] = useState<number | null>(null)
  const [autoTriggerPostCall, setAutoTriggerPostCall] = useState(false)
  const durationTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (!mounted) return
    try { const saved = localStorage.getItem('salesmaster_dark_mode'); if (saved !== null) setDarkMode(saved === 'true') } catch (_e) {}
  }, [mounted])

  useEffect(() => {
    if (!mounted) return
    document.documentElement.classList.toggle('dark', darkMode)
    try { localStorage.setItem('salesmaster_dark_mode', String(darkMode)) } catch (_e) {}
  }, [darkMode, mounted])

  useEffect(() => {
    if (!mounted) return
    setConfig(loadConfig())
    try { const saved = localStorage.getItem('salesmaster_call_history'); if (saved) { const parsed = JSON.parse(saved); if (Array.isArray(parsed)) setCallHistory(parsed) } } catch (_e) {}
  }, [mounted])

  useEffect(() => {
    if (!mounted || callHistory.length === 0) return
    try { localStorage.setItem('salesmaster_call_history', JSON.stringify(callHistory)) } catch (_e) {}
  }, [callHistory, mounted])

  useEffect(() => {
    if (callActive && callStartTime) {
      durationTimerRef.current = setInterval(() => setCallDuration(Math.floor((Date.now() - callStartTime) / 1000)), 1000)
    } else {
      if (durationTimerRef.current) { clearInterval(durationTimerRef.current); durationTimerRef.current = null }
    }
    return () => { if (durationTimerRef.current) clearInterval(durationTimerRef.current) }
  }, [callActive, callStartTime])

  const handleStartCall = useCallback((_dialNumber: string) => {
    const id = 'call-' + Date.now(); setCurrentCallId(id); setCallActive(true); setCallStartTime(Date.now()); setCallDuration(0); setCallStatus('Connecting...'); setTranscript([]); setResearchData(null); setStrategyData(null); setPostCallData(null); setSyncData(null); setAutoTriggerPostCall(false); setTimeout(() => setCallStatus('Call Active'), 1500)
  }, [])

  const handleEndCall = useCallback(() => {
    setCallActive(false); setCallStatus('Call Ended')
    const call: CallData = { id: currentCallId || 'call-' + Date.now(), startTime: callStartTime ? new Date(callStartTime).toISOString() : new Date().toISOString(), endTime: new Date().toISOString(), transcript: transcript.slice(), researchData, strategyData, status: 'completed', phoneNumber, duration: callDuration }
    setCallHistory(prev => [call, ...prev]); setAutoTriggerPostCall(true); setActiveSection('post-call-review'); setTimeout(() => setCallStatus('Idle'), 3000)
  }, [currentCallId, transcript, researchData, strategyData, callDuration, phoneNumber, callStartTime])

  const handleAddTranscript = useCallback((line: TranscriptLine) => { setTranscript(prev => [...prev, line]) }, [])

  const handlePostCallData = useCallback((data: any) => {
    setPostCallData(data); setCallHistory(prev => { if (!prev.length) return prev; const u = [...prev]; u[0] = { ...u[0], postCallData: data }; return u })
  }, [])

  const handleSyncData = useCallback((data: any) => {
    setSyncData(data); setCallHistory(prev => { if (!prev.length) return prev; const u = [...prev]; u[0] = { ...u[0], syncData: data, status: 'synced' }; return u })
  }, [])

  const handleViewCall = useCallback((call: CallData) => {
    setTranscript(Array.isArray(call?.transcript) ? call.transcript : []); setPostCallData(call?.postCallData || null); setSyncData(call?.syncData || null); setAutoTriggerPostCall(false); setActiveSection('post-call-review')
  }, [])

  useEffect(() => { globalChatScrollRef.current && (globalChatScrollRef.current.scrollTop = globalChatScrollRef.current.scrollHeight) }, [globalChatMessages.length])

  const handleGlobalChatSend = useCallback(async () => {
    const msg = globalChatInput.trim(); if (!msg || globalChatLoading) return
    setGlobalChatInput(''); setGlobalChatMessages(prev => [...prev, { id: 'gc-u-' + Date.now(), role: 'user', text: msg }]); setGlobalChatLoading(true)
    try {
      let ctx = "You are Aetheryx AI, a smart AI sales co-pilot. Be conversational, concise, and actionable."
      if (transcript.length > 0) ctx += "\n\nLive transcript:\n" + transcript.map(l => (l.speaker === 'rep' ? 'Rep' : 'Prospect') + ': ' + l.text).join('\n')
      if (callHistory.length > 0) { ctx += "\n\nRecent calls (" + callHistory.length + "):"; callHistory.slice(0, 5).forEach((c, i) => { ctx += "\nCall " + (i+1) + " - " + (c.phoneNumber||'Unknown') + " (" + c.status + ")"; if (c.transcript?.length) ctx += "\n" + c.transcript.slice(0,10).map(l => (l.speaker==='rep'?'Rep':'Prospect')+': '+l.text).join('\n') }) }
      const res = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: [{ role: 'system', content: ctx }, ...globalChatMessages.map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.text })), { role: 'user', content: msg }], apiKey: config.llmApiKey, baseUrl: config.llmBaseUrl, model: config.llmModel }) })
      const data = await res.json()
      setGlobalChatMessages(prev => [...prev, { id: 'gc-a-' + Date.now(), role: 'ai', text: data.success ? data.message : (data.error || 'Failed.') }])
    } catch (_e) { setGlobalChatMessages(prev => [...prev, { id: 'gc-e-' + Date.now(), role: 'ai', text: 'Connection error.' }]) }
    finally { setGlobalChatLoading(false) }
  }, [globalChatInput, globalChatLoading, transcript, callHistory, globalChatMessages, config.llmApiKey, config.llmBaseUrl, config.llmModel])

  const showPostCallNav = postCallData !== null || (callHistory.length > 0 && !callActive)

  const NAV: { key: Section; label: string; d: string }[] = [
    { key: 'live-call', label: 'Live Call', d: 'M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z' },
    { key: 'call-history', label: 'History', d: 'M12 2a10 10 0 1 0 10 10H12V2z' },
    { key: 'analytics', label: 'Analytics', d: 'M18 20V10M12 20V4M6 20v-6' },
    { key: 'configuration', label: 'Settings', d: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14' },
  ]

  if (!mounted) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center"><div className="w-8 h-8 border-2 border-muted border-t-primary rounded-full animate-spin mx-auto mb-3" /><p className="text-sm text-muted-foreground">Loading...</p></div>
    </div>
  )

  return (
    <div className="h-screen bg-background text-foreground flex overflow-hidden">

      {/* ══ SIDEBAR ══ */}
      <aside className={cn(
        'hidden md:flex flex-col flex-shrink-0 bg-sidebar border-r border-border transition-all duration-200',
        sidebarOpen ? 'w-56' : 'w-14'
      )}>
        {/* Header */}
        <div className="h-13 flex items-center gap-2 px-3 border-b border-border flex-shrink-0">
          {sidebarOpen ? (
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
              </div>
              <span className="text-sm font-bold font-display tracking-wide truncate">Aetheryx AI</span>
            </div>
          ) : (
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center mx-auto">
              <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
            </div>
          )}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-muted-foreground hover:text-foreground p-1 rounded hover:bg-muted transition-colors ml-auto flex-shrink-0">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {sidebarOpen ? <polyline points="15 18 9 12 15 6"/> : <><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></>}
            </svg>
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-2 px-2 space-y-0.5 overflow-y-auto">
          {NAV.map(item => (
            <button key={item.key} onClick={() => setActiveSection(item.key)} className={cn(
              'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium transition-all',
              activeSection === item.key ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}>
              <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={item.d}/></svg>
              {sidebarOpen && <span>{item.label}</span>}
            </button>
          ))}
          {showPostCallNav && (
            <button onClick={() => setActiveSection('post-call-review')} className={cn(
              'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium transition-all',
              activeSection === 'post-call-review' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}>
              <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              {sidebarOpen && <span>Post-Call</span>}
            </button>
          )}
        </nav>

        {/* Agents + call status */}
        {sidebarOpen && (
          <div className="px-3 py-2.5 border-t border-border flex-shrink-0">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Agents</p>
            <div className="space-y-1">
              {AGENTS.map(a => (
                <div key={a.id} className="flex items-center gap-2 py-0.5">
                  <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', activeAgentId === a.id ? 'bg-green-400 animate-pulse' : 'bg-muted-foreground/25')} />
                  <span className="text-[11px] text-muted-foreground truncate">{a.icon} {a.name}</span>
                </div>
              ))}
            </div>
            {callActive && (
              <div className="mt-2 pt-2 border-t border-border flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                <span className="text-[11px] text-green-400 font-semibold font-mono tabular-nums">
                  {String(Math.floor(callDuration / 60)).padStart(2, '0')}:{String(callDuration % 60).padStart(2, '0')}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Dark mode */}
        <div className="px-2 py-2 border-t border-border flex-shrink-0">
          <button onClick={() => setDarkMode(!darkMode)} className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            {darkMode ? <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg> : <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>}
            {sidebarOpen && <span>{darkMode ? 'Light' : 'Dark'}</span>}
          </button>
        </div>
      </aside>

      {/* ══ MAIN ══ */}
      <main className="flex-1 flex flex-col min-w-0 pb-14 md:pb-0">
        {/* Top bar */}
        <header className="h-12 flex items-center justify-between px-4 border-b border-border bg-sidebar/50 flex-shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="md:hidden w-6 h-6 rounded-md bg-primary flex items-center justify-center flex-shrink-0">
              <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
            </div>
            <h1 className="text-sm font-semibold font-display truncate">
              {{ 'live-call': 'Live Call Dashboard', 'call-history': 'Call History', 'analytics': 'Analytics', 'post-call-review': 'Post-Call Review', 'configuration': 'Configuration' }[activeSection]}
            </h1>
            {callActive && (
              <span className="inline-flex items-center gap-1 bg-green-500/15 text-green-400 text-[10px] px-2 py-0.5 rounded-full font-medium border border-green-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" /> {callStatus}
              </span>
            )}
          </div>
          {activeAgentId && (
            <span className="text-[10px] text-green-400 flex items-center gap-1 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              {(AGENTS.find(a => a.id === activeAgentId) || { name: 'Processing' }).name}...
            </span>
          )}
        </header>

        {/* Content */}
        <div className="flex-1 overflow-auto p-3 md:p-4">
          <React.Suspense fallback={<SectionFallback />}>
            {activeSection === 'live-call' && <LiveCallDashboard callActive={callActive} transcript={transcript} researchData={researchData} strategyData={strategyData} onStartCall={handleStartCall} onEndCall={handleEndCall} onAddTranscript={handleAddTranscript} onResearchData={setResearchData} onStrategyData={setStrategyData} activeAgentId={activeAgentId} setActiveAgentId={setActiveAgentId} useSampleData={useSampleData} callDuration={callDuration} callStatus={callStatus} phoneNumber={phoneNumber} onPhoneNumberChange={setPhoneNumber} twilioSid={config.twilioSid} twilioAuth={config.twilioAuth} fromNumber={config.fromNumber} deepgramKey={config.deepgramKey} repPhone={config.repPhone} onNavigateToConfig={() => setActiveSection('configuration')} />}
            {activeSection === 'post-call-review' && <PostCallReview transcript={transcript} postCallData={postCallData} syncData={syncData} onPostCallData={handlePostCallData} onSyncData={handleSyncData} activeAgentId={activeAgentId} setActiveAgentId={setActiveAgentId} useSampleData={useSampleData} autoTrigger={autoTriggerPostCall} />}
            {activeSection === 'call-history' && <CallHistory callHistory={callHistory} onViewCall={handleViewCall} />}
            {activeSection === 'analytics' && <AnalyticsDashboard callHistory={callHistory} useSampleData={useSampleData} />}
            {activeSection === 'configuration' && <Configuration onConfigSaved={cfg => setConfig(cfg)} />}
          </React.Suspense>
        </div>
      </main>

      {/* ══ RIGHT: AI CHAT ══ */}
      <aside className="hidden lg:flex flex-col w-72 xl:w-80 flex-shrink-0 border-l border-border bg-sidebar">
        {/* Header */}
        <div className="h-12 flex items-center justify-between px-3 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
            <span className="text-xs font-semibold font-display">AI Assistant</span>
          </div>
          <span className="text-[9px] text-muted-foreground font-medium px-1.5 py-0.5 rounded bg-muted">Always On</span>
        </div>

        {/* Context */}
        <div className="px-3 py-1.5 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-1.5">
            <span className={cn('w-1.5 h-1.5 rounded-full', callActive ? 'bg-green-400 animate-pulse' : callHistory.length > 0 ? 'bg-primary' : 'bg-muted-foreground/30')} />
            <span className="text-[10px] text-muted-foreground">
              {callActive ? 'Live call context' : callHistory.length > 0 ? `${callHistory.length} call${callHistory.length !== 1 ? 's' : ''} loaded` : 'No context yet'}
            </span>
          </div>
        </div>

        {/* Messages */}
        <div ref={globalChatScrollRef} className="flex-1 overflow-y-auto p-3 space-y-2.5">
          {globalChatMessages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 px-2">
              <svg className="w-8 h-8 text-muted-foreground/10 mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
              <p className="text-[11px] text-muted-foreground text-center font-medium">Your AI sales assistant</p>
              <p className="text-[10px] text-muted-foreground/50 text-center mt-1 leading-relaxed">Ask about calls, get coaching tips, or prep for follow-ups.</p>
              <div className="flex flex-wrap gap-1 mt-3 justify-center">
                {['Summarize my last call', 'Prep for a follow-up', 'Coaching tips'].map(q => (
                  <button key={q} onClick={() => setGlobalChatInput(q)} className="text-[9px] px-2 py-0.5 rounded-full border border-border text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">{q}</button>
                ))}
              </div>
            </div>
          )}
          {globalChatMessages.map(msg => (
            <div key={msg.id} className={'flex ' + (msg.role === 'user' ? 'justify-end' : 'justify-start')}>
              <div className={cn('max-w-[88%] px-2.5 py-1.5 rounded-lg text-[11px] leading-relaxed', msg.role === 'user' ? 'bg-primary text-primary-foreground rounded-br-sm' : 'bg-muted text-foreground rounded-bl-sm')}>
                <p className="whitespace-pre-wrap">{msg.text}</p>
              </div>
            </div>
          ))}
          {globalChatLoading && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-lg px-2.5 py-1.5 rounded-bl-sm flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-primary animate-pulse" /><span className="w-1 h-1 rounded-full bg-primary animate-pulse [animation-delay:0.2s]" /><span className="w-1 h-1 rounded-full bg-primary animate-pulse [animation-delay:0.4s]" />
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="border-t border-border p-2 flex-shrink-0">
          <div className="flex gap-1.5">
            <Input value={globalChatInput} onChange={e => setGlobalChatInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleGlobalChatSend() } }} placeholder="Ask the AI..." className="flex-1 h-8 text-[11px] bg-muted/50 border-border" disabled={globalChatLoading} />
            <Button onClick={handleGlobalChatSend} disabled={!globalChatInput.trim() || globalChatLoading} size="sm" className="h-8 w-8 p-0 flex-shrink-0">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            </Button>
          </div>
        </div>
      </aside>

      {/* ══ MOBILE NAV ══ */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-sidebar/95 backdrop-blur-xl border-t border-border safe-area-bottom">
        <div className="flex items-center justify-around h-13">
          {NAV.map(item => {
            const active = activeSection === item.key
            return (
              <button key={item.key} onClick={() => setActiveSection(item.key)} className={cn('flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors', active ? 'text-primary' : 'text-muted-foreground')}>
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={item.d}/></svg>
                <span className="text-[9px] font-medium">{item.label}</span>
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
