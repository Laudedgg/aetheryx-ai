'use client'

import React, { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { FiClock, FiSearch, FiChevronDown, FiChevronUp, FiEye, FiPhone } from 'react-icons/fi'

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

interface CallHistoryProps {
  callHistory: any[]
  onViewCall: (call: any) => void
}

function safeText(val: any, fallback: string = 'N/A'): string {
  if (val === null || val === undefined) return fallback
  if (typeof val === 'string') return val
  if (typeof val === 'number') return String(val)
  try { return JSON.stringify(val) } catch (_e) { return fallback }
}

function renderLines(text: any): React.ReactNode {
  const str = safeText(text, '')
  if (!str) return null
  try {
    return (
      <div className="space-y-0.5">
        {str.split('\n').map((line: string, i: number) => {
          const trimmed = line.trim()
          if (!trimmed) return null
          if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) return <li key={i} className="ml-3 list-disc text-xs">{trimmed.slice(2)}</li>
          if (/^\d+\.\s/.test(trimmed)) return <li key={i} className="ml-3 list-decimal text-xs">{trimmed.replace(/^\d+\.\s/, '')}</li>
          return <p key={i} className="text-xs">{trimmed}</p>
        })}
      </div>
    )
  } catch (_e) {
    return <p className="text-xs">{str}</p>
  }
}

function safeDate(dateStr: any): string {
  if (!dateStr) return 'N/A'
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return 'N/A'
    return d.toLocaleDateString()
  } catch (_e) {
    return 'N/A'
  }
}

function safeTime(dateStr: any): string {
  if (!dateStr) return ''
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return ''
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  } catch (_e) {
    return ''
  }
}

function formatDuration(seconds: any): string {
  if (seconds === null || seconds === undefined) return ''
  const num = typeof seconds === 'number' ? seconds : parseInt(String(seconds), 10)
  if (isNaN(num) || num <= 0) return ''
  const m = Math.floor(num / 60)
  const s = num % 60
  return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0')
}

export default function CallHistory(props: CallHistoryProps) {
  try {
    return <CallHistoryInner {...props} />
  } catch (_e) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-destructive">Failed to render Call History. Please try refreshing the page.</p>
      </div>
    )
  }
}

function CallHistoryInner({ callHistory, onViewCall }: CallHistoryProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [filterOutcome, setFilterOutcome] = useState<string>('all')

  const safeCalls = Array.isArray(callHistory) ? callHistory : []

  const filteredCalls = safeCalls.filter(function(call) {
    try {
      const clientName = safeText(call?.postCallData?.summary?.client_name, '').toLowerCase()
      const company = safeText(call?.postCallData?.summary?.company, '').toLowerCase()
      const query = (searchQuery || '').toLowerCase()
      const matchesSearch = !query || clientName.includes(query) || company.includes(query)
      const outcome = safeText(call?.postCallData?.summary?.call_outcome, '').toLowerCase()
      const matchesFilter = filterOutcome === 'all' || outcome.includes(filterOutcome.toLowerCase())
      return matchesSearch && matchesFilter
    } catch (_e) {
      return true
    }
  })

  if (safeCalls.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <FiClock className="w-7 h-7 text-muted-foreground" />
        </div>
        <h2 className="text-lg font-semibold text-foreground mb-1">No calls yet</h2>
        <p className="text-xs text-muted-foreground max-w-sm text-center">Complete your first sales call to see it appear here with full transcript, AI summary, and deal analysis.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 h-[calc(100vh-88px)]">
      {/* Search & Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search by client or company..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="h-9 text-xs pl-9" />
        </div>
        <select value={filterOutcome} onChange={(e) => setFilterOutcome(e.target.value)} className="h-9 text-xs px-3 border border-border rounded-lg bg-card text-foreground">
          <option value="all">All Outcomes</option>
          <option value="positive">Positive</option>
          <option value="negative">Negative</option>
          <option value="neutral">Neutral</option>
        </select>
      </div>

      {/* Call List */}
      <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 148px)' }}>
        <div className="space-y-2.5">
          {filteredCalls.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-10 font-medium">No calls match your search.</p>
          ) : null}
          {filteredCalls.map(function(call, idx) {
            const callId = safeText(call?.id, 'call-' + idx)
            const isExpanded = expandedId === callId
            const clientName = safeText(call?.postCallData?.summary?.client_name, 'Unknown')
            const company = safeText(call?.postCallData?.summary?.company, 'Unknown')
            const outcome = safeText(call?.postCallData?.summary?.call_outcome, 'N/A')
            const score = safeText(call?.postCallData?.deal_probability?.score, 'N/A')
            const callStatus = safeText(call?.status, 'completed')
            const syncStatus = callStatus === 'synced' ? 'Synced' : callStatus === 'completed' ? 'Completed' : 'Active'
            const startDate = safeDate(call?.startTime)
            const startTime = safeTime(call?.startTime)
            const transcriptArr = Array.isArray(call?.transcript) ? call.transcript : []
            const callPhone = safeText(call?.phoneNumber, '')
            const callDur = formatDuration(call?.duration)

            return (
              <Card key={callId} className="border border-border shadow-sm">
                <div className="px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setExpandedId(isExpanded ? null : callId)}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="text-xs text-muted-foreground w-20 flex-shrink-0">
                        <p className="font-mono font-medium">{startDate}</p>
                        <p className="text-[11px] mt-0.5">{startTime}</p>
                      </div>
                      <Separator orientation="vertical" className="h-9" />
                      <div>
                        <p className="text-sm font-semibold">{clientName}</p>
                        <p className="text-[11px] text-muted-foreground">{company}</p>
                        {callPhone ? (
                          <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                            <FiPhone className="w-3 h-3" /> {callPhone}
                          </p>
                        ) : null}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {callDur ? <span className="text-[11px] font-mono text-muted-foreground tabular-nums">{callDur}</span> : null}
                      <Badge variant={syncStatus === 'Synced' ? 'default' : 'secondary'} className="text-[11px] h-5">{syncStatus}</Badge>
                      <span className="text-sm font-mono font-bold text-primary">{score}</span>
                      {isExpanded ? <FiChevronUp className="w-4 h-4 text-muted-foreground" /> : <FiChevronDown className="w-4 h-4 text-muted-foreground" />}
                    </div>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1.5 truncate">{outcome}</p>
                </div>

                {isExpanded ? (
                  <React.Fragment>
                    <Separator />
                    <div className="px-4 py-3 space-y-3 bg-muted/20">
                      {/* Transcript preview */}
                      <div>
                        <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Transcript ({transcriptArr.length} lines)</h4>
                        <div className="max-h-40 overflow-y-auto space-y-1 border border-border rounded-lg p-2.5 bg-card">
                          {transcriptArr.length === 0 ? (
                            <p className="text-[11px] text-muted-foreground">No transcript lines.</p>
                          ) : null}
                          {transcriptArr.map(function(line, li) {
                            return (
                              <div key={safeText(line?.id, 'line-' + li)} className="flex gap-2 text-[11px]">
                                <span className={`font-semibold flex-shrink-0 ${line?.speaker === 'rep' ? 'text-primary' : 'text-muted-foreground'}`}>
                                  {line?.speaker === 'rep' ? 'Rep' : 'Prospect'}:
                                </span>
                                <span>{safeText(line?.text, '')}</span>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                      {/* Summary */}
                      {call?.postCallData?.summary ? (
                        <div>
                          <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Summary</h4>
                          <div className="border border-border rounded-lg p-2.5 bg-card space-y-1.5">
                            {call.postCallData.summary?.key_points ? (
                              <div>
                                <span className="text-[10px] text-muted-foreground font-semibold">Key Points:</span>
                                {renderLines(call.postCallData.summary.key_points)}
                              </div>
                            ) : null}
                            {call.postCallData.summary?.next_steps ? (
                              <div>
                                <span className="text-[10px] text-muted-foreground font-semibold">Next Steps:</span>
                                {renderLines(call.postCallData.summary.next_steps)}
                              </div>
                            ) : null}
                          </div>
                        </div>
                      ) : null}
                      {/* Deal Probability */}
                      {call?.postCallData?.deal_probability ? (
                        <div className="flex items-center gap-2.5">
                          <span className="text-[11px] text-muted-foreground font-medium">Deal Probability:</span>
                          <span className="text-sm font-bold font-mono text-primary">{safeText(call.postCallData.deal_probability?.score)}</span>
                        </div>
                      ) : null}
                      {/* View Call button */}
                      <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5 px-3" onClick={(e) => { e.stopPropagation(); onViewCall(call) }}>
                        <FiEye className="w-3.5 h-3.5" /> View in Post-Call Review
                      </Button>
                    </div>
                  </React.Fragment>
                ) : null}
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
