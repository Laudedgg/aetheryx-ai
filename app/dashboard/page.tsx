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
  return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-white/10 border-t-[#216BE4] rounded-full animate-spin" /></div>
}

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
  useEffect(() => { if (!mounted) return; try { const s = localStorage.getItem('salesmaster_dark_mode'); if (s !== null) setDarkMode(s === 'true') } catch {} }, [mounted])
  useEffect(() => { if (!mounted) return; document.documentElement.classList.toggle('dark', darkMode); try { localStorage.setItem('salesmaster_dark_mode', String(darkMode)) } catch {} }, [darkMode, mounted])
  useEffect(() => { if (!mounted) return; setConfig(loadConfig()); try { const s = localStorage.getItem('salesmaster_call_history'); if (s) { const p = JSON.parse(s); if (Array.isArray(p)) setCallHistory(p) } } catch {} }, [mounted])
  useEffect(() => { if (!mounted || !callHistory.length) return; try { localStorage.setItem('salesmaster_call_history', JSON.stringify(callHistory)) } catch {} }, [callHistory, mounted])
  useEffect(() => { if (callActive && callStartTime) { durationTimerRef.current = setInterval(() => setCallDuration(Math.floor((Date.now() - callStartTime) / 1000)), 1000) } else { if (durationTimerRef.current) { clearInterval(durationTimerRef.current); durationTimerRef.current = null } } return () => { if (durationTimerRef.current) clearInterval(durationTimerRef.current) } }, [callActive, callStartTime])

  const handleStartCall = useCallback((_n: string) => { const id = 'call-' + Date.now(); setCurrentCallId(id); setCallActive(true); setCallStartTime(Date.now()); setCallDuration(0); setCallStatus('Connecting...'); setTranscript([]); setResearchData(null); setStrategyData(null); setPostCallData(null); setSyncData(null); setAutoTriggerPostCall(false); setTimeout(() => setCallStatus('Call Active'), 1500) }, [])
  const handleEndCall = useCallback(() => { setCallActive(false); setCallStatus('Call Ended'); const c: CallData = { id: currentCallId || 'call-' + Date.now(), startTime: callStartTime ? new Date(callStartTime).toISOString() : new Date().toISOString(), endTime: new Date().toISOString(), transcript: transcript.slice(), researchData, strategyData, status: 'completed', phoneNumber, duration: callDuration }; setCallHistory(p => [c, ...p]); setAutoTriggerPostCall(true); setActiveSection('post-call-review'); setTimeout(() => setCallStatus('Idle'), 3000) }, [currentCallId, transcript, researchData, strategyData, callDuration, phoneNumber, callStartTime])
  const handleAddTranscript = useCallback((l: TranscriptLine) => setTranscript(p => [...p, l]), [])
  const handlePostCallData = useCallback((d: any) => { setPostCallData(d); setCallHistory(p => { if (!p.length) return p; const u = [...p]; u[0] = { ...u[0], postCallData: d }; return u }) }, [])
  const handleSyncData = useCallback((d: any) => { setSyncData(d); setCallHistory(p => { if (!p.length) return p; const u = [...p]; u[0] = { ...u[0], syncData: d, status: 'synced' }; return u }) }, [])
  const handleViewCall = useCallback((c: CallData) => { setTranscript(Array.isArray(c?.transcript) ? c.transcript : []); setPostCallData(c?.postCallData || null); setSyncData(c?.syncData || null); setAutoTriggerPostCall(false); setActiveSection('post-call-review') }, [])

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

  const NAV: { key: Section; label: string; icon: React.ReactNode }[] = [
    { key: 'live-call', label: 'Live Call', icon: <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg> },
    { key: 'call-history', label: 'Call History', icon: <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
    { key: 'analytics', label: 'Analytics', icon: <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg> },
    { key: 'configuration', label: 'Settings', icon: <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg> },
  ]

  const SECTION_LABELS: Record<Section, string> = { 'live-call': 'Live Call Dashboard', 'call-history': 'Call History', 'analytics': 'Analytics', 'post-call-review': 'Post-Call Review', 'configuration': 'Configuration' }

  if (!mounted) return (
    <div className="h-screen flex items-center justify-center" style={{ background: '#060a14' }}>
      <div className="text-center"><div className="w-8 h-8 border-2 border-white/10 border-t-[#216BE4] rounded-full animate-spin mx-auto mb-3" /><p className="text-sm text-white/40">Loading Aetheryx AI...</p></div>
    </div>
  )

  return (
    <div className="h-screen flex overflow-hidden" style={{ background: '#060a14', color: '#e8eaf0' }}>

      {/* ═══ SIDEBAR ═══ */}
      <aside className={cn(
        'hidden md:flex flex-col flex-shrink-0 transition-all duration-300 border-r border-white/[0.06]',
        sidebarOpen ? 'w-[220px]' : 'w-[56px]'
      )} style={{ background: '#0a0f1a' }}>

        {/* Logo */}
        <div className="h-14 flex items-center px-3 border-b border-white/[0.06] flex-shrink-0">
          {sidebarOpen ? (
            <div className="flex items-center gap-2.5 flex-1">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, #216BE4, #1a5bc7)' }}>
                <svg className="w-4.5 h-4.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
              </div>
              <div>
                <p className="text-[13px] font-bold tracking-wide" style={{ fontFamily: "'Instrument Serif', serif" }}>Aetheryx</p>
                <p className="text-[9px] text-white/30 -mt-0.5">Sales Intelligence</p>
              </div>
            </div>
          ) : (
            <div className="w-8 h-8 rounded-lg flex items-center justify-center mx-auto" style={{ background: 'linear-gradient(135deg, #216BE4, #1a5bc7)' }}>
              <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
            </div>
          )}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="ml-auto text-white/20 hover:text-white/50 p-1 rounded transition-colors flex-shrink-0">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">{sidebarOpen ? <polyline points="15 18 9 12 15 6"/> : <><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></>}</svg>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
          {NAV.map(item => (
            <button key={item.key} onClick={() => setActiveSection(item.key)} className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200',
              activeSection === item.key
                ? 'text-white shadow-lg shadow-[#216BE4]/25'
                : 'text-white/40 hover:text-white/70 hover:bg-white/[0.03]'
            )} style={activeSection === item.key ? { background: 'linear-gradient(135deg, #216BE4, #1a5bc7)' } : {}}>
              {item.icon}
              {sidebarOpen && <span>{item.label}</span>}
            </button>
          ))}
          {showPostCallNav && (
            <button onClick={() => setActiveSection('post-call-review')} className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200',
              activeSection === 'post-call-review' ? 'text-white shadow-lg shadow-[#216BE4]/25' : 'text-white/40 hover:text-white/70 hover:bg-white/[0.03]'
            )} style={activeSection === 'post-call-review' ? { background: 'linear-gradient(135deg, #216BE4, #1a5bc7)' } : {}}>
              <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              {sidebarOpen && <span>Post-Call</span>}
            </button>
          )}
        </nav>

        {/* Agents */}
        {sidebarOpen && (
          <div className="px-3 py-3 border-t border-white/[0.06] flex-shrink-0">
            <p className="text-[9px] font-bold text-white/20 uppercase tracking-[0.15em] mb-2.5">Agents</p>
            <div className="space-y-1.5">
              {AGENTS.map(a => (
                <div key={a.id} className="flex items-center gap-2.5 px-2 py-1 rounded-lg" style={activeAgentId === a.id ? { background: 'rgba(52,211,153,0.06)' } : {}}>
                  <span className={cn('w-[6px] h-[6px] rounded-full flex-shrink-0 transition-all', activeAgentId === a.id ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)] animate-pulse' : 'bg-white/10')} />
                  <span className="text-[11px] text-white/35">{a.icon}</span>
                  <span className={cn('text-[11px] truncate', activeAgentId === a.id ? 'text-emerald-400 font-medium' : 'text-white/30')}>{a.name}</span>
                </div>
              ))}
            </div>
            {callActive && (
              <div className="mt-3 pt-2.5 border-t border-white/[0.04] flex items-center gap-2">
                <span className="w-[6px] h-[6px] rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                <span className="text-[11px] text-emerald-400 font-semibold font-mono tabular-nums">
                  {String(Math.floor(callDuration / 60)).padStart(2, '0')}:{String(callDuration % 60).padStart(2, '0')}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Dark mode */}
        <div className="px-2 py-2 border-t border-white/[0.06] flex-shrink-0">
          <button onClick={() => setDarkMode(!darkMode)} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[11px] text-white/25 hover:text-white/50 hover:bg-white/[0.03] transition-all">
            {darkMode ? <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg> : <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>}
            {sidebarOpen && <span>{darkMode ? 'Light' : 'Dark'}</span>}
          </button>
        </div>
      </aside>

      {/* ═══ MAIN CONTENT ═══ */}
      <main className="flex-1 flex flex-col min-w-0 pb-14 md:pb-0">
        {/* Top bar */}
        <header className="h-12 flex items-center justify-between px-4 md:px-5 border-b border-white/[0.06] flex-shrink-0" style={{ background: '#0a0f1a' }}>
          <div className="flex items-center gap-3 min-w-0">
            <div className="md:hidden w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, #216BE4, #1a5bc7)' }}>
              <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
            </div>
            <h1 className="text-sm font-semibold truncate" style={{ fontFamily: "'Instrument Serif', serif", color: '#e8eaf0' }}>{SECTION_LABELS[activeSection]}</h1>
            {callActive && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold border" style={{ background: 'rgba(52,211,153,0.08)', borderColor: 'rgba(52,211,153,0.2)', color: '#34d399' }}>
                <span className="w-[5px] h-[5px] rounded-full bg-emerald-400 animate-pulse" /> {callStatus}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {activeAgentId && (
              <span className="text-[10px] text-emerald-400 flex items-center gap-1.5 font-medium">
                <span className="w-[5px] h-[5px] rounded-full bg-emerald-400 animate-pulse" />
                {(AGENTS.find(a => a.id === activeAgentId) || { name: 'Processing' }).name}
              </span>
            )}
          </div>
        </header>

        {/* Content area */}
        <div className="flex-1 overflow-auto p-3 md:p-5">
          <React.Suspense fallback={<SectionFallback />}>
            {activeSection === 'live-call' && <LiveCallDashboard callActive={callActive} transcript={transcript} researchData={researchData} strategyData={strategyData} onStartCall={handleStartCall} onEndCall={handleEndCall} onAddTranscript={handleAddTranscript} onResearchData={setResearchData} onStrategyData={setStrategyData} activeAgentId={activeAgentId} setActiveAgentId={setActiveAgentId} useSampleData={useSampleData} callDuration={callDuration} callStatus={callStatus} phoneNumber={phoneNumber} onPhoneNumberChange={setPhoneNumber} twilioSid={config.twilioSid} twilioAuth={config.twilioAuth} fromNumber={config.fromNumber} deepgramKey={config.deepgramKey} repPhone={config.repPhone} onNavigateToConfig={() => setActiveSection('configuration')} />}
            {activeSection === 'post-call-review' && <PostCallReview transcript={transcript} postCallData={postCallData} syncData={syncData} onPostCallData={handlePostCallData} onSyncData={handleSyncData} activeAgentId={activeAgentId} setActiveAgentId={setActiveAgentId} useSampleData={useSampleData} autoTrigger={autoTriggerPostCall} />}
            {activeSection === 'call-history' && <CallHistory callHistory={callHistory} onViewCall={handleViewCall} />}
            {activeSection === 'analytics' && <AnalyticsDashboard callHistory={callHistory} useSampleData={useSampleData} />}
            {activeSection === 'configuration' && <Configuration onConfigSaved={cfg => setConfig(cfg)} />}
          </React.Suspense>
        </div>
      </main>

      {/* ═══ RIGHT PANEL — AI CHAT ═══ */}
      <aside className="hidden lg:flex flex-col w-[300px] xl:w-[320px] flex-shrink-0 border-l border-white/[0.06]" style={{ background: '#0a0f1a' }}>
        {/* Header */}
        <div className="h-12 flex items-center justify-between px-4 border-b border-white/[0.06] flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded flex items-center justify-center" style={{ background: 'rgba(33,107,228,0.15)' }}>
              <svg className="w-3 h-3" style={{ color: '#216BE4' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3Z"/></svg>
            </div>
            <span className="text-xs font-semibold" style={{ fontFamily: "'Instrument Serif', serif" }}>AI Assistant</span>
          </div>
          <span className="text-[9px] font-medium px-2 py-0.5 rounded-full" style={{ background: 'rgba(52,211,153,0.08)', color: '#34d399', border: '1px solid rgba(52,211,153,0.15)' }}>Online</span>
        </div>

        {/* Context */}
        <div className="px-4 py-2 border-b border-white/[0.06] flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className={cn('w-[5px] h-[5px] rounded-full', callActive ? 'bg-emerald-400 animate-pulse' : callHistory.length ? 'bg-[#216BE4]' : 'bg-white/10')} />
            <span className="text-[10px] text-white/30">
              {callActive ? 'Live call context' : callHistory.length ? `${callHistory.length} call${callHistory.length !== 1 ? 's' : ''} in memory` : 'No context yet'}
            </span>
          </div>
        </div>

        {/* Messages */}
        <div ref={globalChatScrollRef} className="flex-1 overflow-y-auto p-3 space-y-2.5">
          {!globalChatMessages.length && (
            <div className="flex flex-col items-center justify-center py-16 px-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: 'rgba(33,107,228,0.06)' }}>
                <svg className="w-5 h-5" style={{ color: 'rgba(33,107,228,0.25)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3Z"/></svg>
              </div>
              <p className="text-[11px] text-white/30 text-center font-medium">Your AI sales assistant</p>
              <p className="text-[10px] text-white/15 text-center mt-1">Ask about calls, coaching, or follow-ups.</p>
              <div className="flex flex-wrap gap-1.5 mt-4 justify-center">
                {['Summarize my last call', 'Prep for a follow-up', 'Coaching tips'].map(q => (
                  <button key={q} onClick={() => setGlobalChatInput(q)} className="text-[9px] px-2.5 py-1 rounded-full text-white/25 hover:text-white/50 transition-colors" style={{ border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>{q}</button>
                ))}
              </div>
            </div>
          )}
          {globalChatMessages.map(m => (
            <div key={m.id} className={'flex ' + (m.role === 'user' ? 'justify-end' : 'justify-start')}>
              <div className={cn('max-w-[88%] px-3 py-2 rounded-2xl text-[11px] leading-relaxed',
                m.role === 'user' ? 'rounded-br-md text-white' : 'rounded-bl-md text-white/70'
              )} style={m.role === 'user' ? { background: '#216BE4' } : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <p className="whitespace-pre-wrap">{m.text}</p>
              </div>
            </div>
          ))}
          {globalChatLoading && (
            <div className="flex justify-start">
              <div className="rounded-2xl rounded-bl-md px-3 py-2.5 flex items-center gap-1.5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <span className="w-1.5 h-1.5 rounded-full bg-[#216BE4] animate-pulse" /><span className="w-1.5 h-1.5 rounded-full bg-[#216BE4] animate-pulse [animation-delay:0.2s]" /><span className="w-1.5 h-1.5 rounded-full bg-[#216BE4] animate-pulse [animation-delay:0.4s]" />
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-3 border-t border-white/[0.06] flex-shrink-0">
          <div className="flex gap-2 items-center rounded-xl px-3 py-1" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <Input value={globalChatInput} onChange={e => setGlobalChatInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleGlobalChatSend() } }} placeholder="Ask the AI..." className="flex-1 h-8 text-[11px] bg-transparent border-0 shadow-none focus-visible:ring-0 placeholder:text-white/15 text-white/70" disabled={globalChatLoading} />
            <Button onClick={handleGlobalChatSend} disabled={!globalChatInput.trim() || globalChatLoading} size="sm" className="h-7 w-7 p-0 rounded-lg flex-shrink-0" style={{ background: '#216BE4' }}>
              <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            </Button>
          </div>
        </div>
      </aside>

      {/* ═══ MOBILE NAV ═══ */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-white/[0.06] safe-area-bottom" style={{ background: 'rgba(10,15,26,0.97)', backdropFilter: 'blur(20px)' }}>
        <div className="flex items-center justify-around h-14">
          {NAV.map(item => {
            const active = activeSection === item.key
            return (
              <button key={item.key} onClick={() => setActiveSection(item.key)} className={cn('flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl transition-all', active ? 'text-[#216BE4]' : 'text-white/25')}>
                {item.icon}
                <span className="text-[9px] font-medium">{item.label}</span>
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
