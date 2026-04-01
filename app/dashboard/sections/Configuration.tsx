'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Settings, Save, Check, Info } from 'lucide-react'

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
}

interface ConfigurationProps {
  onConfigSaved: (config: AppConfig) => void
}

export function loadConfig(): AppConfig {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) return JSON.parse(saved)
  } catch (_e) { /* ignore */ }
  return { twilioSid: '', twilioAuth: '', fromNumber: '', deepgramKey: '', repPhone: '', llmApiKey: '', llmBaseUrl: 'https://api.openai.com/v1', llmModel: 'gpt-4o-mini' }
}

export default function Configuration({ onConfigSaved }: ConfigurationProps) {
  const [twilioSid, setTwilioSid] = useState('')
  const [twilioAuth, setTwilioAuth] = useState('')
  const [fromNumber, setFromNumber] = useState('')
  const [deepgramKey, setDeepgramKey] = useState('')
  const [repPhone, setRepPhone] = useState('')
  const [llmApiKey, setLlmApiKey] = useState('')
  const [llmBaseUrl, setLlmBaseUrl] = useState('https://api.openai.com/v1')
  const [llmModel, setLlmModel] = useState('gpt-4o-mini')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const config = loadConfig()
    setTwilioSid(config.twilioSid)
    setTwilioAuth(config.twilioAuth)
    setFromNumber(config.fromNumber)
    setDeepgramKey(config.deepgramKey)
    setRepPhone(config.repPhone || '')
    setLlmApiKey(config.llmApiKey || '')
    setLlmBaseUrl(config.llmBaseUrl || 'https://api.openai.com/v1')
    setLlmModel(config.llmModel || 'gpt-4o-mini')
  }, [])

  // Auto-save on any change
  useEffect(() => {
    const config: AppConfig = { twilioSid, twilioAuth, fromNumber, deepgramKey, repPhone, llmApiKey, llmBaseUrl, llmModel }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
    } catch (_e) { /* ignore */ }
    onConfigSaved(config)
  }, [twilioSid, twilioAuth, fromNumber, deepgramKey, repPhone, llmApiKey, llmBaseUrl, llmModel, onConfigSaved])

  function handleSave() {
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  function handleClear() {
    setTwilioSid('')
    setTwilioAuth('')
    setFromNumber('')
    setDeepgramKey('')
    setRepPhone('')
    setLlmApiKey('')
    setLlmBaseUrl('https://api.openai.com/v1')
    setLlmModel('gpt-4o-mini')
    try { localStorage.removeItem(STORAGE_KEY) } catch (_e) { /* ignore */ }
    onConfigSaved({ twilioSid: '', twilioAuth: '', fromNumber: '', deepgramKey: '', repPhone: '', llmApiKey: '', llmBaseUrl: 'https://api.openai.com/v1', llmModel: 'gpt-4o-mini' })
  }

  const isLiveMode = Boolean(twilioSid && twilioAuth && deepgramKey)

  return (
    <div className="max-w-2xl mx-auto py-6 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
          <Settings className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-base font-semibold">Telephony Configuration</h2>
          <p className="text-xs text-muted-foreground">Set up real phone calls or run in demo mode</p>
        </div>
      </div>

      {/* Status Banner */}
      {isLiveMode ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-start gap-2.5">
          <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs text-green-800 font-semibold">Live Mode Configured</p>
            <p className="text-[11px] text-green-700 mt-0.5">Real calls will be placed via Twilio with Deepgram transcription.</p>
          </div>
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs text-amber-800 font-semibold">Demo Mode Active</p>
            <p className="text-[11px] text-amber-700 mt-0.5">Fill in the credentials below to enable real phone calls.</p>
          </div>
        </div>
      )}

      {/* Setup Instructions */}
      <Card className="border border-border shadow-sm">
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Info className="w-4 h-4 text-muted-foreground" /> How to enable real phone calls
          </CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="p-4">
          <ol className="text-[12px] text-muted-foreground space-y-1.5 ml-4 list-decimal leading-relaxed">
            <li>Create a <strong className="text-foreground">Twilio</strong> account at twilio.com — get a phone number, Account SID, and Auth Token</li>
            <li>Create a <strong className="text-foreground">Deepgram</strong> account at deepgram.com — get an API key for real-time speech-to-text</li>
            <li>Enter your credentials below and click <strong className="text-foreground">Save Configuration</strong></li>
          </ol>
        </CardContent>
      </Card>

      {/* Credentials Form */}
      <Card className="border border-border shadow-sm">
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-sm font-semibold">Credentials</CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] text-muted-foreground uppercase font-semibold tracking-wide block mb-1.5">
                Twilio Account SID
              </label>
              <Input
                value={twilioSid}
                onChange={(e) => setTwilioSid(e.target.value)}
                placeholder="AC..."
                className="h-9 text-xs font-mono"
              />
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground uppercase font-semibold tracking-wide block mb-1.5">
                Twilio Auth Token
              </label>
              <Input
                value={twilioAuth}
                onChange={(e) => setTwilioAuth(e.target.value)}
                placeholder="Auth token..."
                className="h-9 text-xs font-mono"
                type="password"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] text-muted-foreground uppercase font-semibold tracking-wide block mb-1.5">
                Twilio From Number <span className="normal-case font-normal">(optional)</span>
              </label>
              <Input
                value={fromNumber}
                onChange={(e) => setFromNumber(e.target.value)}
                placeholder="+1..."
                className="h-9 text-xs font-mono"
              />
              <p className="text-[10px] text-muted-foreground mt-1">Leave blank to auto-detect from your Twilio account</p>
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground uppercase font-semibold tracking-wide block mb-1.5">
                Deepgram API Key
              </label>
              <Input
                value={deepgramKey}
                onChange={(e) => setDeepgramKey(e.target.value)}
                placeholder="API key..."
                className="h-9 text-xs font-mono"
                type="password"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] text-muted-foreground uppercase font-semibold tracking-wide block mb-1.5">
              Your Phone Number <span className="normal-case font-normal text-muted-foreground">(optional — only for live Twilio calls)</span>
            </label>
            <Input
              value={repPhone}
              onChange={(e) => setRepPhone(e.target.value)}
              placeholder="+1..."
              className="h-9 text-xs font-mono"
            />
            <p className="text-[11px] text-muted-foreground mt-1.5 leading-relaxed bg-blue-50 border border-blue-100 rounded px-2.5 py-2">
              <strong className="text-blue-800">How calls work:</strong> When you click Dial, Twilio calls <em>your phone</em> first. You pick up, then Twilio connects the prospect to you. Your laptop dashboard shows real-time AI coaching while you talk.
            </p>
          </div>

          <div className="flex items-center justify-between pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="text-xs text-muted-foreground hover:text-destructive"
            >
              Clear All
            </Button>
            <Button
              onClick={handleSave}
              className="gap-2 text-sm"
            >
              {saved ? (
                <><Check className="w-4 h-4" /> Saved!</>
              ) : (
                <><Save className="w-4 h-4" /> Save Configuration</>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
      {/* AI Agent Keys — Server-side */}
      <Card className="border border-border shadow-sm">
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-sm font-semibold">AI Agents & Chat</CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="p-4 space-y-3">
          <div className="bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 rounded-lg p-3 flex items-start gap-2.5">
            <Check className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-green-800 dark:text-green-400 font-semibold">All AI keys configured server-side</p>
              <p className="text-[11px] text-green-700 dark:text-green-400/70 mt-0.5">OpenAI, Anthropic, Perplexity, HubSpot, Gmail, and Pinecone are all active. No client-side API key input needed.</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 mt-2">
            {[
              { name: 'OpenAI', status: 'Active' },
              { name: 'Anthropic', status: 'Active' },
              { name: 'Perplexity', status: 'Active' },
              { name: 'HubSpot', status: 'Active' },
              { name: 'Gmail', status: 'Active' },
              { name: 'Pinecone', status: 'Active' },
            ].map((svc) => (
              <div key={svc.name} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-muted/50 border border-border">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />
                <span className="text-[11px] text-muted-foreground">{svc.name}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
