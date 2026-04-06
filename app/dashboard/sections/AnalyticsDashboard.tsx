'use client'

import React, { useMemo } from 'react'
import { FiPhone, FiTrendingUp, FiTarget, FiCalendar, FiBarChart2, FiClock } from 'react-icons/fi'

interface AnalyticsDashboardProps { callHistory: any[]; useSampleData: boolean; callsLoaded?: boolean }

const serif: React.CSSProperties = { fontFamily: "'Instrument Serif', serif" }
const cardStyle: React.CSSProperties = { background: '#0c1120', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16 }

function safeText(v: any, fb = 'N/A'): string { if (v == null) return fb; if (typeof v === 'string') return v; if (typeof v === 'number') return String(v); try { return JSON.stringify(v) } catch { return fb } }
function safeDate(d: any): string { if (!d) return 'N/A'; try { const dt = new Date(d); return isNaN(dt.getTime()) ? 'N/A' : dt.toLocaleDateString() } catch { return 'N/A' } }
function fmtDur(s: any): string { if (s == null) return ''; const n = typeof s === 'number' ? s : parseInt(String(s),10); if (isNaN(n)||n<=0) return ''; return String(Math.floor(n/60)).padStart(2,'0')+':'+String(n%60).padStart(2,'0') }

const SAMPLE_CALLS = [
  { id:'s1',startTime:'2025-03-10T09:00:00',transcript:[],postCallData:{summary:{client_name:'Sarah Johnson',company:'Acme Corp',call_outcome:'Positive - Demo scheduled'},deal_probability:{score:'72%'}},syncData:{},status:'synced',phoneNumber:'+971 55 123 4567',duration:1800 },
  { id:'s2',startTime:'2025-03-09T14:00:00',transcript:[],postCallData:{summary:{client_name:'Mike Chen',company:'TechFlow Inc',call_outcome:'Positive - Proposal requested'},deal_probability:{score:'65%'}},syncData:{},status:'synced',phoneNumber:'+1 415 555 8901',duration:2700 },
  { id:'s3',startTime:'2025-03-08T11:00:00',transcript:[],postCallData:{summary:{client_name:'Lisa Park',company:'DataBridge',call_outcome:'Neutral - Needs discussion'},deal_probability:{score:'40%'}},status:'completed',phoneNumber:'+44 20 7946 0958',duration:1200 },
  { id:'s4',startTime:'2025-03-07T16:00:00',transcript:[],postCallData:{summary:{client_name:'James Wilson',company:'CloudScale',call_outcome:'Positive - Contract review'},deal_probability:{score:'85%'}},syncData:{},status:'synced',phoneNumber:'+1 650 555 3421',duration:2100 },
  { id:'s5',startTime:'2025-03-06T10:00:00',transcript:[],postCallData:{summary:{client_name:'Anna Rivera',company:'NetOps Ltd',call_outcome:'Negative - No budget'},deal_probability:{score:'15%'}},status:'completed',phoneNumber:'+34 91 555 7823',duration:900 },
]

export default function AnalyticsDashboard(props: AnalyticsDashboardProps) { try { return <Inner {...props} /> } catch { return <div className="flex items-center justify-center h-64"><p className="text-sm text-red-400">Failed to render.</p></div> } }

function Inner({ callHistory, useSampleData, callsLoaded }: AnalyticsDashboardProps) {
  const safeCalls = Array.isArray(callHistory) ? callHistory : []
  const displayCalls = useSampleData ? SAMPLE_CALLS : safeCalls

  const stats = useMemo(() => {
    try {
      const calls = Array.isArray(displayCalls) ? displayCalls : []; const total = calls.length
      const probs: number[] = []; calls.forEach(c => { try { const n = parseFloat(safeText(c?.postCallData?.deal_probability?.score,'')); if (!isNaN(n)) probs.push(n) } catch {} })
      const avgProb = probs.length ? Math.round(probs.reduce((a,b)=>a+b,0)/probs.length) : 0
      let pos = 0; calls.forEach(c => { try { if (safeText(c?.postCallData?.summary?.call_outcome,'').toLowerCase().includes('positive')) pos++ } catch {} })
      const conv = total ? Math.round((pos/total)*100) : 0
      let week = 0; const wAgo = new Date(); wAgo.setDate(wAgo.getDate()-7); calls.forEach(c => { try { const d = new Date(c?.startTime); if (!isNaN(d.getTime()) && d >= wAgo) week++ } catch {} })
      let synced = 0; calls.forEach(c => { if (c?.status==='synced') synced++ })
      const durs: number[] = []; calls.forEach(c => { try { if (typeof c?.duration==='number'&&c.duration>0) durs.push(c.duration) } catch {} })
      const avgDur = durs.length ? Math.round(durs.reduce((a,b)=>a+b,0)/durs.length) : 0
      const totalTime = durs.reduce((a,b)=>a+b,0)
      const buckets = [{l:'0-20%',c:0,color:'#ef4444'},{l:'21-40%',c:0,color:'#f97316'},{l:'41-60%',c:0,color:'#eab308'},{l:'61-80%',c:0,color:'#216BE4'},{l:'81-100%',c:0,color:'#34d399'}]
      probs.forEach(v => { if(v<=20) buckets[0].c++; else if(v<=40) buckets[1].c++; else if(v<=60) buckets[2].c++; else if(v<=80) buckets[3].c++; else buckets[4].c++ })
      const maxB = Math.max(1,...buckets.map(b=>b.c))
      return { total, avgProb, conv, week, synced, buckets, maxB, avgDur, totalTime }
    } catch { return { total:0,avgProb:0,conv:0,week:0,synced:0,buckets:[],maxB:1,avgDur:0,totalTime:0 } }
  }, [displayCalls])

  const recent = Array.isArray(displayCalls) ? displayCalls.slice(0,5) : []

  if (!(Array.isArray(displayCalls)?displayCalls.length:0)) {
    if (!callsLoaded) return <div className="flex flex-col items-center justify-center py-20"><div className="w-8 h-8 border-2 border-white/10 border-t-[#216BE4] rounded-full animate-spin mb-3"/><p className="text-xs text-white/30">Loading analytics...</p></div>
    return <div className="flex flex-col items-center justify-center py-20"><div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{background:'rgba(33,107,228,0.06)'}}><FiBarChart2 className="w-6 h-6" style={{color:'rgba(33,107,228,0.3)'}}/></div><h2 className="text-base font-semibold text-white/60 mb-1" style={serif}>No analytics data yet</h2><p className="text-[11px] text-white/25 max-w-xs text-center">Complete sales calls to see analytics here.</p></div>
  }

  const kpis = [
    { label: 'Total Calls', value: stats.total, icon: <FiPhone className="w-4 h-4"/>, color: '#216BE4' },
    { label: 'Avg Duration', value: fmtDur(stats.avgDur)||'00:00', icon: <FiClock className="w-4 h-4"/>, color: '#216BE4', sub: `Total: ${fmtDur(stats.totalTime)||'00:00'}` },
    { label: 'Avg Probability', value: `${stats.avgProb}%`, icon: <FiTrendingUp className="w-4 h-4"/>, color: '#34d399' },
    { label: 'Conversion', value: `${stats.conv}%`, icon: <FiTarget className="w-4 h-4"/>, color: '#216BE4' },
    { label: 'This Week', value: stats.week, icon: <FiCalendar className="w-4 h-4"/>, color: '#34d399' },
  ]

  return (
    <div className="space-y-3 pb-4">
      {/* KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
        {kpis.map(k => (
          <div key={k.label} style={cardStyle} className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[9px] text-white/20 uppercase tracking-[0.12em] font-bold">{k.label}</p>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{background:`${k.color}12`,color:k.color}}>{k.icon}</div>
            </div>
            <p className="text-xl font-bold font-mono tabular-nums text-white/80" style={serif}>{k.value}</p>
            {k.sub && <p className="text-[10px] text-white/15 mt-1">{k.sub}</p>}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {/* Probability Distribution */}
        <div style={cardStyle} className="p-4">
          <p className="text-[13px] font-semibold text-white/60 mb-4" style={serif}>Deal Probability Distribution</p>
          <div className="space-y-2.5">
            {stats.buckets.map((b: any) => {
              const w = stats.maxB > 0 ? (b.c / stats.maxB) * 100 : 0
              return (
                <div key={b.l} className="flex items-center gap-2.5">
                  <span className="text-[10px] font-mono text-white/25 w-12 text-right flex-shrink-0">{b.l}</span>
                  <div className="flex-1 h-5 rounded-md overflow-hidden" style={{background:'rgba(255,255,255,0.03)'}}>
                    <div className="h-full rounded-md transition-all duration-500" style={{width:`${w}%`,background:b.color,opacity:0.7}} />
                  </div>
                  <span className="text-[10px] font-mono text-white/30 w-4 font-semibold">{b.c}</span>
                </div>
              )
            })}
          </div>
          <p className="text-[10px] text-white/15 mt-4">{stats.synced} of {stats.total} calls synced to CRM</p>
        </div>

        {/* Recent Calls */}
        <div style={cardStyle} className="p-4">
          <p className="text-[13px] font-semibold text-white/60 mb-4" style={serif}>Recent Calls</p>
          <div className="space-y-2">
            {recent.map((c: any, i: number) => (
              <div key={safeText(c?.id,'r-'+i)} className="flex items-center justify-between rounded-xl p-3 hover:bg-white/[0.02] transition-all" style={{background:'rgba(255,255,255,0.015)',border:'1px solid rgba(255,255,255,0.04)'}}>
                <div className="min-w-0">
                  <p className="text-[12px] font-semibold text-white/60 truncate">{safeText(c?.postCallData?.summary?.client_name,'Unknown')}</p>
                  <p className="text-[10px] text-white/25 truncate">{safeText(c?.postCallData?.summary?.company,'Unknown')} · {safeDate(c?.startTime)}</p>
                </div>
                <div className="text-right flex items-center gap-3 flex-shrink-0">
                  {fmtDur(c?.duration) && <span className="text-[10px] font-mono text-white/20 tabular-nums">{fmtDur(c?.duration)}</span>}
                  <div>
                    <p className="text-[13px] font-bold font-mono" style={{color:'#216BE4'}}>{safeText(c?.postCallData?.deal_probability?.score,'--')}</p>
                    <p className="text-[9px] text-white/20 truncate max-w-[100px]">{safeText(c?.postCallData?.summary?.call_outcome,'N/A')}</p>
                  </div>
                </div>
              </div>
            ))}
            {!recent.length && <p className="text-[11px] text-white/15 text-center py-6">No recent calls</p>}
          </div>
        </div>
      </div>
    </div>
  )
}
