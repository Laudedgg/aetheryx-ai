'use client'

import React, { useState, useEffect } from 'react'
import { callAIAgent } from '@/lib/aiAgent'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { FiFileText, FiSend, FiAlertCircle, FiRefreshCw, FiCheckCircle, FiZap } from 'react-icons/fi'

const POSTCALL_AGENT_ID = '69b03c5393c7264ffc5fcc0d'
const CRM_AGENT_ID = '69b03c652f39e130540f1d49'

interface TranscriptLine {
  id: string
  speaker: 'rep' | 'prospect'
  text: string
  timestamp: string
}

interface PostCallReviewProps {
  transcript: TranscriptLine[]
  postCallData: any
  syncData: any
  onPostCallData: (data: any) => void
  onSyncData: (data: any) => void
  activeAgentId: string | null
  setActiveAgentId: (id: string | null) => void
  useSampleData: boolean
  autoTrigger?: boolean
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

function LoadingPlaceholder({ count }: { count: number }) {
  return (
    <div className="space-y-3 pt-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse bg-muted rounded h-16 w-full" />
      ))}
    </div>
  )
}

const SAMPLE_POSTCALL = {
  summary: { client_name: 'Sarah Johnson', company: 'Acme Corp', call_outcome: 'Positive - Prospect interested in scheduling a demo', key_points: '- Discussed workflow automation challenges\n- Prospect currently uses manual processes for 60% of data entry\n- Budget allocated for Q2 tool evaluation\n- Decision involves VP of Engineering approval', pain_points: '- Manual data entry across 5+ systems\n- No real-time visibility into workflow bottlenecks\n- Scaling automation rules requires developer involvement', next_steps: '- Schedule product demo for next Tuesday\n- Send pricing sheet for Enterprise tier\n- Prepare custom ROI analysis based on their 500-user count\n- Connect with VP of Engineering for technical validation' },
  deal_probability: { score: '72%', positive_signals: '- Budget confirmed for Q2\n- Decision maker engaged on call\n- Technical fit with existing stack\n- Timeline aligned (60-day implementation window)', negative_signals: '- Competitor evaluation in progress (Zapier Enterprise)\n- Procurement process may add 2-3 weeks', risk_factors: '- VP of Engineering approval required\n- Integration complexity with legacy ERP system' },
  follow_up_email: { subject: 'Great connecting today - Next steps for Acme Corp workflow automation', body: 'Hi Sarah,\n\nThank you for taking the time to discuss your workflow automation challenges today. I was impressed by the scale of operations at Acme Corp and can see how our platform could make a significant impact.\n\nAs discussed, here are the next steps:\n\n1. Product Demo: I will send a calendar invite for next Tuesday at 2pm PT\n2. Pricing: Attached is our Enterprise tier pricing sheet\n3. ROI Analysis: I will prepare a custom analysis based on your 500-user environment\n\nLooking forward to our continued conversation!\n\nBest regards', recipient_suggestion: 'sarah.johnson@acmecorp.com' }
}

const SAMPLE_SYNC = {
  hubspot_sync: { contact_status: 'Updated existing contact', contact_id: 'HS-28491', deal_status: 'Created new deal: Acme Corp - Enterprise License', deal_id: 'DEAL-8842', notes_added: 'Call notes and AI summary added to contact timeline' },
  email_status: { sent: 'true', recipient: 'sarah.johnson@acmecorp.com', subject: 'Great connecting today - Next steps for Acme Corp workflow automation', timestamp: '2025-03-10T14:30:00Z' },
  sync_summary: 'Successfully synced call data to HubSpot and sent follow-up email. Contact and deal records updated with call notes, AI-generated summary, and deal probability score.'
}

export default function PostCallReview(props: PostCallReviewProps) {
  try {
    return <PostCallReviewInner {...props} />
  } catch (_e) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-destructive">Failed to render Post-Call Review. Please try refreshing the page.</p>
      </div>
    )
  }
}

function PostCallReviewInner({
  transcript, postCallData, syncData, onPostCallData, onSyncData,
  activeAgentId, setActiveAgentId, useSampleData, autoTrigger
}: PostCallReviewProps) {
  const [postCallLoading, setPostCallLoading] = useState(false)
  const [syncLoading, setSyncLoading] = useState(false)
  const [postCallError, setPostCallError] = useState('')
  const [syncError, setSyncError] = useState('')
  const [syncSuccess, setSyncSuccess] = useState('')
  const [editSubject, setEditSubject] = useState('')
  const [editBody, setEditBody] = useState('')
  const [editRecipient, setEditRecipient] = useState('')
  const [emailInitialized, setEmailInitialized] = useState(false)
  const [autoTriggered, setAutoTriggered] = useState(false)

  const safeTranscript = Array.isArray(transcript) ? transcript : []
  const displayPostCall = useSampleData ? SAMPLE_POSTCALL : postCallData
  const displaySync = useSampleData ? SAMPLE_SYNC : syncData

  // Auto-trigger report generation when navigating here after call ends
  useEffect(() => {
    if (autoTrigger && !autoTriggered && !postCallData && !postCallLoading && safeTranscript.length > 0) {
      setAutoTriggered(true)
      handleGenerateReport()
    }
  }, [autoTrigger, autoTriggered, postCallData, postCallLoading, safeTranscript.length])

  useEffect(() => {
    try {
      if (displayPostCall?.follow_up_email && !emailInitialized) {
        setEditSubject(safeText(displayPostCall.follow_up_email?.subject, ''))
        setEditBody(safeText(displayPostCall.follow_up_email?.body, ''))
        setEditRecipient(safeText(displayPostCall.follow_up_email?.recipient_suggestion, ''))
        setEmailInitialized(true)
      }
    } catch (_e) { /* ignore */ }
  }, [displayPostCall, emailInitialized])

  const handleGenerateReport = async () => {
    const transcriptText = safeTranscript.map(function(l) {
      return (l?.speaker === 'rep' ? 'Sales Rep' : 'Client') + ': ' + safeText(l?.text, '')
    }).join('\n')
    if (!transcriptText.trim()) return
    setPostCallLoading(true)
    setPostCallError('')
    setActiveAgentId(POSTCALL_AGENT_ID)
    try {
      const result = await callAIAgent('Generate a post-call intelligence report for this sales call transcript:\n\n' + transcriptText, POSTCALL_AGENT_ID)
      if (result?.success) {
        const data = result?.response?.result ?? {}
        onPostCallData(data)
        setEmailInitialized(false)
      } else {
        setPostCallError(safeText(result?.error, 'Report generation failed'))
      }
    } catch (err: any) {
      setPostCallError(safeText(err?.message, 'Network error'))
    } finally {
      setPostCallLoading(false)
      setActiveAgentId(null)
    }
  }

  const handleSync = async () => {
    if (!editRecipient.trim()) return
    let summaryText = ''
    try {
      if (displayPostCall?.summary) {
        summaryText = 'Client: ' + safeText(displayPostCall.summary?.client_name, '') +
          ', Company: ' + safeText(displayPostCall.summary?.company, '') +
          ', Outcome: ' + safeText(displayPostCall.summary?.call_outcome, '') +
          ', Key Points: ' + safeText(displayPostCall.summary?.key_points, '') +
          ', Next Steps: ' + safeText(displayPostCall.summary?.next_steps, '')
      }
    } catch (_e) { /* ignore */ }
    setSyncLoading(true)
    setSyncError('')
    setSyncSuccess('')
    setActiveAgentId(CRM_AGENT_ID)
    try {
      const result = await callAIAgent(
        'Sync this call data to HubSpot and send the follow-up email.\n\nCall Summary: ' + summaryText +
        '\n\nEmail Subject: ' + editSubject +
        '\nEmail Body: ' + editBody +
        '\nRecipient: ' + editRecipient,
        CRM_AGENT_ID
      )
      if (result?.success) {
        onSyncData(result?.response?.result ?? {})
        setSyncSuccess('Successfully synced to HubSpot and sent follow-up email')
      } else {
        setSyncError(safeText(result?.error, 'Sync failed'))
      }
    } catch (err: any) {
      setSyncError(safeText(err?.message, 'Network error'))
    } finally {
      setSyncLoading(false)
      setActiveAgentId(null)
    }
  }

  return (
    <div className="flex flex-col gap-4 h-[calc(100vh-88px)]">
      {/* Auto-trigger banner */}
      {autoTrigger && postCallLoading && (
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 flex items-center gap-2.5 flex-shrink-0">
          <FiZap className="w-4 h-4 text-primary animate-pulse" />
          <span className="text-xs text-primary font-semibold">Automatically generating post-call intelligence report...</span>
          <FiRefreshCw className="w-3.5 h-3.5 text-primary animate-spin ml-auto" />
        </div>
      )}

      {/* Call Transcript — collapsible, full width */}
      {safeTranscript.length > 0 && (
        <Card className="border border-border shadow-sm flex-shrink-0">
          <CardHeader className="py-2.5 px-4 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              📞 Call Transcript
              <Badge variant="outline" className="text-[10px] h-5 ml-1">{safeTranscript.length} lines</Badge>
            </CardTitle>
          </CardHeader>
          <Separator />
          <div className="max-h-[200px] overflow-y-auto px-4 py-3 space-y-2">
            {safeTranscript.map((line, i) => (
              <div key={line?.id || i} className="flex gap-2.5 items-start">
                <span className={`text-[10px] font-bold uppercase flex-shrink-0 w-16 pt-0.5 ${line?.speaker === 'rep' ? 'text-primary' : 'text-pink-400'}`}>
                  {line?.speaker === 'rep' ? 'Rep' : 'Client'}
                </span>
                <p className="text-xs text-foreground/70 leading-relaxed">{safeText(line?.text, '')}</p>
                <span className="text-[9px] text-muted-foreground/40 flex-shrink-0 ml-auto">{line?.timestamp || ''}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Summary + Email — 2 columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 min-h-0">

      {/* Left: Call Summary */}
      <div className="flex flex-col">
        <Card className="flex-1 flex flex-col border border-border overflow-hidden shadow-sm">
          <CardHeader className="py-2.5 px-4 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <FiFileText className="w-4 h-4 text-primary" /> Call Summary
            </CardTitle>
            <div className="flex items-center gap-2">
              {autoTrigger && <Badge variant="outline" className="text-[11px] h-5">Auto-Generated</Badge>}
              <Button size="sm" className="h-8 text-xs gap-1.5 px-3" onClick={handleGenerateReport} disabled={postCallLoading || safeTranscript.length === 0}>
                {postCallLoading ? <FiRefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                {postCallData ? 'Regenerate' : 'Generate Report'}
              </Button>
            </div>
          </CardHeader>
          <Separator />
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            {postCallError ? (
              <p className="text-xs text-destructive flex items-center gap-1.5 py-2">
                <FiAlertCircle className="w-3.5 h-3.5" /> {postCallError}
                <Button variant="ghost" size="sm" className="h-6 text-[11px] ml-2" onClick={handleGenerateReport}>Retry</Button>
              </p>
            ) : null}
            {postCallLoading ? <LoadingPlaceholder count={3} /> : null}
            {!postCallLoading && displayPostCall ? (
              <div className="space-y-3 pt-2">
                <div className="border border-border rounded-lg p-3">
                  <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Call Summary</h4>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                    <div><span className="text-muted-foreground">Client:</span> <span className="font-semibold">{safeText(displayPostCall?.summary?.client_name)}</span></div>
                    <div><span className="text-muted-foreground">Company:</span> <span className="font-semibold">{safeText(displayPostCall?.summary?.company)}</span></div>
                  </div>
                  {displayPostCall?.summary?.call_outcome ? (
                    <div className="mt-2">
                      <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Outcome:</span>
                      <p className="text-xs font-semibold text-green-600 mt-0.5">{safeText(displayPostCall.summary.call_outcome)}</p>
                    </div>
                  ) : null}
                  {displayPostCall?.summary?.key_points ? (
                    <div className="mt-2.5">
                      <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Key Points:</span>
                      <div className="mt-1">{renderLines(displayPostCall.summary.key_points)}</div>
                    </div>
                  ) : null}
                  {displayPostCall?.summary?.pain_points ? (
                    <div className="mt-2.5">
                      <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Pain Points:</span>
                      <div className="mt-1">{renderLines(displayPostCall.summary.pain_points)}</div>
                    </div>
                  ) : null}
                  {displayPostCall?.summary?.next_steps ? (
                    <div className="mt-2.5">
                      <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Next Steps:</span>
                      <div className="mt-1">{renderLines(displayPostCall.summary.next_steps)}</div>
                    </div>
                  ) : null}
                </div>
                <div className="border border-border rounded-lg p-3">
                  <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Deal Probability</h4>
                  <div className="text-center mb-2.5">
                    <span className="text-4xl font-bold text-primary font-mono">{safeText(displayPostCall?.deal_probability?.score)}</span>
                  </div>
                  {displayPostCall?.deal_probability?.positive_signals ? (
                    <div className="mt-2">
                      <span className="text-[11px] text-green-600 font-semibold">Positive Signals:</span>
                      <div className="mt-1">{renderLines(displayPostCall.deal_probability.positive_signals)}</div>
                    </div>
                  ) : null}
                  {displayPostCall?.deal_probability?.negative_signals ? (
                    <div className="mt-2">
                      <span className="text-[11px] text-destructive font-semibold">Negative Signals:</span>
                      <div className="mt-1">{renderLines(displayPostCall.deal_probability.negative_signals)}</div>
                    </div>
                  ) : null}
                  {displayPostCall?.deal_probability?.risk_factors ? (
                    <div className="mt-2">
                      <span className="text-[11px] text-muted-foreground font-semibold">Risk Factors:</span>
                      <div className="mt-1">{renderLines(displayPostCall.deal_probability.risk_factors)}</div>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}
            {!postCallLoading && !displayPostCall && !postCallError ? (
              <div className="flex flex-col items-center justify-center py-14">
                <FiFileText className="w-10 h-10 text-muted-foreground/20 mb-3" />
                <p className="text-xs text-muted-foreground text-center font-medium">
                  {safeTranscript.length > 0
                    ? 'Report will be generated automatically...'
                    : 'Complete a call to generate a post-call intelligence report.'}
                </p>
              </div>
            ) : null}
          </div>
        </Card>
      </div>

      {/* Right: Email & Sync */}
      <div className="flex flex-col">
        <Card className="flex-1 flex flex-col border border-border overflow-hidden shadow-sm">
          <CardHeader className="py-2.5 px-4 space-y-0">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <FiSend className="w-4 h-4 text-primary" /> Follow-up Email & CRM Sync
            </CardTitle>
          </CardHeader>
          <Separator />
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            {displayPostCall?.follow_up_email ? (
              <div className="space-y-3 pt-3">
                <div className="space-y-2.5">
                  <div>
                    <label className="text-[11px] text-muted-foreground uppercase font-semibold tracking-wide block mb-1.5">Recipient</label>
                    <Input value={editRecipient} onChange={(e) => setEditRecipient(e.target.value)} className="h-9 text-xs" placeholder="email@company.com" type="email" />
                  </div>
                  <div>
                    <label className="text-[11px] text-muted-foreground uppercase font-semibold tracking-wide block mb-1.5">Subject</label>
                    <Input value={editSubject} onChange={(e) => setEditSubject(e.target.value)} className="h-9 text-xs" />
                  </div>
                  <div>
                    <label className="text-[11px] text-muted-foreground uppercase font-semibold tracking-wide block mb-1.5">Email Body</label>
                    <Textarea value={editBody} onChange={(e) => setEditBody(e.target.value)} className="text-xs min-h-[160px]" rows={10} />
                  </div>
                </div>
                <Button onClick={handleSync} disabled={syncLoading || !editRecipient.trim()} className="w-full gap-2 h-9 text-xs font-semibold">
                  {syncLoading ? <FiRefreshCw className="w-3.5 h-3.5 animate-spin" /> : <FiSend className="w-3.5 h-3.5" />}
                  Sync to HubSpot & Send Email
                </Button>
                {syncError ? <p className="text-xs text-destructive flex items-center gap-1.5 mt-1"><FiAlertCircle className="w-3.5 h-3.5" /> {syncError}</p> : null}
                {syncSuccess ? <p className="text-xs text-green-600 flex items-center gap-1.5 mt-1"><FiCheckCircle className="w-3.5 h-3.5" /> {syncSuccess}</p> : null}
                {displaySync ? (
                  <div className="space-y-2.5 mt-2">
                    <div className="border border-green-200 bg-green-50 rounded-lg p-3">
                      <h4 className="text-[10px] font-semibold text-green-700 uppercase tracking-wider mb-2">HubSpot Sync</h4>
                      <div className="space-y-1 text-xs">
                        <p><span className="text-muted-foreground">Contact:</span> {safeText(displaySync?.hubspot_sync?.contact_status)}</p>
                        {displaySync?.hubspot_sync?.contact_id ? <p className="font-mono text-[11px] text-muted-foreground">ID: {safeText(displaySync.hubspot_sync.contact_id)}</p> : null}
                        <p><span className="text-muted-foreground">Deal:</span> {safeText(displaySync?.hubspot_sync?.deal_status)}</p>
                        {displaySync?.hubspot_sync?.deal_id ? <p className="font-mono text-[11px] text-muted-foreground">ID: {safeText(displaySync.hubspot_sync.deal_id)}</p> : null}
                        {displaySync?.hubspot_sync?.notes_added ? <p className="text-[11px] text-muted-foreground">{safeText(displaySync.hubspot_sync.notes_added)}</p> : null}
                      </div>
                    </div>
                    <div className="border border-green-200 bg-green-50 rounded-lg p-3">
                      <h4 className="text-[10px] font-semibold text-green-700 uppercase tracking-wider mb-2">Email Status</h4>
                      <div className="space-y-1 text-xs">
                        <p><span className="text-muted-foreground">Sent:</span> <Badge variant="secondary" className="text-[10px] h-5">{displaySync?.email_status?.sent === 'true' ? 'Yes' : safeText(displaySync?.email_status?.sent)}</Badge></p>
                        <p><span className="text-muted-foreground">To:</span> {safeText(displaySync?.email_status?.recipient)}</p>
                        <p><span className="text-muted-foreground">Subject:</span> {safeText(displaySync?.email_status?.subject)}</p>
                        {displaySync?.email_status?.timestamp ? <p className="text-[11px] text-muted-foreground">{safeText(displaySync.email_status.timestamp)}</p> : null}
                      </div>
                    </div>
                    {displaySync?.sync_summary ? (
                      <div className="border border-border rounded-lg p-3">
                        <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Sync Summary</h4>
                        <p className="text-xs leading-relaxed">{safeText(displaySync.sync_summary)}</p>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-14">
                <FiSend className="w-10 h-10 text-muted-foreground/20 mb-3" />
                <p className="text-xs text-muted-foreground text-center font-medium">
                  {postCallLoading
                    ? 'Generating report... email will be ready shortly.'
                    : 'Generate a post-call report first to get the AI-drafted follow-up email.'}
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>
      </div>
    </div>
  )
}
