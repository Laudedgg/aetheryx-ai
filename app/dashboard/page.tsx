'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { cn } from '@/lib/utils'
import { loadConfig, type AppConfig } from './sections/Configuration'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

const LiveCallDashboard = React.lazy(() => import('./sections/LiveCallDashboard'))
const PostCallReview = React.lazy(() => import('./sections/PostCallReview'))
const CallHistory = React.lazy(() => import('./sections/CallHistory'))
const AnalyticsDashboard = React.lazy(() => import('./sections/AnalyticsDashboard'))
const Configuration = React.lazy(() => import('./sections/Configuration'))

interface TranscriptLine { id: string; speaker: 'rep' | 'prospect'; text: string; timestamp: string }
interface CallData { id: string; startTime: string; endTime?: string; transcript: TranscriptLine[]; researchData?: any; strategyData?: any; postCallData?: any; syncData?: any; status: 'active' | 'completed' | 'synced'; phoneNumber?: string; duration?: number }

const AGENTS = [
  { id: '69b03c357b2057cc3ff92a2b', name: 'Research Agent', icon: '🔍' },
  { id: '69b03c36778bd73de86e5ffd', name: 'Sales Strategy', icon: '🎯' },
  { id: '69b03c5393c7264ffc5fcc0d', name: 'Post-Call Intel', icon: '📊' },
  { id: '69b03c652f39e130540f1d49', name: 'CRM & Email', icon: '🔗' },
]

type Section = 'live-call' | 'call-history' | 'analytics' | 'post-call-review' | 'configuration'

function SectionFallback() {
  return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-white/10 border-t-[#8A6CFF] rounded-full animate-spin" /></div>
}

/* ── Shared card wrapper ── */
const C = 'rounded-2xl border border-white/[0.06]'
const cardBg = '#0A0C14'
const panelBg = '#070811'

/* Small square nav glyph — filled (active) vs hairline (inactive) — mirrors the
   inspiration's Workspace list. Replaces emoji with a quieter, brand-aligned mark. */
function NavSquare({ active }: { active: boolean }) {
  return (
    <span
      aria-hidden
      className="inline-block w-[14px] h-[14px] rounded-[3px] flex-shrink-0"
      style={
        active
          ? { background: 'rgba(138,108,255,0.22)', boxShadow: 'inset 0 0 0 1px rgba(138,108,255,0.55), 0 0 14px rgba(138,108,255,0.35)' }
          : { boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.14)' }
      }
    />
  )
}

const SECTION_LABEL: Record<Section, string> = {
  'live-call': 'Live Call',
  'call-history': 'Call History',
  'analytics': 'Analytics',
  'post-call-review': 'Post-Call Review',
  'configuration': 'Configuration',
}

export default function Page() {
  const [mounted, setMounted] = useState(false)
  const [activeSection, setActiveSection] = useState<Section>('live-call')
  const [useSampleData] = useState(false)
  const [darkMode, setDarkMode] = useState(true)
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null)
  const [config, setConfig] = useState<AppConfig>({ twilioSid: '', twilioAuth: '', fromNumber: '', deepgramKey: '', repPhone: '', llmApiKey: '', llmBaseUrl: 'https://api.openai.com/v1', llmModel: 'gpt-4o-mini' })
  const [callsLoaded, setCallsLoaded] = useState(false)
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
  useEffect(() => { if (!mounted) return; try { const s = localStorage.getItem('salesmaster_dark_mode'); if (s !== null) setDarkMode(s === 'true') } catch {} }, [mounted])
  useEffect(() => { if (!mounted) return; document.documentElement.classList.toggle('dark', darkMode); try { localStorage.setItem('salesmaster_dark_mode', String(darkMode)) } catch {} }, [darkMode, mounted])
  useEffect(() => {
    if (!mounted) return
    const saved = loadConfig()
    setConfig(saved)
    // Always fetch real telephony keys from server to replace placeholders
    fetch('/api/config/telephony').then(r => r.json()).then(data => {
      if (data.success) {
        const real = { ...saved, ...data.config, liveMode: true }
        setConfig(real)
        try { localStorage.setItem('salesmaster_config', JSON.stringify(real)) } catch {}
      }
    }).catch(() => {})
    // Load call history: merge localStorage + server, then sync back
    let localCalls: any[] = []
    try { const s = localStorage.getItem('salesmaster_call_history'); if (s) { const p = JSON.parse(s); if (Array.isArray(p)) localCalls = p } } catch {}
    fetch('/api/calls').then(r => r.json()).then(data => {
      const serverCalls = (data.success && Array.isArray(data.calls)) ? data.calls : []
      const merged = new Map<string, any>()
      for (const c of serverCalls) merged.set(c.id, c)
      for (const c of localCalls) merged.set(c.id, c)
      const final = Array.from(merged.values()).sort((a: any, b: any) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
      setCallHistory(final)
      setCallsLoaded(true)
      if (final.length > 0) {
        fetch('/api/calls', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ calls: final }) }).catch(() => {})
      }
    }).catch(() => {
      setCallHistory(localCalls)
      setCallsLoaded(true)
      if (localCalls.length > 0) {
        fetch('/api/calls', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ calls: localCalls }) }).catch(() => {})
      }
    })
  }, [mounted])
  useEffect(() => {
    if (!mounted || !callHistory.length) return
    try { localStorage.setItem('salesmaster_call_history', JSON.stringify(callHistory)) } catch {}
    fetch('/api/calls', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ calls: callHistory }) }).catch(() => {})
    // Pre-populate agent data from last call if currently empty
    if (!researchData && !callActive) {
      const last = callHistory.find(c => c.researchData)
      if (last?.researchData) setResearchData(last.researchData)
    }
    if (!strategyData && !callActive) {
      const last = callHistory.find(c => c.strategyData)
      if (last?.strategyData) setStrategyData(last.strategyData)
    }
    if (!postCallData && !callActive) {
      const last = callHistory.find(c => c.postCallData)
      if (last?.postCallData) setPostCallData(last.postCallData)
    }
  }, [callHistory, mounted])
  useEffect(() => { if (callActive && callStartTime) { durationTimerRef.current = setInterval(() => setCallDuration(Math.floor((Date.now() - callStartTime) / 1000)), 1000) } else { if (durationTimerRef.current) { clearInterval(durationTimerRef.current); durationTimerRef.current = null } } return () => { if (durationTimerRef.current) clearInterval(durationTimerRef.current) } }, [callActive, callStartTime])

  const handleStartCall = useCallback((_n: string) => { const id = 'call-' + Date.now(); setCurrentCallId(id); setCallActive(true); setCallStartTime(Date.now()); setCallDuration(0); setCallStatus('Connecting...'); setTranscript([]); setResearchData(null); setStrategyData(null); setPostCallData(null); setSyncData(null); setAutoTriggerPostCall(false); setTimeout(() => setCallStatus('Call Active'), 1500) }, [])
  const handleEndCall = useCallback(() => { setCallActive(false); setCallStatus('Call Ended'); setPostCallData(null); setSyncData(null); const c: CallData = { id: currentCallId || 'call-' + Date.now(), startTime: callStartTime ? new Date(callStartTime).toISOString() : new Date().toISOString(), endTime: new Date().toISOString(), transcript: transcript.slice(), researchData, strategyData, status: 'completed', phoneNumber, duration: callDuration }; setCallHistory(p => [c, ...p]); setAutoTriggerPostCall(true); setActiveSection('post-call-review'); setTimeout(() => setCallStatus('Idle'), 3000) }, [currentCallId, transcript, researchData, strategyData, callDuration, phoneNumber, callStartTime])
  const handleAddTranscript = useCallback((l: TranscriptLine) => setTranscript(p => [...p, l]), [])
  // Update the call record matching currentCallId (the call currently being viewed/active),
  // not always index 0 — otherwise regenerating an old call's post-call would clobber the
  // newest call's data.
  const handlePostCallData = useCallback((d: any) => {
    setPostCallData(d);
    setCallHistory(p => p.map(c => c.id === currentCallId ? { ...c, postCallData: d } : c))
  }, [currentCallId])
  const handleSyncData = useCallback((d: any) => {
    setSyncData(d);
    setCallHistory(p => p.map(c => c.id === currentCallId ? { ...c, syncData: d, status: 'synced' } : c))
  }, [currentCallId])
  const handleViewCall = useCallback((c: CallData) => {
    // Always regenerate post-call data with the latest prompt — never trust persisted data,
    // since the prompt has been improved over time and old runs may carry hallucinations.
    setCurrentCallId(c?.id || null);
    setTranscript(Array.isArray(c?.transcript) ? c.transcript : []);
    setPostCallData(null);
    setSyncData(null);
    setAutoTriggerPostCall(true);
    setActiveSection('post-call-review');
  }, [])

  useEffect(() => { globalChatScrollRef.current && (globalChatScrollRef.current.scrollTop = globalChatScrollRef.current.scrollHeight) }, [globalChatMessages.length])

  const handleGlobalChatSend = useCallback(async () => {
    const msg = globalChatInput.trim(); if (!msg || globalChatLoading) return
    setGlobalChatInput(''); setGlobalChatMessages(p => [...p, { id: 'u-' + Date.now(), role: 'user', text: msg }]); setGlobalChatLoading(true)
    try {
      let ctx = "You are Aetheryx AI, a smart AI sales co-pilot. Be concise and actionable."
      if (transcript.length) ctx += "\n\nLive transcript:\n" + transcript.map(l => (l.speaker === 'rep' ? 'Rep' : 'Prospect') + ': ' + l.text).join('\n')
      if (callHistory.length) { ctx += "\n\nRecent calls:"; callHistory.slice(0, 5).forEach((c, i) => { ctx += `\nCall ${i+1} - ${c.phoneNumber||'Unknown'} (${c.status})`; if (c.transcript?.length) ctx += '\n' + c.transcript.slice(0,8).map(l => (l.speaker==='rep'?'Rep':'Prospect')+': '+l.text).join('\n') }) }
      const r = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: [{ role: 'system', content: ctx }, ...globalChatMessages.map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.text })), { role: 'user', content: msg }], apiKey: config.llmApiKey, baseUrl: config.llmBaseUrl, model: config.llmModel }) })
      const d = await r.json()
      setGlobalChatMessages(p => [...p, { id: 'a-' + Date.now(), role: 'ai', text: d.success ? d.message : (d.error || 'Error') }])
    } catch { setGlobalChatMessages(p => [...p, { id: 'e-' + Date.now(), role: 'ai', text: 'Connection error.' }]) }
    finally { setGlobalChatLoading(false) }
  }, [globalChatInput, globalChatLoading, transcript, callHistory, globalChatMessages, config.llmApiKey, config.llmBaseUrl, config.llmModel])

  const showPostCallNav = postCallData !== null || (callHistory.length > 0 && !callActive)
  const totalCalls = callHistory.length
  const syncedCalls = callHistory.filter(c => c.status === 'synced').length
  const avgDur = totalCalls ? Math.round(callHistory.reduce((s, c) => s + (c.duration || 0), 0) / totalCalls) : 0
  const emailsSent = callHistory.filter(c => c.syncData).length

  if (!mounted) return (
    <div className="h-screen flex items-center justify-center" style={{ background: '#05060A' }}>
      <div className="text-center"><div className="w-8 h-8 border-2 border-white/10 border-t-[#8A6CFF] rounded-full animate-spin mx-auto mb-3" /><p className="text-[13px] text-white/30">Loading Aetheryx AI...</p></div>
    </div>
  )

  /* ════════════════════════════════════════════════════════════════════ */
  return (
    <div className="h-screen flex overflow-hidden relative" style={{ color: '#dde1ea' }}>

      {/* ══════ BACKGROUND ══════ */}
      <div className="absolute inset-0 z-0 pointer-events-none" style={{ background: '#05060A' }} />
      {/* Soft violet ambient — matches the landing-page atmos */}
      <div className="absolute inset-0 z-0 pointer-events-none" style={{
        background:
          'radial-gradient(1200px 700px at 75% -10%, rgba(138,108,255,0.18), transparent 60%),\
           radial-gradient(900px 600px at 10% 20%, rgba(91,108,255,0.10), transparent 60%),\
           radial-gradient(800px 500px at 50% 110%, rgba(124,231,255,0.06), transparent 60%)',
      }} />

      {/* ══════ LEFT SIDEBAR — quiet, label-driven, no card chrome ══════ */}
      <aside className="hidden md:flex flex-col w-[240px] flex-shrink-0 px-5 py-5 gap-7 overflow-hidden relative z-10" style={{ background: panelBg }}>

        {/* Logo */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <img src="/aetheryx-logo.png" alt="Aetheryx" className="w-8 h-8 object-contain flex-shrink-0" style={{ filter: 'drop-shadow(0 0 10px rgba(124,231,255,.45)) drop-shadow(0 0 22px rgba(91,108,255,.25))' }} />
          <span className="text-[14px] font-semibold tracking-tight" style={{ color: 'var(--ink)' }}>Aetheryx</span>
        </div>

        {/* WORKSPACE */}
        <div className="flex flex-col gap-2 flex-shrink-0">
          <p className="text-[10px] font-mono uppercase tracking-[0.22em] mb-1" style={{ color: 'var(--ink-3)' }}>Workspace</p>
          {([
            { key: 'live-call' as Section, label: 'Live Call' },
            { key: 'call-history' as Section, label: 'Call History' },
            { key: 'analytics' as Section, label: 'Analytics' },
            ...(showPostCallNav ? [{ key: 'post-call-review' as Section, label: 'Post-Call' }] : []),
            { key: 'configuration' as Section, label: 'Settings' },
          ]).map(item => {
            const active = activeSection === item.key
            return (
              <button
                key={item.key}
                onClick={() => setActiveSection(item.key)}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-200"
                style={active
                  ? { background: 'rgba(138,108,255,0.08)', color: 'var(--ink)', boxShadow: 'inset 0 0 0 1px rgba(138,108,255,0.18)' }
                  : { color: 'var(--ink-2)' }
                }
                onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.color = 'var(--ink)' }}
                onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.color = 'var(--ink-2)' }}
              >
                <NavSquare active={active} />
                <span>{item.label}</span>
              </button>
            )
          })}
        </div>

        {/* AGENTS — kept for status visibility, restyled minimal */}
        <div className="flex flex-col gap-2 flex-shrink-0">
          <p className="text-[10px] font-mono uppercase tracking-[0.22em] mb-1" style={{ color: 'var(--ink-3)' }}>Agents</p>
          {AGENTS.map(a => {
            const on = activeAgentId === a.id
            return (
              <div key={a.id} className="flex items-center gap-3 px-3 py-1.5 text-[12.5px]">
                <span className="w-[6px] h-[6px] rounded-full flex-shrink-0" style={on
                  ? { background: 'var(--aqua)', boxShadow: '0 0 8px rgba(94,230,201,0.55)' }
                  : { background: 'rgba(255,255,255,0.10)' }
                } />
                <span style={{ color: on ? 'var(--aqua)' : 'var(--ink-2)' }} className="truncate">{a.name}</span>
              </div>
            )
          })}
          {callActive && (
            <div className="mt-1 px-3 flex items-center justify-between text-[10.5px]" style={{ color: 'var(--aqua)' }}>
              <span className="flex items-center gap-1.5"><span className="w-[6px] h-[6px] rounded-full bg-emerald-400 animate-pulse" /> Active</span>
              <span className="font-mono tabular-nums">{String(Math.floor(callDuration / 60)).padStart(2, '0')}:{String(callDuration % 60).padStart(2, '0')}</span>
            </div>
          )}
        </div>

        {/* RECENT — same data, restyled flat */}
        <div className="flex flex-col gap-2 flex-shrink-0">
          <div className="flex items-center justify-between mb-1 px-0">
            <p className="text-[10px] font-mono uppercase tracking-[0.22em]" style={{ color: 'var(--ink-3)' }}>Recent</p>
            <span className="text-[10px] font-mono" style={{ color: 'var(--ink-3)' }}>{totalCalls}</span>
          </div>
          {callHistory.length > 0 ? (
            <>
              {callHistory.slice(0, 3).map(call => (
                <button key={call.id} onClick={() => handleViewCall(call)} className="w-full flex items-center gap-3 px-3 py-1.5 rounded-lg text-left transition-all hover:bg-white/[0.025]">
                  <span className="w-[6px] h-[6px] rounded-full flex-shrink-0" style={{ background: call.status === 'synced' ? 'var(--violet)' : '#F2D29B' }} />
                  <span className="text-[12px] truncate flex-1" style={{ color: 'var(--ink-2)' }}>{call.phoneNumber || 'Demo'}</span>
                  <span className="text-[10px] font-mono" style={{ color: 'var(--ink-3)' }}>{call.duration ? Math.floor(call.duration / 60) + ':' + String(call.duration % 60).padStart(2, '0') : '--'}</span>
                </button>
              ))}
              {callHistory.length > 3 && (
                <button onClick={() => setActiveSection('call-history')} className="w-full text-[11px] text-left px-3 py-1 transition-colors" style={{ color: 'var(--violet-2)' }}>
                  View all {totalCalls} calls →
                </button>
              )}
            </>
          ) : (
            <p className="text-[11px] px-3 py-1" style={{ color: 'var(--ink-3)' }}>No calls yet</p>
          )}
        </div>

        {/* User — minimal, bottom */}
        <div className="flex items-center gap-3 mt-auto pt-3 px-1 flex-shrink-0" style={{ borderTop: '1px solid var(--line)' }}>
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0" style={{ background: 'var(--grad)' }}>A</div>
          <p className="text-[12px] truncate flex-1" style={{ color: 'var(--ink-2)' }}>Aetheryx User</p>
          <button onClick={() => setDarkMode(!darkMode)} className="transition-colors p-1 flex-shrink-0" style={{ color: 'var(--ink-3)' }} title="Theme">
            {darkMode ? <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="12" cy="12" r="5"/></svg> : <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>}
          </button>
        </div>
      </aside>

      {/* ══════ CENTER CONTENT ══════ */}
      <main className="flex-1 flex flex-col min-w-0 pb-14 md:pb-0 overflow-hidden relative z-10">

        {/* macOS window chrome — three dots + breadcrumb path */}
        <div className="hidden md:flex items-center gap-3 px-5 py-3 flex-shrink-0" style={{ borderBottom: '1px solid var(--line)' }}>
          <div className="flex gap-1.5">
            <span className="w-3 h-3 rounded-full" style={{ background: 'rgba(255,95,86,0.55)' }} />
            <span className="w-3 h-3 rounded-full" style={{ background: 'rgba(255,189,46,0.55)' }} />
            <span className="w-3 h-3 rounded-full" style={{ background: 'rgba(39,201,63,0.55)' }} />
          </div>
          <span className="text-[12px] font-mono ml-3" style={{ color: 'var(--ink-3)' }}>
            app.aetheryx.ai
            <span className="mx-2 opacity-40">/</span>
            dashboard
            <span className="mx-2 opacity-40">/</span>
            <span style={{ color: 'var(--ink-2)' }}>{SECTION_LABEL[activeSection].toLowerCase()}</span>
          </span>
        </div>

        {/* Section content — fills remaining space, scrolls only when needed */}
        <div className="flex-1 flex flex-col min-h-0 px-5 md:px-8 py-6 md:py-8 overflow-y-auto">

          {/* Section header — display serif title with monospace eyebrow */}
          <div className="mb-6 flex-shrink-0">
            <div className="flex items-center gap-3 mb-2">
              <p className="text-[10px] font-mono uppercase tracking-[0.22em]" style={{ color: 'var(--ink-3)' }}>
                Aetheryx
                <span className="mx-2 opacity-40">/</span>
                <span style={{ color: 'var(--violet-2)' }}>{SECTION_LABEL[activeSection]}</span>
              </p>
              {callActive && (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: 'rgba(94,230,201,0.08)', border: '1px solid rgba(94,230,201,0.22)', color: 'var(--aqua)' }}>
                  <span className="w-[5px] h-[5px] rounded-full bg-emerald-400 animate-pulse" /> {callStatus}
                </span>
              )}
              {activeAgentId && (
                <span className="text-[10px] flex items-center gap-1.5 font-medium" style={{ color: 'var(--aqua)' }}>
                  <span className="w-[5px] h-[5px] rounded-full bg-emerald-400 animate-pulse" />
                  {(AGENTS.find(a => a.id === activeAgentId) || { name: 'Processing' }).name}
                </span>
              )}
            </div>
            <h1 className="text-[34px] md:text-[44px] leading-[1.05] tracking-[-0.02em] font-normal" style={{ fontFamily: "'Instrument Serif', serif", color: 'var(--ink)' }}>
              {SECTION_LABEL[activeSection]}
            </h1>
            {activeSection === 'live-call' && !callActive && (
              <p className="mt-3 text-[14px] leading-relaxed max-w-2xl" style={{ color: 'var(--ink-2)' }}>
                Real-time transcription, prospect research, live objection coaching, and post-call automation — all wired into HubSpot and Gmail. Less reporting. More closing.
              </p>
            )}
          </div>

          {/* Active section */}
          <React.Suspense fallback={<SectionFallback />}>
            {activeSection === 'live-call' && <LiveCallDashboard callActive={callActive} transcript={transcript} researchData={researchData} strategyData={strategyData} onStartCall={handleStartCall} onEndCall={handleEndCall} onAddTranscript={handleAddTranscript} onResearchData={setResearchData} onStrategyData={setStrategyData} activeAgentId={activeAgentId} setActiveAgentId={setActiveAgentId} useSampleData={useSampleData} callDuration={callDuration} callStatus={callStatus} phoneNumber={phoneNumber} onPhoneNumberChange={setPhoneNumber} twilioSid={config.twilioSid} twilioAuth={config.twilioAuth} fromNumber={config.fromNumber} deepgramKey={config.deepgramKey} repPhone={config.repPhone} onNavigateToConfig={() => setActiveSection('configuration')} callHistory={callHistory} />}
            {activeSection === 'post-call-review' && <PostCallReview transcript={transcript} postCallData={postCallData} syncData={syncData} onPostCallData={handlePostCallData} onSyncData={handleSyncData} activeAgentId={activeAgentId} setActiveAgentId={setActiveAgentId} useSampleData={useSampleData} autoTrigger={autoTriggerPostCall} />}
            {activeSection === 'call-history' && <CallHistory callHistory={callHistory} onViewCall={handleViewCall} callsLoaded={callsLoaded} />}
            {activeSection === 'analytics' && <AnalyticsDashboard callHistory={callHistory} useSampleData={useSampleData} callsLoaded={callsLoaded} />}
            {activeSection === 'configuration' && <Configuration onConfigSaved={cfg => setConfig(cfg)} />}
          </React.Suspense>
        </div>

      </main>

      {/* ══════ RIGHT PANEL — AETHERYX · LIVE / NEXT BEST ACTION / SIGNAL FEED ══════ */}
      <aside className="hidden xl:flex flex-col w-[340px] flex-shrink-0 px-5 py-5 gap-5 overflow-y-auto relative z-10" style={{ background: panelBg, borderLeft: '1px solid var(--line)' }}>

        {/* AETHERYX · LIVE header */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="w-[7px] h-[7px] rounded-full bg-emerald-400 animate-pulse" style={{ boxShadow: '0 0 10px rgba(94,230,201,0.6)' }} />
          <span className="text-[10.5px] font-mono uppercase tracking-[0.22em]" style={{ color: 'var(--ink-2)' }}>Aetheryx</span>
          <span className="text-[10.5px] font-mono opacity-40">·</span>
          <span className="text-[10.5px] font-mono uppercase tracking-[0.22em]" style={{ color: 'var(--aqua)' }}>Live</span>
        </div>

        {/* SIGNAL FEED — moved above chat per layout preference */}
        <div className="flex flex-col gap-2 flex-shrink-0">
          <p className="text-[10.5px] font-mono uppercase tracking-[0.22em] mb-1" style={{ color: 'var(--ink-3)' }}>Signal Feed</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { val: totalCalls, label: 'Total Calls' },
              { val: syncedCalls, label: 'Deals Synced' },
              { val: avgDur > 0 ? Math.floor(avgDur / 60) + ':' + String(avgDur % 60).padStart(2, '0') : '--:--', label: 'Avg Duration' },
              { val: emailsSent, label: 'Emails Sent' },
            ].map(s => (
              <div key={s.label} className="rounded-xl px-3 py-2.5" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--line)' }}>
                <p className="text-[20px] tabular-nums leading-none" style={{ fontFamily: "'Instrument Serif', serif", color: 'var(--ink)' }}>{s.val}</p>
                <p className="text-[10px] mt-1.5 font-mono uppercase tracking-[0.12em]" style={{ color: 'var(--ink-3)' }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* NEXT BEST ACTION — violet-bordered AI assistant panel */}
        <div className="flex flex-col flex-1 min-h-0 rounded-2xl overflow-hidden" style={{ background: 'linear-gradient(180deg, rgba(138,108,255,0.06) 0%, rgba(138,108,255,0.015) 100%)', border: '1px solid rgba(138,108,255,0.22)' }}>
          <div className="flex items-center justify-between px-4 py-3 flex-shrink-0" style={{ borderBottom: '1px solid rgba(138,108,255,0.12)' }}>
            <div className="flex items-center gap-2">
              <svg className="w-3 h-3" style={{ color: 'var(--violet-2)' }} viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 22 22 2 22" /></svg>
              <span className="text-[10.5px] font-mono uppercase tracking-[0.22em]" style={{ color: 'var(--violet-2)' }}>Next Best Action</span>
            </div>
            <span className="text-[9px] font-mono uppercase tracking-[0.18em]" style={{ color: 'var(--ink-3)' }}>Always On</span>
          </div>

          {/* Context */}
          <div className="px-4 py-2 flex-shrink-0" style={{ borderBottom: '1px solid rgba(138,108,255,0.08)' }}>
            <div className="flex items-center gap-2">
              <span className={cn('w-[5px] h-[5px] rounded-full', callActive ? 'bg-emerald-400 animate-pulse' : callHistory.length ? 'bg-[var(--violet-2)]' : 'bg-white/10')} style={callHistory.length && !callActive ? { background: 'var(--violet-2)' } : undefined} />
              <span className="text-[11px]" style={{ color: 'var(--ink-3)' }}>
                {callActive ? 'Live call context' : callHistory.length ? `${callHistory.length} call${callHistory.length !== 1 ? 's' : ''} in memory` : 'No context yet'}
              </span>
            </div>
          </div>

          {/* Messages */}
          <div ref={globalChatScrollRef} className="flex-1 overflow-y-auto p-3 space-y-2">
            {!globalChatMessages.length && (
              <div className="flex flex-col items-center justify-center py-8 px-3">
                <p className="text-[12px] text-center font-medium" style={{ color: 'var(--ink-2)' }}>Your AI sales co-pilot</p>
                <p className="text-[11px] text-center mt-1" style={{ color: 'var(--ink-3)' }}>Ask about calls, coaching, or follow-ups.</p>
                <div className="flex flex-wrap gap-1.5 mt-4 justify-center">
                  {['Summarize my last call', 'Prep for a follow-up', 'Coaching tips'].map(q => (
                    <button key={q} onClick={() => setGlobalChatInput(q)} className="text-[10px] px-2.5 py-1 rounded-full transition-colors" style={{ border: '1px solid var(--line-2)', color: 'var(--ink-2)', background: 'rgba(255,255,255,0.02)' }}>{q}</button>
                  ))}
                </div>
              </div>
            )}
            {globalChatMessages.map(m => (
              <div key={m.id} className={'flex ' + (m.role === 'user' ? 'justify-end' : 'justify-start')}>
                <div className={cn('max-w-[88%] px-3 py-2 text-[12px] leading-relaxed',
                  m.role === 'user' ? 'rounded-2xl rounded-br-md text-white' : 'rounded-2xl rounded-bl-md'
                )} style={m.role === 'user' ? { background: 'var(--violet)', boxShadow: '0 8px 24px -8px rgba(138,108,255,0.45)' } : { background: 'rgba(255,255,255,0.03)', border: '1px solid var(--line)', color: 'var(--ink-2)' }}>
                  <p className="whitespace-pre-wrap">{m.text}</p>
                </div>
              </div>
            ))}
            {globalChatLoading && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-md px-3 py-2.5 flex items-center gap-1.5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--line)' }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#8A6CFF] animate-pulse" /><span className="w-1.5 h-1.5 rounded-full bg-[#8A6CFF] animate-pulse [animation-delay:0.2s]" /><span className="w-1.5 h-1.5 rounded-full bg-[#8A6CFF] animate-pulse [animation-delay:0.4s]" />
                </div>
              </div>
            )}
          </div>

          {/* Chat input */}
          <div className="p-3 flex-shrink-0" style={{ borderTop: '1px solid rgba(138,108,255,0.08)' }}>
            <div className="flex gap-2 items-center rounded-xl px-3 py-1" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--line)' }}>
              <Input value={globalChatInput} onChange={e => setGlobalChatInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleGlobalChatSend() } }} placeholder="Ask Aetheryx..." className="flex-1 h-8 text-[12px] bg-transparent border-0 shadow-none focus-visible:ring-0" style={{ color: 'var(--ink)' }} disabled={globalChatLoading} />
              <Button onClick={handleGlobalChatSend} disabled={!globalChatInput.trim() || globalChatLoading} size="sm" className="h-7 w-7 p-0 rounded-lg flex-shrink-0" style={{ background: 'var(--violet)' }}>
                <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              </Button>
            </div>
          </div>
        </div>

      </aside>

      {/* ══════ MOBILE NAV ══════ */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-white/[0.06] safe-area-bottom" style={{ background: 'rgba(8,13,24,0.97)', backdropFilter: 'blur(20px)' }}>
        <div className="flex items-center justify-around h-14">
          {[
            { key: 'live-call' as Section, label: 'Call', icon: '📞' },
            { key: 'call-history' as Section, label: 'History', icon: '📋' },
            { key: 'analytics' as Section, label: 'Analytics', icon: '📊' },
            { key: 'configuration' as Section, label: 'Settings', icon: '⚙️' },
          ].map(item => (
            <button key={item.key} onClick={() => setActiveSection(item.key)} className={cn('flex flex-col items-center gap-1 px-4 py-1.5 rounded-xl transition-all', activeSection === item.key ? 'text-[#8A6CFF]' : 'text-white/20')}>
              <span className="text-[18px]">{item.icon}</span>
              <span className="text-[9px] font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}
