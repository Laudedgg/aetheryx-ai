'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Check, Info, Phone, Wifi } from 'lucide-react'

const STORAGE_KEY = 'salesmaster_config'

export interface AppConfig {
  twilioSid: string
  twilioAuth: string
  fromNumber: string
  deepgramKey: string
  repPhone: string
  llmApiKey: string
  llmBaseUrl: string
  llmModel: string
  liveMode?: boolean
}

interface ConfigurationProps {
  onConfigSaved: (config: AppConfig) => void
}

export function loadConfig(): AppConfig {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) return JSON.parse(saved)
  } catch (_e) { /* ignore */ }
  return { twilioSid: 'server-managed', twilioAuth: 'server-managed', fromNumber: 'server-managed', deepgramKey: 'server-managed', repPhone: '', llmApiKey: '', llmBaseUrl: 'https://api.openai.com/v1', llmModel: 'gpt-4o-mini', liveMode: true }
}

export default function Configuration({ onConfigSaved }: ConfigurationProps) {
  const [liveMode, setLiveMode] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const config = loadConfig()
    setLiveMode(config.liveMode !== false)
    // Auto-fetch telephony keys on first load if live mode
    if (config.liveMode !== false) {
      fetch('/api/config/telephony').then(r => r.json()).then(data => {
        if (data.success) {
          const liveConfig = { ...config, ...data.config, liveMode: true }
          try { localStorage.setItem(STORAGE_KEY, JSON.stringify(liveConfig)) } catch (_e) {}
          onConfigSaved(liveConfig)
        }
      }).catch(() => {})
    }
  }, [])

  function toggleMode() {
    const newMode = !liveMode
    setLiveMode(newMode)

    // When switching to live, fetch keys from server API
    const config: AppConfig = {
      twilioSid: newMode ? 'server-managed' : '',
      twilioAuth: newMode ? 'server-managed' : '',
      fromNumber: newMode ? 'server-managed' : '',
      deepgramKey: newMode ? 'server-managed' : '',
      repPhone: '',
      llmApiKey: '',
      llmBaseUrl: 'https://api.openai.com/v1',
      llmModel: 'gpt-4o-mini',
      liveMode: newMode,
    }

    // Fetch actual keys from server when enabling live mode
    if (newMode) {
      fetch('/api/config/telephony').then(r => r.json()).then(data => {
        if (data.success) {
          const liveConfig = { ...config, ...data.config }
          try { localStorage.setItem(STORAGE_KEY, JSON.stringify(liveConfig)) } catch (_e) {}
          onConfigSaved(liveConfig)
        }
      }).catch(() => {})
    }

    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(config)) } catch (_e) {}
    onConfigSaved(config)
  }

  if (!mounted) return null

  const services = [
    { name: 'OpenAI', desc: 'Post-Call Intelligence, CRM Sync', active: true },
    { name: 'Anthropic', desc: 'Sales Strategy Agent', active: true },
    { name: 'Perplexity', desc: 'Research Agent', active: true },
    { name: 'HubSpot', desc: 'CRM Contact & Deal Sync', active: true },
    { name: 'Gmail', desc: 'Follow-up Email Sending', active: true },
    { name: 'Pinecone', desc: 'Knowledge Base / RAG', active: true },
    { name: 'Twilio', desc: 'Live Phone Calls', active: liveMode },
    { name: 'Deepgram', desc: 'Real-time Transcription', active: liveMode },
  ]

  return (
    <div className="max-w-2xl mx-auto py-6 space-y-5">

      {/* Mode Toggle */}
      <Card className="border border-border shadow-sm overflow-hidden">
        <div className="p-5">
          <h2 className="text-base font-semibold font-display mb-1">Call Mode</h2>
          <p className="text-xs text-muted-foreground mb-5">Switch between simulated demo calls and real Twilio-powered calls.</p>

          <div className="grid grid-cols-2 gap-3">
            {/* Demo Mode */}
            <button
              onClick={() => { if (liveMode) toggleMode() }}
              className={`relative rounded-xl border-2 p-4 text-left transition-all ${
                !liveMode
                  ? 'border-primary bg-primary/5 shadow-md shadow-primary/10'
                  : 'border-border hover:border-muted-foreground/30 hover:bg-muted/30'
              }`}
            >
              {!liveMode && <span className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />}
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                <Wifi className="w-5 h-5 text-primary" />
              </div>
              <p className="text-sm font-semibold">Demo Mode</p>
              <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                Simulated calls with pre-recorded conversations. AI agents analyze in real time. No phone needed.
              </p>
            </button>

            {/* Live Mode */}
            <button
              onClick={() => { if (!liveMode) toggleMode() }}
              className={`relative rounded-xl border-2 p-4 text-left transition-all ${
                liveMode
                  ? 'border-green-500 bg-green-500/5 shadow-md shadow-green-500/10'
                  : 'border-border hover:border-muted-foreground/30 hover:bg-muted/30'
              }`}
            >
              {liveMode && <span className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />}
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center mb-3">
                <Phone className="w-5 h-5 text-green-500" />
              </div>
              <p className="text-sm font-semibold">Live Mode</p>
              <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                Real phone calls via Twilio + Deepgram transcription. All keys are pre-configured.
              </p>
            </button>
          </div>
        </div>
      </Card>

      {/* Current Mode Status */}
      <Card className="border border-border shadow-sm">
        <CardContent className="p-4">
          {liveMode ? (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Check className="w-4 h-4 text-green-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-green-400">Live Mode Active</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Twilio + Deepgram credentials loaded. Real calls will be placed when you dial.</p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Info className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-primary">Demo Mode Active</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Using simulated conversations. Switch to Live Mode for real phone calls.</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* All Services Status */}
      <Card className="border border-border shadow-sm">
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-sm font-semibold">Service Status</CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="p-4">
          <div className="grid grid-cols-2 gap-2.5">
            {services.map((svc) => (
              <div key={svc.name} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-muted/30 border border-border">
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${svc.active ? 'bg-green-400' : 'bg-muted-foreground/30'}`} />
                <div className="min-w-0">
                  <p className="text-xs font-medium truncate">{svc.name}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{svc.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

    </div>
  )
}
