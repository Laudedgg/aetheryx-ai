'use client'

import React, { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { FiPhone, FiTrendingUp, FiTarget, FiCalendar, FiBarChart2, FiClock } from 'react-icons/fi'

interface AnalyticsDashboardProps {
  callHistory: any[]
  useSampleData: boolean
}

function safeText(val: any, fallback: string = 'N/A'): string {
  if (val === null || val === undefined) return fallback
  if (typeof val === 'string') return val
  if (typeof val === 'number') return String(val)
  try { return JSON.stringify(val) } catch (_e) { return fallback }
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

function formatDuration(seconds: any): string {
  if (seconds === null || seconds === undefined) return ''
  const num = typeof seconds === 'number' ? seconds : parseInt(String(seconds), 10)
  if (isNaN(num) || num <= 0) return ''
  const m = Math.floor(num / 60)
  const s = num % 60
  return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0')
}

const SAMPLE_CALLS = [
  {
    id: 's1', startTime: '2025-03-10T09:00:00', endTime: '2025-03-10T09:30:00', transcript: [],
    postCallData: { summary: { client_name: 'Sarah Johnson', company: 'Acme Corp', call_outcome: 'Positive - Demo scheduled' }, deal_probability: { score: '72%' } },
    syncData: {}, status: 'synced', phoneNumber: '+971 55 123 4567', duration: 1800
  },
  {
    id: 's2', startTime: '2025-03-09T14:00:00', endTime: '2025-03-09T14:45:00', transcript: [],
    postCallData: { summary: { client_name: 'Mike Chen', company: 'TechFlow Inc', call_outcome: 'Positive - Proposal requested' }, deal_probability: { score: '65%' } },
    syncData: {}, status: 'synced', phoneNumber: '+1 415 555 8901', duration: 2700
  },
  {
    id: 's3', startTime: '2025-03-08T11:00:00', endTime: '2025-03-08T11:20:00', transcript: [],
    postCallData: { summary: { client_name: 'Lisa Park', company: 'DataBridge', call_outcome: 'Neutral - Needs internal discussion' }, deal_probability: { score: '40%' } },
    status: 'completed', phoneNumber: '+44 20 7946 0958', duration: 1200
  },
  {
    id: 's4', startTime: '2025-03-07T16:00:00', endTime: '2025-03-07T16:35:00', transcript: [],
    postCallData: { summary: { client_name: 'James Wilson', company: 'CloudScale', call_outcome: 'Positive - Contract review' }, deal_probability: { score: '85%' } },
    syncData: {}, status: 'synced', phoneNumber: '+1 650 555 3421', duration: 2100
  },
  {
    id: 's5', startTime: '2025-03-06T10:00:00', endTime: '2025-03-06T10:15:00', transcript: [],
    postCallData: { summary: { client_name: 'Anna Rivera', company: 'NetOps Ltd', call_outcome: 'Negative - No budget' }, deal_probability: { score: '15%' } },
    status: 'completed', phoneNumber: '+34 91 555 7823', duration: 900
  },
]

export default function AnalyticsDashboard(props: AnalyticsDashboardProps) {
  try {
    return <AnalyticsDashboardInner {...props} />
  } catch (_e) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-destructive">Failed to render Analytics Dashboard. Please try refreshing the page.</p>
      </div>
    )
  }
}

function AnalyticsDashboardInner({ callHistory, useSampleData }: AnalyticsDashboardProps) {
  const safeCalls = Array.isArray(callHistory) ? callHistory : []
  const displayCalls = useSampleData ? SAMPLE_CALLS : safeCalls

  const stats = useMemo(() => {
    try {
      const calls = Array.isArray(displayCalls) ? displayCalls : []
      const totalCalls = calls.length

      const probValues: number[] = []
      for (let i = 0; i < calls.length; i++) {
        try {
          const scoreStr = safeText(calls[i]?.postCallData?.deal_probability?.score, '')
          const num = parseFloat(scoreStr)
          if (!isNaN(num)) probValues.push(num)
        } catch (_e) { /* skip */ }
      }
      const avgProb = probValues.length > 0 ? Math.round(probValues.reduce(function(a, b) { return a + b }, 0) / probValues.length) : 0

      let positiveCount = 0
      for (let i = 0; i < calls.length; i++) {
        try {
          const outcome = safeText(calls[i]?.postCallData?.summary?.call_outcome, '').toLowerCase()
          if (outcome.includes('positive')) positiveCount++
        } catch (_e) { /* skip */ }
      }
      const conversionRate = totalCalls > 0 ? Math.round((positiveCount / totalCalls) * 100) : 0

      let callsThisWeek = 0
      try {
        const oneWeekAgo = new Date()
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
        for (let i = 0; i < calls.length; i++) {
          try {
            if (calls[i]?.startTime) {
              const d = new Date(calls[i].startTime)
              if (!isNaN(d.getTime()) && d >= oneWeekAgo) callsThisWeek++
            }
          } catch (_e) { /* skip */ }
        }
      } catch (_e) { /* skip */ }

      let syncedCount = 0
      for (let i = 0; i < calls.length; i++) {
        if (calls[i]?.status === 'synced') syncedCount++
      }

      // Calculate average call duration
      const durations: number[] = []
      for (let i = 0; i < calls.length; i++) {
        try {
          const dur = calls[i]?.duration
          if (typeof dur === 'number' && dur > 0) durations.push(dur)
        } catch (_e) { /* skip */ }
      }
      const avgDuration = durations.length > 0 ? Math.round(durations.reduce(function(a, b) { return a + b }, 0) / durations.length) : 0
      const totalTalkTime = durations.reduce(function(a, b) { return a + b }, 0)

      const probBuckets = [
        { label: '0-20%', count: 0, color: 'bg-red-400' },
        { label: '21-40%', count: 0, color: 'bg-orange-400' },
        { label: '41-60%', count: 0, color: 'bg-yellow-400' },
        { label: '61-80%', count: 0, color: 'bg-blue-400' },
        { label: '81-100%', count: 0, color: 'bg-green-400' },
      ]
      for (let i = 0; i < probValues.length; i++) {
        const v = probValues[i]
        if (v <= 20) probBuckets[0].count++
        else if (v <= 40) probBuckets[1].count++
        else if (v <= 60) probBuckets[2].count++
        else if (v <= 80) probBuckets[3].count++
        else probBuckets[4].count++
      }
      let maxBucket = 1
      for (let i = 0; i < probBuckets.length; i++) {
        if (probBuckets[i].count > maxBucket) maxBucket = probBuckets[i].count
      }

      return { totalCalls, avgProb, conversionRate, callsThisWeek, syncedCount, probBuckets, maxBucket, avgDuration, totalTalkTime }
    } catch (_e) {
      return { totalCalls: 0, avgProb: 0, conversionRate: 0, callsThisWeek: 0, syncedCount: 0, probBuckets: [], maxBucket: 1, avgDuration: 0, totalTalkTime: 0 }
    }
  }, [displayCalls])

  const recentCalls = Array.isArray(displayCalls) ? displayCalls.slice(0, 5) : []

  if ((Array.isArray(displayCalls) ? displayCalls.length : 0) === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <FiBarChart2 className="w-7 h-7 text-muted-foreground" />
        </div>
        <h2 className="text-lg font-semibold text-foreground mb-1">No analytics data yet</h2>
        <p className="text-xs text-muted-foreground max-w-sm text-center">Complete sales calls and generate reports to see pipeline analytics and coaching insights here.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 h-[calc(100vh-88px)] overflow-y-auto">
      {/* KPI Cards */}
      <div className="grid grid-cols-5 gap-4">
        <Card className="border border-border shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Total Calls</p>
                <p className="text-2xl font-bold font-mono mt-1 tabular-nums">{stats.totalCalls}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <FiPhone className="w-5 h-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-border shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Avg Duration</p>
                <p className="text-2xl font-bold font-mono mt-1 tabular-nums">{formatDuration(stats.avgDuration) || '00:00'}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <FiClock className="w-5 h-5 text-primary" />
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1.5">Total: {formatDuration(stats.totalTalkTime) || '00:00'}</p>
          </CardContent>
        </Card>
        <Card className="border border-border shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Avg Probability</p>
                <p className="text-2xl font-bold font-mono mt-1 tabular-nums">{stats.avgProb}%</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <FiTrendingUp className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-border shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Conversion Rate</p>
                <p className="text-2xl font-bold font-mono mt-1 tabular-nums">{stats.conversionRate}%</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <FiTarget className="w-5 h-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-border shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">This Week</p>
                <p className="text-2xl font-bold font-mono mt-1 tabular-nums">{stats.callsThisWeek}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <FiCalendar className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Probability Distribution Chart */}
        <Card className="border border-border shadow-sm">
          <CardHeader className="py-2.5 px-4">
            <CardTitle className="text-sm font-semibold">Deal Probability Distribution</CardTitle>
          </CardHeader>
          <Separator />
          <CardContent className="p-4">
            <div className="space-y-2.5">
              {Array.isArray(stats.probBuckets) && stats.probBuckets.map(function(bucket) {
                const widthPct = stats.maxBucket > 0 ? (bucket.count / stats.maxBucket) * 100 : 0
                return (
                  <div key={bucket.label} className="flex items-center gap-2.5">
                    <span className="text-[11px] font-mono text-muted-foreground w-14 text-right flex-shrink-0 font-medium">{bucket.label}</span>
                    <div className="flex-1 h-6 bg-muted rounded-md overflow-hidden">
                      <div className={`h-full rounded-md transition-all duration-500 ${bucket.color}`} style={{ width: widthPct + '%' }} />
                    </div>
                    <span className="text-[11px] font-mono text-muted-foreground w-5 font-semibold">{bucket.count}</span>
                  </div>
                )
              })}
            </div>
            <div className="mt-4 flex items-center justify-between text-[11px] text-muted-foreground">
              <span>{stats.syncedCount} of {stats.totalCalls} calls synced to CRM</span>
            </div>
          </CardContent>
        </Card>

        {/* Recent Calls */}
        <Card className="border border-border shadow-sm">
          <CardHeader className="py-2.5 px-4">
            <CardTitle className="text-sm font-semibold">Recent Calls</CardTitle>
          </CardHeader>
          <Separator />
          <CardContent className="p-4">
            <div className="space-y-2.5">
              {recentCalls.map(function(call, idx) {
                const clientName = safeText(call?.postCallData?.summary?.client_name, 'Unknown')
                const company = safeText(call?.postCallData?.summary?.company, 'Unknown')
                const score = safeText(call?.postCallData?.deal_probability?.score, 'N/A')
                const outcome = safeText(call?.postCallData?.summary?.call_outcome, 'N/A')
                const dateStr = safeDate(call?.startTime)
                const dur = formatDuration(call?.duration)

                return (
                  <div key={safeText(call?.id, 'rc-' + idx)} className="flex items-center justify-between border border-border rounded-lg p-3">
                    <div>
                      <p className="text-xs font-semibold">{clientName}</p>
                      <p className="text-[11px] text-muted-foreground">{company} - {dateStr}</p>
                    </div>
                    <div className="text-right flex items-center gap-3">
                      {dur ? <span className="text-[11px] font-mono text-muted-foreground tabular-nums">{dur}</span> : null}
                      <div>
                        <span className="text-sm font-mono font-bold text-primary">{score}</span>
                        <p className="text-[11px] text-muted-foreground truncate max-w-36">{outcome}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
              {recentCalls.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6 font-medium">No recent calls</p>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
