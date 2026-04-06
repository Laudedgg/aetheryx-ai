'use client'

import React, { useState, useEffect } from 'react'

const STORAGE_KEY = 'salesmaster_config'
const serif: React.CSSProperties = { fontFamily: "'Instrument Serif', serif" }
const cardStyle: React.CSSProperties = { background: '#0c1120', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16 }

export interface AppConfig {
  twilioSid: string; twilioAuth: string; fromNumber: string; deepgramKey: string; repPhone: string
  llmApiKey: string; llmBaseUrl: string; llmModel: string; liveMode?: boolean
}

interface ConfigurationProps { onConfigSaved: (config: AppConfig) => void }

export function loadConfig(): AppConfig {
  try { const s = localStorage.getItem(STORAGE_KEY); if (s) return JSON.parse(s) } catch {}
  return { twilioSid:'server-managed',twilioAuth:'server-managed',fromNumber:'server-managed',deepgramKey:'server-managed',repPhone:'',llmApiKey:'',llmBaseUrl:'https://api.openai.com/v1',llmModel:'gpt-4o-mini',liveMode:true }
}

export default function Configuration({ onConfigSaved }: ConfigurationProps) {
  const [liveMode, setLiveMode] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const config = loadConfig()
    setLiveMode(config.liveMode !== false)
    if (config.liveMode !== false) {
      fetch('/api/config/telephony').then(r=>r.json()).then(data => {
        if (data.success) { const lc = {...config,...data.config,liveMode:true}; try{localStorage.setItem(STORAGE_KEY,JSON.stringify(lc))}catch{}; onConfigSaved(lc) }
      }).catch(()=>{})
    }
  }, [])

  function toggleMode() {
    const newMode = !liveMode; setLiveMode(newMode)
    const config: AppConfig = { twilioSid:newMode?'server-managed':'',twilioAuth:newMode?'server-managed':'',fromNumber:newMode?'server-managed':'',deepgramKey:newMode?'server-managed':'',repPhone:'',llmApiKey:'',llmBaseUrl:'https://api.openai.com/v1',llmModel:'gpt-4o-mini',liveMode:newMode }
    if (newMode) {
      fetch('/api/config/telephony').then(r=>r.json()).then(data => {
        if (data.success) { const lc={...config,...data.config}; try{localStorage.setItem(STORAGE_KEY,JSON.stringify(lc))}catch{}; onConfigSaved(lc) }
      }).catch(()=>{})
    }
    try{localStorage.setItem(STORAGE_KEY,JSON.stringify(config))}catch{}; onConfigSaved(config)
  }

  if (!mounted) return null

  const services = [
    { name:'OpenAI', desc:'Post-Call & Strategy', active:true, icon:'🤖' },
    { name:'Perplexity', desc:'Research Agent', active:true, icon:'🔍' },
    { name:'HubSpot', desc:'CRM Sync', active:true, icon:'🟠' },
    { name:'Gmail', desc:'Follow-up Emails', active:true, icon:'📧' },
    { name:'Pinecone', desc:'Knowledge Base', active:true, icon:'🗄️' },
    { name:'Twilio', desc:'Live Calls', active:liveMode, icon:'📞' },
    { name:'Deepgram', desc:'Transcription', active:liveMode, icon:'🎙️' },
  ]

  return (
    <div className="max-w-2xl mx-auto py-4 space-y-3">

      {/* Mode Toggle */}
      <div style={cardStyle} className="p-5">
        <h2 className="text-base font-bold text-white/70 mb-1" style={serif}>Call Mode</h2>
        <p className="text-[11px] text-white/25 mb-5">Switch between simulated demo calls and real Twilio-powered calls.</p>

        <div className="grid grid-cols-2 gap-3">
          {/* Demo */}
          <button onClick={() => { if (liveMode) toggleMode() }}
            className="relative rounded-2xl p-4 text-left transition-all"
            style={{
              background: !liveMode ? 'rgba(33,107,228,0.06)' : 'rgba(255,255,255,0.015)',
              border: !liveMode ? '2px solid rgba(33,107,228,0.4)' : '2px solid rgba(255,255,255,0.06)',
              boxShadow: !liveMode ? '0 0 20px rgba(33,107,228,0.1)' : 'none',
            }}
          >
            {!liveMode && <span className="absolute top-3 right-3 w-2 h-2 rounded-full animate-pulse" style={{background:'#216BE4',boxShadow:'0 0 8px rgba(33,107,228,0.5)'}} />}
            <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{background:'rgba(33,107,228,0.1)'}}>
              <span className="text-[18px]">📡</span>
            </div>
            <p className="text-[13px] font-semibold text-white/70">Demo Mode</p>
            <p className="text-[10px] text-white/25 mt-1 leading-relaxed">Simulated calls with AI agents. No phone needed.</p>
          </button>

          {/* Live */}
          <button onClick={() => { if (!liveMode) toggleMode() }}
            className="relative rounded-2xl p-4 text-left transition-all"
            style={{
              background: liveMode ? 'rgba(52,211,153,0.04)' : 'rgba(255,255,255,0.015)',
              border: liveMode ? '2px solid rgba(52,211,153,0.3)' : '2px solid rgba(255,255,255,0.06)',
              boxShadow: liveMode ? '0 0 20px rgba(52,211,153,0.08)' : 'none',
            }}
          >
            {liveMode && <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-emerald-400 animate-pulse" style={{boxShadow:'0 0 8px rgba(52,211,153,0.5)'}} />}
            <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{background:'rgba(52,211,153,0.08)'}}>
              <span className="text-[18px]">📞</span>
            </div>
            <p className="text-[13px] font-semibold text-white/70">Live Mode</p>
            <p className="text-[10px] text-white/25 mt-1 leading-relaxed">Real calls via Twilio + Deepgram. All keys pre-configured.</p>
          </button>
        </div>
      </div>

      {/* Status */}
      <div style={cardStyle} className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{background: liveMode ? 'rgba(52,211,153,0.08)' : 'rgba(33,107,228,0.08)'}}>
            <span className="text-[14px]">{liveMode ? '✅' : '💡'}</span>
          </div>
          <div>
            <p className="text-[13px] font-semibold" style={{color: liveMode ? '#34d399' : '#216BE4'}}>{liveMode ? 'Live Mode Active' : 'Demo Mode Active'}</p>
            <p className="text-[10px] text-white/25 mt-0.5">{liveMode ? 'Twilio + Deepgram credentials loaded. Real calls ready.' : 'Using simulated conversations. Switch to Live for real calls.'}</p>
          </div>
        </div>
      </div>

      {/* Services */}
      <div style={cardStyle} className="p-4">
        <p className="text-[13px] font-semibold text-white/60 mb-3" style={serif}>Service Status</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {services.map(s => (
            <div key={s.name} className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl" style={{background:'rgba(255,255,255,0.015)',border:'1px solid rgba(255,255,255,0.04)'}}>
              <span className={`w-[6px] h-[6px] rounded-full flex-shrink-0 ${s.active ? 'bg-emerald-400' : 'bg-white/10'}`} style={s.active ? {boxShadow:'0 0 6px rgba(52,211,153,0.4)'} : {}} />
              <div className="min-w-0">
                <p className="text-[11px] text-white/50 font-medium truncate">{s.icon} {s.name}</p>
                <p className="text-[9px] text-white/20 truncate">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
