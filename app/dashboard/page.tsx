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

/* ── Shared card wrapper ── */
const C = 'rounded-2xl border border-white/[0.06]'
const cardBg = '#0c1120'
const panelBg = '#080d18'

export default function Page() {
  const [mounted, setMounted] = useState(false)
  const [activeSection, setActiveSection] = useState<Section>('live-call')
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
  const totalCalls = callHistory.length
  const syncedCalls = callHistory.filter(c => c.status === 'synced').length
  const avgDur = totalCalls ? Math.round(callHistory.reduce((s, c) => s + (c.duration || 0), 0) / totalCalls) : 0
  const emailsSent = callHistory.filter(c => c.syncData).length

  if (!mounted) return (
    <div className="h-screen flex items-center justify-center" style={{ background: '#060a14' }}>
      <div className="text-center"><div className="w-8 h-8 border-2 border-white/10 border-t-[#216BE4] rounded-full animate-spin mx-auto mb-3" /><p className="text-[13px] text-white/30">Loading Aetheryx AI...</p></div>
    </div>
  )

  /* ════════════════════════════════════════════════════════════════════ */
  return (
    <div className="h-screen flex overflow-hidden" style={{ background: '#060a14', color: '#dde1ea' }}>

      {/* ══════ LEFT SIDEBAR ══════ */}
      <aside className="hidden md:flex flex-col w-[240px] flex-shrink-0 p-3 gap-2.5 overflow-y-auto" style={{ background: panelBg }}>

        {/* Logo */}
        <div className={C + ' p-3.5 flex items-center gap-3'} style={{ background: cardBg }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-[#216BE4]/20" style={{ background: 'linear-gradient(135deg, #216BE4, #1a5bc7)' }}>
            <svg className="w-[18px] h-[18px] text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
          </div>
          <div>
            <p className="text-[14px] font-bold tracking-wide leading-tight" style={{ fontFamily: "'Instrument Serif', serif" }}>Aetheryx AI</p>
            <p className="text-[10px] text-white/25 leading-tight">Sales Intelligence</p>
          </div>
          <button onClick={() => setDarkMode(!darkMode)} className="ml-auto text-white/15 hover:text-white/40 transition-colors p-1">
            {darkMode ? <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/></svg> : <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>}
          </button>
        </div>

        {/* Navigation */}
        <div className={C + ' p-2'} style={{ background: cardBg }}>
          {[
            { key: 'live-call' as Section, label: 'Live Call', icon: '📞' },
            { key: 'call-history' as Section, label: 'Call History', icon: '📋' },
            { key: 'analytics' as Section, label: 'Analytics', icon: '📊' },
            { key: 'configuration' as Section, label: 'Settings', icon: '⚙️' },
          ].map(item => (
            <button key={item.key} onClick={() => setActiveSection(item.key)} className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 mb-0.5',
              activeSection === item.key
                ? 'text-white shadow-lg shadow-[#216BE4]/20'
                : 'text-white/35 hover:text-white/60 hover:bg-white/[0.03]'
            )} style={activeSection === item.key ? { background: 'linear-gradient(135deg, #216BE4, #1a5bc7)' } : {}}>
              <span className="text-[15px]">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
          {showPostCallNav && (
            <button onClick={() => setActiveSection('post-call-review')} className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200',
              activeSection === 'post-call-review' ? 'text-white shadow-lg shadow-[#216BE4]/20' : 'text-white/35 hover:text-white/60 hover:bg-white/[0.03]'
            )} style={activeSection === 'post-call-review' ? { background: 'linear-gradient(135deg, #216BE4, #1a5bc7)' } : {}}>
              <span className="text-[15px]">📄</span><span>Post-Call</span>
            </button>
          )}
        </div>

        {/* Agent Status */}
        <div className={C + ' p-3.5'} style={{ background: cardBg }}>
          <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.15em] mb-3">Agents</p>
          <div className="space-y-2">
            {AGENTS.map(a => (
              <div key={a.id} className={cn('flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg transition-all',
                activeAgentId === a.id ? 'bg-emerald-500/[0.06]' : ''
              )}>
                <span className={cn('w-[7px] h-[7px] rounded-full flex-shrink-0 transition-all',
                  activeAgentId === a.id ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)] animate-pulse' : 'bg-white/[0.08]'
                )} />
                <span className="text-[13px]">{a.icon}</span>
                <span className={cn('text-[12px] truncate', activeAgentId === a.id ? 'text-emerald-400 font-medium' : 'text-white/30')}>{a.name}</span>
              </div>
            ))}
          </div>
          {callActive && (
            <div className="mt-3 pt-3 border-t border-white/[0.06] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-[7px] h-[7px] rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                <span className="text-[11px] text-emerald-400 font-semibold">Call Active</span>
              </div>
              <span className="text-[12px] text-emerald-400 font-mono tabular-nums font-semibold">
                {String(Math.floor(callDuration / 60)).padStart(2, '0')}:{String(callDuration % 60).padStart(2, '0')}
              </span>
            </div>
          )}
        </div>

        {/* Recent Calls */}
        {callHistory.length > 0 && (
          <div className={C + ' p-3.5'} style={{ background: cardBg }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.15em]">Recent Calls</p>
              <span className="text-[10px] text-white/15">{totalCalls}</span>
            </div>
            <div className="space-y-1">
              {callHistory.slice(0, 4).map(call => (
                <button key={call.id} onClick={() => handleViewCall(call)} className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-white/[0.03] transition-all text-left group">
                  <span className={cn('w-[6px] h-[6px] rounded-full flex-shrink-0',
                    call.status === 'synced' ? 'bg-[#216BE4]' : call.status === 'completed' ? 'bg-amber-400' : 'bg-white/10'
                  )} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] text-white/40 group-hover:text-white/60 truncate transition-colors">{call.phoneNumber || 'Demo Call'}</p>
                  </div>
                  <span className="text-[10px] text-white/15 font-mono tabular-nums">
                    {call.duration ? Math.floor(call.duration / 60) + ':' + String(call.duration % 60).padStart(2, '0') : '--'}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* User Profile (bottom) */}
        <div className="mt-auto">
          <div className={C + ' p-3 flex items-center gap-2.5'} style={{ background: cardBg }}>
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white" style={{ background: 'linear-gradient(135deg, #216BE4, #6366f1)' }}>A</div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-white/50 font-medium truncate">Aetheryx User</p>
              <p className="text-[9px] text-white/20 truncate">Pro Plan</p>
            </div>
            <span className="text-white/10 text-[10px]">•••</span>
          </div>
        </div>
      </aside>

      {/* ══════ CENTER CONTENT ══════ */}
      <main className="flex-1 flex flex-col min-w-0 pb-14 md:pb-0 overflow-hidden" style={{ background: '#060a14' }}>

        {/* Section content */}
        <div className="flex-1 overflow-y-auto p-3 md:p-4">

          {/* Welcome banner (only on live-call) */}
          {activeSection === 'live-call' && !callActive && (
            <div className={C + ' mb-4 overflow-hidden relative'} style={{ background: 'linear-gradient(135deg, #0c1a35 0%, #0f1d3a 50%, #0c1530 100%)' }}>
              <div className="absolute inset-0 opacity-20" style={{ background: 'radial-gradient(ellipse at 30% 50%, rgba(33,107,228,0.3) 0%, transparent 70%)' }} />
              <div className="relative p-5 md:p-6">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium mb-3" style={{ background: 'rgba(33,107,228,0.15)', color: '#5b9cf5', border: '1px solid rgba(33,107,228,0.2)' }}>
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                  Welcome to Aetheryx AI
                </span>
                <h2 className="text-lg md:text-xl font-bold mb-1" style={{ fontFamily: "'Instrument Serif', serif" }}>Your AI Sales Co-Pilot</h2>
                <p className="text-[13px] text-white/40 max-w-lg">Real-time call intelligence, prospect research, objection handling, and post-call automation — all powered by AI agents working together.</p>
                <div className="flex gap-2 mt-4">
                  <button onClick={() => setActiveSection('live-call')} className="px-4 py-2 rounded-xl text-[12px] font-semibold text-white transition-all hover:shadow-lg hover:shadow-[#216BE4]/20" style={{ background: 'linear-gradient(135deg, #216BE4, #1a5bc7)' }}>Start a Call</button>
                  <button onClick={() => setActiveSection('analytics')} className="px-4 py-2 rounded-xl text-[12px] font-medium text-white/40 hover:text-white/60 transition-all" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>View Analytics</button>
                </div>
              </div>
            </div>
          )}

          {/* Section header */}
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <div className="flex items-center gap-3">
              <div className="md:hidden w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, #216BE4, #1a5bc7)' }}>
                <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
              </div>
              <h1 className="text-[15px] md:text-base font-semibold" style={{ fontFamily: "'Instrument Serif', serif" }}>
                {{ 'live-call': 'Live Call Dashboard', 'call-history': 'Call History', 'analytics': 'Analytics', 'post-call-review': 'Post-Call Review', 'configuration': 'Configuration' }[activeSection]}
              </h1>
              {callActive && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold" style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)', color: '#34d399' }}>
                  <span className="w-[5px] h-[5px] rounded-full bg-emerald-400 animate-pulse" /> {callStatus}
                </span>
              )}
            </div>
            {activeAgentId && (
              <span className="text-[10px] text-emerald-400 flex items-center gap-1.5 font-medium">
                <span className="w-[5px] h-[5px] rounded-full bg-emerald-400 animate-pulse" />
                {(AGENTS.find(a => a.id === activeAgentId) || { name: 'Processing' }).name}
              </span>
            )}
          </div>

          {/* Active section */}
          <React.Suspense fallback={<SectionFallback />}>
            {activeSection === 'live-call' && <LiveCallDashboard callActive={callActive} transcript={transcript} researchData={researchData} strategyData={strategyData} onStartCall={handleStartCall} onEndCall={handleEndCall} onAddTranscript={handleAddTranscript} onResearchData={setResearchData} onStrategyData={setStrategyData} activeAgentId={activeAgentId} setActiveAgentId={setActiveAgentId} useSampleData={useSampleData} callDuration={callDuration} callStatus={callStatus} phoneNumber={phoneNumber} onPhoneNumberChange={setPhoneNumber} twilioSid={config.twilioSid} twilioAuth={config.twilioAuth} fromNumber={config.fromNumber} deepgramKey={config.deepgramKey} repPhone={config.repPhone} onNavigateToConfig={() => setActiveSection('configuration')} />}
            {activeSection === 'post-call-review' && <PostCallReview transcript={transcript} postCallData={postCallData} syncData={syncData} onPostCallData={handlePostCallData} onSyncData={handleSyncData} activeAgentId={activeAgentId} setActiveAgentId={setActiveAgentId} useSampleData={useSampleData} autoTrigger={autoTriggerPostCall} />}
            {activeSection === 'call-history' && <CallHistory callHistory={callHistory} onViewCall={handleViewCall} />}
            {activeSection === 'analytics' && <AnalyticsDashboard callHistory={callHistory} useSampleData={useSampleData} />}
            {activeSection === 'configuration' && <Configuration onConfigSaved={cfg => setConfig(cfg)} />}
          </React.Suspense>
        </div>

        {/* Bottom chat bar — SocietyAI "Ask Sai anything" style */}
        <div className="flex-shrink-0 p-3 md:p-4 pt-0">
          <div className={C + ' flex items-center gap-3 px-4 py-2'} style={{ background: cardBg }}>
            <svg className="w-4 h-4 flex-shrink-0" style={{ color: '#216BE4' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3Z"/></svg>
            <Input value={globalChatInput} onChange={e => setGlobalChatInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleGlobalChatSend() } }} placeholder="Ask Aetheryx anything..." className="flex-1 h-9 text-[13px] bg-transparent border-0 shadow-none focus-visible:ring-0 placeholder:text-white/20 text-white/70" disabled={globalChatLoading} />
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-[10px] text-white/15 hidden sm:block">AI Co-Pilot</span>
              <Button onClick={handleGlobalChatSend} disabled={!globalChatInput.trim() || globalChatLoading} size="sm" className="h-8 w-8 p-0 rounded-xl" style={{ background: '#216BE4' }}>
                <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              </Button>
            </div>
          </div>
        </div>
      </main>

      {/* ══════ RIGHT PANEL ══════ */}
      <aside className="hidden xl:flex flex-col w-[340px] flex-shrink-0 p-3 gap-2.5 overflow-y-auto" style={{ background: panelBg }}>

        {/* Agent Pulse */}
        <div className={C + ' p-4'} style={{ background: cardBg }}>
          <div className="flex items-center justify-between mb-4">
            <p className="text-[14px] font-bold" style={{ fontFamily: "'Instrument Serif', serif" }}>Agent Pulse</p>
            <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-full" style={{ background: 'rgba(52,211,153,0.08)', color: '#34d399', border: '1px solid rgba(52,211,153,0.15)' }}>
              <span className="w-[5px] h-[5px] rounded-full bg-emerald-400 animate-pulse" /> Live
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { icon: '📞', val: totalCalls, label: 'Total Calls' },
              { icon: '🔗', val: syncedCalls, label: 'Deals Synced' },
              { icon: '⏱️', val: avgDur > 0 ? Math.floor(avgDur / 60) + ':' + String(avgDur % 60).padStart(2, '0') : '--:--', label: 'Avg Duration' },
              { icon: '📧', val: emailsSent, label: 'Emails Sent' },
            ].map(s => (
              <div key={s.label} className={C + ' p-3'} style={{ background: 'rgba(255,255,255,0.015)' }}>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[13px]">{s.icon}</span>
                  <p className="text-[18px] font-bold tabular-nums" style={{ fontFamily: "'Instrument Serif', serif" }}>{s.val}</p>
                </div>
                <p className="text-[10px] text-white/25">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* AI Chat / Activity */}
        <div className={C + ' flex flex-col flex-1 min-h-0 overflow-hidden'} style={{ background: cardBg }}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{ background: 'rgba(33,107,228,0.12)' }}>
                <svg className="w-3 h-3" style={{ color: '#216BE4' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3Z"/></svg>
              </div>
              <span className="text-[12px] font-semibold" style={{ fontFamily: "'Instrument Serif', serif" }}>AI Assistant</span>
            </div>
            <span className="text-[9px] font-medium text-white/20 px-2 py-0.5 rounded-md" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.04)' }}>Always On</span>
          </div>

          {/* Context */}
          <div className="px-4 py-2 border-b border-white/[0.04] flex-shrink-0">
            <div className="flex items-center gap-2">
              <span className={cn('w-[5px] h-[5px] rounded-full', callActive ? 'bg-emerald-400 animate-pulse' : callHistory.length ? 'bg-[#216BE4]' : 'bg-white/10')} />
              <span className="text-[10px] text-white/25">
                {callActive ? 'Live call context' : callHistory.length ? `${callHistory.length} call${callHistory.length !== 1 ? 's' : ''} in memory` : 'No context yet'}
              </span>
            </div>
          </div>

          {/* Messages */}
          <div ref={globalChatScrollRef} className="flex-1 overflow-y-auto p-3 space-y-2">
            {!globalChatMessages.length && (
              <div className="flex flex-col items-center justify-center py-10 px-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: 'rgba(33,107,228,0.05)' }}>
                  <svg className="w-5 h-5" style={{ color: 'rgba(33,107,228,0.2)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3Z"/></svg>
                </div>
                <p className="text-[11px] text-white/25 text-center font-medium">Your AI sales assistant</p>
                <p className="text-[10px] text-white/12 text-center mt-1">Ask about calls, coaching, or follow-ups.</p>
                <div className="flex flex-wrap gap-1.5 mt-4 justify-center">
                  {['Summarize my last call', 'Prep for a follow-up', 'Coaching tips'].map(q => (
                    <button key={q} onClick={() => setGlobalChatInput(q)} className="text-[9px] px-2.5 py-1 rounded-full text-white/20 hover:text-white/40 transition-colors" style={{ border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.015)' }}>{q}</button>
                  ))}
                </div>
              </div>
            )}
            {globalChatMessages.map(m => (
              <div key={m.id} className={'flex ' + (m.role === 'user' ? 'justify-end' : 'justify-start')}>
                <div className={cn('max-w-[88%] px-3 py-2 text-[11px] leading-relaxed',
                  m.role === 'user' ? 'rounded-2xl rounded-br-md text-white' : 'rounded-2xl rounded-bl-md text-white/60'
                )} style={m.role === 'user' ? { background: '#216BE4' } : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <p className="whitespace-pre-wrap">{m.text}</p>
                </div>
              </div>
            ))}
            {globalChatLoading && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-md px-3 py-2.5 flex items-center gap-1.5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#216BE4] animate-pulse" /><span className="w-1.5 h-1.5 rounded-full bg-[#216BE4] animate-pulse [animation-delay:0.2s]" /><span className="w-1.5 h-1.5 rounded-full bg-[#216BE4] animate-pulse [animation-delay:0.4s]" />
                </div>
              </div>
            )}
          </div>

          {/* Chat input */}
          <div className="p-3 border-t border-white/[0.04] flex-shrink-0">
            <div className="flex gap-2 items-center rounded-xl px-3 py-1" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <Input value={globalChatInput} onChange={e => setGlobalChatInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleGlobalChatSend() } }} placeholder="Ask the AI..." className="flex-1 h-8 text-[11px] bg-transparent border-0 shadow-none focus-visible:ring-0 placeholder:text-white/12 text-white/60" disabled={globalChatLoading} />
              <Button onClick={handleGlobalChatSend} disabled={!globalChatInput.trim() || globalChatLoading} size="sm" className="h-7 w-7 p-0 rounded-lg flex-shrink-0" style={{ background: '#216BE4' }}>
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
            <button key={item.key} onClick={() => setActiveSection(item.key)} className={cn('flex flex-col items-center gap-1 px-4 py-1.5 rounded-xl transition-all', activeSection === item.key ? 'text-[#216BE4]' : 'text-white/20')}>
              <span className="text-[18px]">{item.icon}</span>
              <span className="text-[9px] font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}
