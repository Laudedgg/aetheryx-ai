'use client'

import React, { useState } from 'react'
import { Input } from '@/components/ui/input'
import { FiClock, FiSearch, FiChevronDown, FiChevronUp, FiEye, FiPhone } from 'react-icons/fi'

interface CallHistoryProps { callHistory: any[]; onViewCall: (call: any) => void; callsLoaded?: boolean }

const serif: React.CSSProperties = { fontFamily: "'Instrument Serif', serif" }
const cardStyle: React.CSSProperties = { background: '#0c1120', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16 }

function safeText(val: any, fb = 'N/A'): string { if (val == null) return fb; if (typeof val === 'string') return val; if (typeof val === 'number') return String(val); try { return JSON.stringify(val) } catch { return fb } }
function renderLines(text: any): React.ReactNode { const s = safeText(text, ''); if (!s) return null; return <div className="space-y-0.5">{s.split('\n').map((l: string, i: number) => { const t = l.trim(); if (!t) return null; if (t.startsWith('- ')||t.startsWith('* ')) return <li key={i} className="ml-3 list-disc text-[11px] text-white/40">{t.slice(2)}</li>; return <p key={i} className="text-[11px] text-white/40">{t}</p> })}</div> }
function safeDate(d: any): string { if (!d) return 'N/A'; try { const dt = new Date(d); return isNaN(dt.getTime()) ? 'N/A' : dt.toLocaleDateString() } catch { return 'N/A' } }
function safeTime(d: any): string { if (!d) return ''; try { const dt = new Date(d); return isNaN(dt.getTime()) ? '' : dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) } catch { return '' } }
function fmtDur(s: any): string { if (s == null) return ''; const n = typeof s === 'number' ? s : parseInt(String(s), 10); if (isNaN(n) || n <= 0) return ''; return String(Math.floor(n/60)).padStart(2,'0') + ':' + String(n%60).padStart(2,'0') }

export default function CallHistory(props: CallHistoryProps) { try { return <Inner {...props} /> } catch { return <div className="flex items-center justify-center h-64"><p className="text-sm text-red-400">Failed to render.</p></div> } }

function Inner({ callHistory, onViewCall, callsLoaded }: CallHistoryProps) {
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState<string|null>(null)
  const [filter, setFilter] = useState('all')
  const calls = Array.isArray(callHistory) ? callHistory : []
  const filtered = calls.filter(c => { try { const cn = safeText(c?.postCallData?.summary?.client_name,'').toLowerCase(); const co = safeText(c?.postCallData?.summary?.company,'').toLowerCase(); const q = search.toLowerCase(); const ms = !q || cn.includes(q) || co.includes(q); const oc = safeText(c?.postCallData?.summary?.call_outcome,'').toLowerCase(); const mf = filter === 'all' || oc.includes(filter); return ms && mf } catch { return true } })

  if (!calls.length) {
    if (!callsLoaded) return <div className="flex flex-col items-center justify-center py-20"><div className="w-8 h-8 border-2 border-white/10 border-t-[#216BE4] rounded-full animate-spin mb-3"/><p className="text-xs text-white/30">Loading call history...</p></div>
    return <div className="flex flex-col items-center justify-center py-20"><div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{background:'rgba(33,107,228,0.06)'}}><FiClock className="w-6 h-6" style={{color:'rgba(33,107,228,0.3)'}}/></div><h2 className="text-base font-semibold text-white/60 mb-1" style={serif}>No calls yet</h2><p className="text-[11px] text-white/25 max-w-xs text-center">Complete your first sales call to see it here.</p></div>
  }

  return (
    <div className="space-y-3 pb-4">
      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
          <Input placeholder="Search by client or company..." value={search} onChange={e=>setSearch(e.target.value)} className="h-10 text-[12px] pl-9 bg-white/[0.02] border-white/[0.06] text-white/60 placeholder:text-white/15" />
        </div>
        <select value={filter} onChange={e=>setFilter(e.target.value)} className="h-10 text-[12px] px-3 rounded-xl text-white/50" style={{background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.06)'}}>
          <option value="all">All Outcomes</option>
          <option value="positive">Positive</option>
          <option value="negative">Negative</option>
          <option value="neutral">Neutral</option>
        </select>
      </div>

      {/* Results count */}
      <p className="text-[10px] text-white/20 font-mono">{filtered.length} of {calls.length} calls</p>

      {/* Call cards */}
      <div className="space-y-2">
        {!filtered.length && <p className="text-[11px] text-white/20 text-center py-10">No calls match your search.</p>}
        {filtered.map((call, idx) => {
          const id = safeText(call?.id, 'c-'+idx)
          const isExp = expanded === id
          const client = safeText(call?.postCallData?.summary?.client_name, 'Unknown')
          const company = safeText(call?.postCallData?.summary?.company, 'Unknown')
          const outcome = safeText(call?.postCallData?.summary?.call_outcome, 'N/A')
          const score = safeText(call?.postCallData?.deal_probability?.score, '--')
          const st = safeText(call?.status, 'completed')
          const status = st === 'synced' ? 'Synced' : st === 'completed' ? 'Done' : 'Active'
          const statusColor = st === 'synced' ? '#216BE4' : st === 'completed' ? '#f59e0b' : '#34d399'
          const phone = safeText(call?.phoneNumber, '')
          const dur = fmtDur(call?.duration)
          const transcriptArr = Array.isArray(call?.transcript) ? call.transcript : []

          return (
            <div key={id} style={cardStyle} className="overflow-hidden transition-all">
              <div className="px-4 py-3 cursor-pointer hover:bg-white/[0.02] transition-colors" onClick={() => setExpanded(isExp ? null : id)}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex-shrink-0 text-center" style={{minWidth:52}}>
                      <p className="text-[11px] text-white/30 font-mono">{safeDate(call?.startTime)}</p>
                      <p className="text-[10px] text-white/15">{safeTime(call?.startTime)}</p>
                    </div>
                    <div className="w-px h-8 bg-white/[0.06] hidden sm:block flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-white/70 truncate">{client}</p>
                      <p className="text-[11px] text-white/30 truncate">{company}</p>
                      {phone && <p className="text-[10px] text-white/20 flex items-center gap-1 mt-0.5"><FiPhone className="w-2.5 h-2.5"/>{phone}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 flex-shrink-0">
                    {dur && <span className="text-[11px] font-mono text-white/25 tabular-nums">{dur}</span>}
                    <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full" style={{background:`${statusColor}15`,color:statusColor,border:`1px solid ${statusColor}25`}}>{status}</span>
                    <span className="text-[13px] font-bold font-mono" style={{color:'#216BE4'}}>{score}</span>
                    {isExp ? <FiChevronUp className="w-3.5 h-3.5 text-white/20"/> : <FiChevronDown className="w-3.5 h-3.5 text-white/20"/>}
                  </div>
                </div>
                <p className="text-[10px] text-white/20 mt-1.5 truncate">{outcome}</p>
              </div>

              {isExp && (
                <div className="px-4 py-3 space-y-3 border-t border-white/[0.04]" style={{background:'rgba(255,255,255,0.01)'}}>
                  {/* Transcript */}
                  <div>
                    <p className="text-[9px] font-bold text-white/20 uppercase tracking-[0.15em] mb-1.5">Transcript ({transcriptArr.length})</p>
                    <div className="max-h-36 overflow-y-auto space-y-1 rounded-xl p-2.5" style={{background:'rgba(255,255,255,0.015)',border:'1px solid rgba(255,255,255,0.04)'}}>
                      {!transcriptArr.length && <p className="text-[10px] text-white/15">No transcript.</p>}
                      {transcriptArr.map((l: any, li: number) => (
                        <div key={safeText(l?.id,'l-'+li)} className="flex gap-2 text-[11px]">
                          <span className="font-semibold flex-shrink-0" style={{color: l?.speaker==='rep' ? '#216BE4' : '#f472b6'}}>{l?.speaker==='rep' ? 'Rep' : 'Prospect'}:</span>
                          <span className="text-white/35">{safeText(l?.text,'')}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Summary */}
                  {call?.postCallData?.summary && (
                    <div>
                      <p className="text-[9px] font-bold text-white/20 uppercase tracking-[0.15em] mb-1.5">Summary</p>
                      <div className="rounded-xl p-2.5 space-y-1.5" style={{background:'rgba(255,255,255,0.015)',border:'1px solid rgba(255,255,255,0.04)'}}>
                        {call.postCallData.summary?.key_points && <div><span className="text-[9px] text-white/25 font-semibold">Key Points:</span>{renderLines(call.postCallData.summary.key_points)}</div>}
                        {call.postCallData.summary?.next_steps && <div><span className="text-[9px] text-white/25 font-semibold">Next Steps:</span>{renderLines(call.postCallData.summary.next_steps)}</div>}
                      </div>
                    </div>
                  )}
                  {/* Deal + View */}
                  <div className="flex items-center justify-between pt-1">
                    {call?.postCallData?.deal_probability && (
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-white/25">Deal Probability:</span>
                        <span className="text-sm font-bold font-mono" style={{color:'#216BE4'}}>{safeText(call.postCallData.deal_probability?.score)}</span>
                      </div>
                    )}
                    <button onClick={e => { e.stopPropagation(); onViewCall(call) }} className="flex items-center gap-1.5 text-[11px] font-medium px-3 py-1.5 rounded-lg transition-all hover:shadow-md" style={{background:'linear-gradient(135deg,#216BE4,#1a5bc7)',color:'#fff'}}>
                      <FiEye className="w-3 h-3"/> View Details
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
