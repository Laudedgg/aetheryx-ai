'use client'

import { useState } from "react"
import Link from "next/link"

const VIDEO_SRC = "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260314_131748_f2ca2a28-fed7-44c8-b9a9-bd9acdd5ec31.mp4"
const serif: React.CSSProperties = { fontFamily: "'Instrument Serif', serif" }
const APP_URL = "/dashboard"

const agents = [
  { icon: "🔍", name: "Research Agent", desc: "Researches prospect and company in real-time — surfaces company profile, funding history, tech stack, recent news, and suggested pitch angles.", provider: "Perplexity", model: "sonar-pro", trigger: "Research Prospect" },
  { icon: "🎯", name: "Sales Strategy Agent", desc: "Analyzes live transcript chunks and generates contextual objection handlers, next best questions, and pitch angle recommendations.", provider: "Anthropic", model: "claude-sonnet-4-5", trigger: "Get Suggestions" },
  { icon: "📊", name: "Post-Call Intelligence", desc: "Processes complete call transcript to generate structured summary, deal-closing probability score with signal analysis, and email draft.", provider: "OpenAI", model: "gpt-5.2", trigger: "Generate Report" },
  { icon: "🔗", name: "CRM & Email Sync", desc: "Creates or updates HubSpot contact and deal records, sends follow-up email via Gmail — zero manual entry.", provider: "OpenAI", model: "gpt-4.1", trigger: "Sync & Send" },
]

const screens = [
  { tab: "Live Call", title: "Live Call Dashboard", desc: "Three-column workspace — transcript, research, and AI suggestions visible simultaneously.", checks: ["Auto-scrolling transcript with speaker diarization", "Client Intelligence — company, funding, tech stack", "AI Whisper Panel — objection handlers, pitch angles", "Deal Probability gauge with live signal chips", "\"Research Prospect\" and \"Get Suggestions\" CTAs"] },
  { tab: "Post-Call", title: "Post-Call Review", desc: "Review AI-generated summary, deal probability, and follow-up email before syncing.", checks: ["Structured summary — client, outcome, next steps", "Deal probability with signal analysis", "Editable follow-up email — pre-filled", "\"Generate Report\" triggers Post-Call Agent", "\"Sync & Send\" triggers CRM Agent"] },
  { tab: "History", title: "Call History", desc: "Browse every past call with transcripts, summaries, and outcomes.", checks: ["Sortable table — Date, Client, Probability, Status", "Expandable detail panel", "Search and filter by date, outcome, company", "One-click re-send or re-sync"] },
  { tab: "Analytics", title: "Analytics Dashboard", desc: "Pipeline overview and rep coaching insights for managers.", checks: ["KPI cards — total calls, avg probability, conversion", "Deal probability trends over time", "Top objections across all reps", "Rep performance leaderboard"] },
]

function StarField() {
  const stars = Array.from({ length: 80 }, (_, i) => ({ id: i, left: `${Math.random()*100}%`, top: `${Math.random()*100}%`, duration: `${2+Math.random()*4}s`, delay: `${Math.random()*3}s`, type: Math.random()>0.85?"bright":Math.random()>0.92?"glow":"" }))
  return <div className="starfield">{stars.map(s=><div key={s.id} className={`star ${s.type}`} style={{left:s.left,top:s.top,"--duration":s.duration,"--delay":s.delay} as React.CSSProperties}/>)}</div>
}

function SectionHeader({ badge, title, sub }: { badge: string; title: string; sub: string }) {
  return <div className="text-center px-2"><span className="inline-block text-[10px] sm:text-[11px] font-mono uppercase tracking-widest text-[#216BE4] mb-3 sm:mb-4">{badge}</span><h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-normal mb-3 sm:mb-4 leading-[1.05]" style={serif}>{title}</h2><p className="text-sm sm:text-base text-[#b3b3b3] max-w-lg mx-auto leading-relaxed">{sub}</p></div>
}

function Chip({ label, value }: { label: string; value: string }) {
  return <span className="text-[10px] sm:text-xs text-[#b3b3b3]"><span className="text-white/40 font-medium">{label}</span>{" "}<span className="inline-flex px-1.5 sm:px-2 py-0.5 rounded bg-white/[0.04] border border-white/[0.06] text-white/60 ml-1">{value}</span></span>
}

function DashboardMockup() {
  const cb = '#0c1120'
  const bdr = '1px solid rgba(255,255,255,0.06)'
  return (
    <div className="rounded-xl sm:rounded-2xl overflow-hidden" style={{ background: '#060a14' }}>
      {/* Window chrome */}
      <div className="flex items-center gap-2 px-3 sm:px-4 py-2" style={{ background: '#080d18', borderBottom: bdr }}>
        <div className="w-2 h-2 rounded-full bg-red-500/60" /><div className="w-2 h-2 rounded-full bg-yellow-500/60" /><div className="w-2 h-2 rounded-full bg-green-500/60" />
        <span className="ml-auto text-[8px] text-white/15 font-mono hidden sm:block">Aetheryx AI Dashboard</span>
      </div>
      <div className="flex" style={{ minHeight: 380 }}>

        {/* Left Sidebar */}
        <div className="hidden sm:flex flex-col w-[110px] md:w-[130px] flex-shrink-0 p-1.5 gap-1" style={{ background: '#080d18' }}>
          {/* Logo */}
          <div className="rounded-lg px-2 py-1.5 flex items-center gap-1.5" style={{ background: cb, border: bdr }}>
            <div className="w-4 h-4 rounded flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#216BE4,#1a5bc7)' }}>
              <svg className="w-2 h-2 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
            </div>
            <span className="text-[7px] font-bold text-white/50" style={{ fontFamily: "'Instrument Serif', serif" }}>Aetheryx AI</span>
          </div>
          {/* Nav */}
          <div className="rounded-lg p-1" style={{ background: cb, border: bdr }}>
            {[{l:'📞 Live Call',a:true},{l:'📋 Call History',a:false},{l:'📊 Analytics',a:false},{l:'⚙️ Settings',a:false}].map(n=>(
              <div key={n.l} className="flex items-center gap-1 px-1.5 py-1 rounded-md text-[7px] mb-0.5" style={n.a?{background:'linear-gradient(135deg,#216BE4,#1a5bc7)',color:'#fff'}:{color:'rgba(255,255,255,0.25)'}}>
                {n.l}
              </div>
            ))}
          </div>
          {/* Agents */}
          <div className="rounded-lg px-2 py-1.5" style={{ background: cb, border: bdr }}>
            <p className="text-[6px] text-white/15 uppercase tracking-wider font-bold mb-1">Agents</p>
            {['🔍 Research','🎯 Strategy','📊 Post-Call','🔗 CRM'].map((a,i)=>(
              <div key={a} className="flex items-center gap-1 py-0.5">
                <span className={`w-1 h-1 rounded-full ${i===0?'bg-emerald-400':'bg-white/10'}`}/>
                <span className={`text-[6px] ${i===0?'text-emerald-400':'text-white/20'}`}>{a}</span>
              </div>
            ))}
          </div>
          {/* Recent */}
          <div className="rounded-lg px-2 py-1.5 mt-auto" style={{ background: cb, border: bdr }}>
            <p className="text-[6px] text-white/15 uppercase tracking-wider font-bold mb-1">Recent</p>
            <div className="flex items-center gap-1 py-0.5"><span className="w-1 h-1 rounded-full bg-amber-400"/><span className="text-[6px] text-white/25">+971521201808</span></div>
            <div className="flex items-center gap-1 py-0.5"><span className="w-1 h-1 rounded-full bg-[#216BE4]"/><span className="text-[6px] text-white/25">+971507587246</span></div>
          </div>
        </div>

        {/* Center Content */}
        <div className="flex-1 flex flex-col p-1.5 sm:p-2 gap-1.5 min-w-0" style={{ borderRight: bdr }}>
          {/* Welcome banner mini */}
          <div className="rounded-lg relative overflow-hidden px-3 py-2" style={{ background: 'linear-gradient(135deg,#0c1a35,#0f1d3a)' }}>
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[6px] font-medium mb-1" style={{ background: 'rgba(33,107,228,0.15)', color: '#5b9cf5' }}>
              <svg className="w-2 h-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
              Welcome to Aetheryx AI
            </span>
            <p className="text-[8px] font-bold text-white/70" style={{ fontFamily: "'Instrument Serif', serif" }}>Your AI Sales Co-Pilot</p>
            <p className="text-[6px] text-white/30 mt-0.5">Real-time call intelligence, prospect research, objection handling.</p>
            <div className="flex gap-1 mt-1.5">
              <span className="px-2 py-0.5 rounded-md text-[6px] font-semibold text-white" style={{ background: 'linear-gradient(135deg,#216BE4,#1a5bc7)' }}>Start a Call</span>
              <span className="px-2 py-0.5 rounded-md text-[6px] text-white/30" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>View Analytics</span>
            </div>
          </div>
          {/* Dialer */}
          <div className="flex-1 rounded-lg flex flex-col items-center justify-center" style={{ background: cb, border: bdr }}>
            <div className="flex items-center gap-1.5 mb-2">
              <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{ background: 'rgba(52,211,153,0.1)' }}>
                <svg className="w-2.5 h-2.5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72"/></svg>
              </div>
              <div>
                <p className="text-[8px] font-semibold text-white/60" style={{ fontFamily: "'Instrument Serif', serif" }}>Start a Sales Call</p>
                <p className="text-[6px] text-white/20">Twilio + Deepgram</p>
              </div>
            </div>
            {/* Phone input */}
            <div className="w-32 h-5 rounded-md mb-1.5 flex items-center justify-center text-[7px] text-white/30 font-mono" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>+1 (555) 123-4567</div>
            {/* Mini dial pad */}
            <div className="grid grid-cols-3 gap-0.5 w-32">
              {['1','2','3','4','5','6','7','8','9','+','0','#'].map(d=>(
                <div key={d} className="h-4 rounded flex items-center justify-center text-[7px] font-mono text-white/30" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>{d}</div>
              ))}
            </div>
            {/* Dial button */}
            <div className="w-32 h-5 rounded-md mt-1.5 flex items-center justify-center gap-1 text-[7px] font-semibold text-white" style={{ background: 'linear-gradient(135deg,#059669,#047857)' }}>
              <svg className="w-2 h-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07"/></svg>
              Dial Number
            </div>
            {/* Mode */}
            <div className="flex items-center gap-1 mt-2">
              <span className="w-1 h-1 rounded-full bg-emerald-400"/>
              <span className="text-[6px] text-white/15">Live Mode</span>
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div className="hidden md:flex flex-col w-[140px] flex-shrink-0 p-1.5 gap-1">
          {/* Agent Pulse */}
          <div className="rounded-lg px-2 py-1.5" style={{ background: cb, border: bdr }}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[8px] font-bold text-white/50" style={{ fontFamily: "'Instrument Serif', serif" }}>Agent Pulse</span>
              <span className="text-[6px] px-1.5 py-0.5 rounded-full font-semibold" style={{ background: 'rgba(52,211,153,0.08)', color: '#34d399' }}>● Live</span>
            </div>
            <div className="grid grid-cols-2 gap-1">
              {[{i:'📞',v:'21',l:'Calls'},{i:'🔗',v:'0',l:'Synced'},{i:'⏱️',v:'0:14',l:'Avg'},{i:'📧',v:'0',l:'Emails'}].map(s=>(
                <div key={s.l} className="rounded-md px-1.5 py-1" style={{ background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.04)' }}>
                  <p className="text-[9px] font-bold text-white/60" style={{ fontFamily: "'Instrument Serif', serif" }}>{s.v}</p>
                  <p className="text-[5px] text-white/20">{s.l}</p>
                </div>
              ))}
            </div>
          </div>
          {/* AI Chat */}
          <div className="rounded-lg flex-1 flex flex-col" style={{ background: cb, border: bdr }}>
            <div className="flex items-center justify-between px-2 py-1.5" style={{ borderBottom: 'rgba(255,255,255,0.04)' }}>
              <div className="flex items-center gap-1">
                <span className="text-[6px]" style={{ color: '#216BE4' }}>✦</span>
                <span className="text-[7px] font-semibold text-white/50" style={{ fontFamily: "'Instrument Serif', serif" }}>AI Assistant</span>
              </div>
              <span className="text-[5px] text-white/15">Always On</span>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center px-2 py-2">
              <span className="text-[14px] text-white/5 mb-1">✦</span>
              <p className="text-[6px] text-white/20 text-center">Your AI sales assistant</p>
              <p className="text-[5px] text-white/10 text-center mt-0.5">Ask about calls or coaching</p>
            </div>
            <div className="px-1.5 py-1" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
              <div className="flex items-center rounded-md px-1.5 h-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                <span className="text-[6px] text-white/15 flex-1">Ask the AI...</span>
                <span className="text-[7px]" style={{ color: '#216BE4' }}>↗</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ScreenPreview({ tab }: { tab: number }) {
  const c = "rounded-md sm:rounded-lg p-2.5 sm:p-3 border border-white/[0.04] bg-white/[0.02]"
  const l = "text-[9px] sm:text-[10px] font-semibold text-white/20 uppercase tracking-wider mb-1.5"
  if (tab===0) return <div className="blink-card p-3 sm:p-5 flex flex-col gap-2 sm:gap-3"><div className="flex justify-between items-center pb-2 border-b border-white/[0.06]"><span className="text-[10px] sm:text-xs font-semibold text-white/50">Live — Acme Corp</span><span className="text-[9px] px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 font-semibold">● LIVE</span></div><div className={c}><p className={l}>Transcript + Probability</p><p className="text-[10px] text-white/40">REP asks about challenges → PROSPECT mentions budget → <span className="text-[#216BE4] font-semibold">74% deal probability</span></p></div><div className={c}><p className={l}>AI Whisper</p><p className="text-[10px] text-white/40 italic">&quot;We get teams onboarded in 2 weeks&quot;</p></div></div>
  if (tab===1) return <div className="blink-card p-3 sm:p-5 flex flex-col gap-2 sm:gap-3"><div className={c}><p className={l}>Summary</p><p className="text-[10px] text-white/40"><b className="text-white/55">Client:</b> Sarah Chen · <b className="text-white/55">Score:</b> <span className="text-[#216BE4]">74%</span> · <b className="text-white/55">Next:</b> CFO demo Thu</p></div><div className={c}><p className={l}>Follow-Up Email</p><p className="text-[10px] text-white/40 italic">Hi Sarah, I&apos;ll send a calendar invite for Thursday...</p></div></div>
  if (tab===2) return <div className="blink-card p-3 sm:p-5 flex flex-col gap-2 sm:gap-3">{[{n:"Sarah Chen",p:"74%",pc:"text-green-400",s:"Sent"},{n:"Mike Torres",p:"41%",pc:"text-orange-400",s:"Pending"},{n:"Priya Nair",p:"88%",pc:"text-green-400",s:"Synced"}].map(r=><div key={r.n} className="flex justify-between text-[10px] bg-white/[0.02] rounded px-3 py-2 border border-white/[0.04]"><span className="text-white/50 font-medium">{r.n}</span><span className={`font-semibold ${r.pc}`}>{r.p}</span><span className="text-white/30">{r.s}</span></div>)}</div>
  return <div className="blink-card p-3 sm:p-5 flex flex-col gap-2 sm:gap-3"><div className="flex gap-2">{[{l:"Avg",v:"67%"},{l:"Calls",v:"142"},{l:"Conv",v:"31%"}].map(k=><div key={k.l} className="flex-1 bg-white/[0.02] rounded p-2 border border-white/[0.04] text-center"><p className="text-[8px] text-white/20 uppercase font-semibold">{k.l}</p><p className="text-base font-bold text-white/70">{k.v}</p></div>)}</div><div className={c}><p className={l}>Top Objections</p>{[{o:"Too expensive",p:78},{o:"Need approval",p:54}].map(x=><div key={x.o} className="flex items-center gap-2 mb-1 text-[10px]"><span className="flex-1 text-white/30">{x.o}</span><div className="flex-[2] h-1 bg-white/[0.04] rounded-full"><div className="h-full bg-[#216BE4]/50 rounded-full" style={{width:`${x.p}%`}}/></div><span className="text-white/30 w-6 text-right">{x.p}%</span></div>)}</div></div>
}

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="dark min-h-screen" style={{ background: "#060a14", color: "#f2f2f2" }}>
      {/* HERO */}
      <div className="relative min-h-screen overflow-hidden">
        <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover z-0 opacity-40"><source src={VIDEO_SRC} type="video/mp4" /></video>
        <div className="absolute inset-0 z-[1]" style={{ background: "radial-gradient(ellipse at center top, rgba(33,107,228,0.15) 0%, rgba(33,107,228,0.06) 30%, transparent 70%)" }} />
        <div className="absolute inset-0 z-[2] bg-gradient-to-b from-transparent via-transparent to-[#060a14]" />
        <StarField />

        <nav className="relative z-10 border-b border-white/[0.06]">
          <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 py-3 sm:py-5 max-w-[90rem] mx-auto">
            <a href="#" className="text-lg sm:text-2xl tracking-tight" style={serif}>Aetheryx<sup className="text-[9px] sm:text-[10px] ml-0.5 text-[#216BE4]">AI</sup></a>
            <ul className="items-center gap-8" style={{display:'none'}} data-nav-cta>{["Features","Agents","Platform","Integrations","Pricing"].map(i=><li key={i}><a href={`#${i.toLowerCase()}`} className="text-sm text-[#b3b3b3] hover:text-white transition-colors">{i}</a></li>)}</ul>
            <div className="flex gap-2 items-center">
              <a href="#pricing" className="btn-ghost-blink text-sm" style={{display:'none'}} data-nav-cta>See Pricing</a>
              <Link href={APP_URL} className="btn-blink text-sm px-6 py-3" style={{display:'none'}} data-nav-cta>Get Started</Link>
              <button className="p-2 text-white/70 hover:text-white rounded-lg hover:bg-white/[0.06] transition-colors" data-nav-burger onClick={()=>setMenuOpen(!menuOpen)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">{menuOpen?<path d="M6 6l12 12M6 18L18 6"/>:<path d="M4 7h16M4 12h16M4 17h16"/>}</svg>
              </button>
            </div>
          </div>
          {menuOpen && (
            <div className="border-t border-white/[0.06] bg-[#060a14]/98 backdrop-blur-xl px-5 py-3 pb-5" data-nav-burger>
              {["Features","Agents","Platform","Integrations","Pricing"].map(i=>(
                <a key={i} href={`#${i.toLowerCase()}`} className="block py-3 text-[15px] text-white/60 hover:text-white transition-colors" onClick={()=>setMenuOpen(false)}>{i}</a>
              ))}
              <div className="mt-4 pt-4 border-t border-white/[0.08] flex gap-3">
                <a href="#pricing" className="btn-ghost-blink flex-1 text-sm text-center py-2.5">Pricing</a>
                <Link href={APP_URL} className="btn-blink flex-1 text-sm text-center py-2.5" onClick={()=>setMenuOpen(false)}>Get Started</Link>
              </div>
            </div>
          )}
        </nav>

        <section className="relative z-10 flex flex-col items-center text-center px-4 sm:px-6 pt-20 sm:pt-28 md:pt-36 pb-24 sm:pb-32">
          <div className="animate-fade-rise mb-6 sm:mb-8"><span className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-full text-[11px] sm:text-xs font-medium border border-[#216BE4]/30 bg-[#216BE4]/10 text-[#216BE4]"><span className="w-1.5 h-1.5 rounded-full bg-[#216BE4] animate-pulse"/>Introducing Aetheryx AI</span></div>
          <h1 className="animate-fade-rise text-[32px] sm:text-5xl md:text-7xl lg:text-[80px] font-normal leading-[0.95] tracking-[-1px] sm:tracking-[-2px] max-w-5xl px-2" style={serif}>Your AI sales co-pilot{" "}<span className="text-[#216BE4]">working for you,</span>{" "}on every call.</h1>
          <p className="animate-fade-rise-delay text-[#b3b3b3] text-sm sm:text-base md:text-lg max-w-2xl mt-5 sm:mt-7 leading-relaxed px-2">The easiest way to close more deals. Live transcription, instant prospect research, On call and Post call Intelligence, auto summaries &amp; follow-ups — all synced to HubSpot / Gmail. No setup, no API keys. Ready in 60 seconds.</p>
          <div className="animate-fade-rise-delay-2 flex flex-col sm:flex-row gap-3 mt-8 sm:mt-10 w-full sm:w-auto px-4 sm:px-0">
            <Link href={APP_URL} className="btn-blink text-sm sm:text-base px-6 sm:px-8 py-3 sm:py-3.5 w-full sm:w-auto text-center">Get my first agent →</Link>
            <a href="#pricing" className="btn-ghost-blink text-sm sm:text-base px-6 sm:px-8 py-3 sm:py-3.5 w-full sm:w-auto text-center">See pricing</a>
          </div>
        </section>

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 -mt-4 sm:-mt-8 mb-[-40px] sm:mb-[-80px] hidden sm:block">
          <div className="animate-fade-rise-delay-3 blink-card p-1 rounded-xl sm:rounded-2xl shadow-2xl shadow-black/60"><DashboardMockup /></div>
        </div>
      </div>

      {/* HOW IT WORKS */}
      <section id="features" className="pt-24 sm:pt-40 pb-16 sm:pb-28 px-4 sm:px-6 section-glow"><div className="max-w-5xl mx-auto"><SectionHeader badge="How it works" title="From cold call to closed deal" sub="Four phases, four AI agents, zero manual work." /><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-10 sm:mt-16">{[{n:"01",t:"Start Call",d:"Click start. Transcribes audio, detects entities in real time."},{n:"02",t:"Live Intelligence",d:"Research Agent + Strategy Agent whisper objection handlers."},{n:"03",t:"Post-Call Report",d:"AI generates summary, probability score, and email draft."},{n:"04",t:"Sync & Send",d:"One click — contact, deal, email pushed to HubSpot + Gmail."}].map((s,i)=><div key={i} className="blink-card p-5 sm:p-6"><span className="text-xs font-mono text-[#216BE4] mb-2 block">{s.n}</span><h3 className="text-sm sm:text-base font-semibold mb-2">{s.t}</h3><p className="text-xs sm:text-sm text-[#b3b3b3] leading-relaxed">{s.d}</p></div>)}</div></div></section>

      {/* AGENTS */}
      <section id="agents" className="py-16 sm:py-28 px-4 sm:px-6 section-glow"><div className="max-w-5xl mx-auto"><SectionHeader badge="AI Agents" title="A team of agents actually working for you" sub="Each agent is independently triggered at the right moment." /><div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mt-10 sm:mt-16">{agents.map(a=><div key={a.name} className="blink-card p-5 sm:p-7"><div className="flex items-start gap-3 sm:gap-4 mb-3"><div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-lg sm:text-xl flex-shrink-0">{a.icon}</div><div><h3 className="text-sm sm:text-base font-semibold">{a.name}</h3><span className="text-xs text-[#216BE4]">{a.trigger}</span></div></div><p className="text-xs sm:text-sm text-[#b3b3b3] leading-relaxed mb-4">{a.desc}</p><div className="flex flex-wrap gap-2 pt-3 border-t border-white/[0.06]"><Chip label="Provider" value={a.provider}/><Chip label="Model" value={a.model}/></div></div>)}</div>
        <div className="blink-card p-4 sm:p-8 mt-6 sm:mt-8 overflow-x-auto"><p className="text-[10px] font-mono uppercase tracking-widest text-white/20 mb-4 sm:mb-6">Agent Workflow</p><div className="flex items-center min-w-[500px]">{[{i:"📞",l:"Input",s:"Call starts",a:true},{i:"🔍",l:"Research",s:"Company · stack"},{i:"🎯",l:"Strategy",s:"Objections"},{i:"📊",l:"Post-Call",s:"Summary · score"},{i:"🔗",l:"Sync",s:"HubSpot + Gmail"}].map((n,idx,arr)=><div key={idx} className="contents"><div className={`flex-1 rounded-lg p-3 sm:p-4 text-center border ${n.a?"bg-[#216BE4]/10 border-[#216BE4]/20":"bg-white/[0.02] border-white/[0.06]"}`}><div className="text-xl sm:text-2xl mb-1">{n.i}</div><div className="text-[10px] sm:text-xs font-semibold text-white/80">{n.l}</div><div className="text-[9px] text-white/30">{n.s}</div></div>{idx<arr.length-1&&<span className="px-1 sm:px-2 text-white/15 text-sm">→</span>}</div>)}</div></div>
      </div></section>

      {/* PLATFORM */}
      <section id="platform" className="py-16 sm:py-28 px-4 sm:px-6 section-glow"><div className="max-w-5xl mx-auto"><SectionHeader badge="Platform" title="Built for every moment of the sale" sub="Four screens with zero cognitive load." />
        <div className="flex gap-1 mt-10 sm:mt-14 mb-4 sm:mb-6 bg-white/[0.03] p-1 rounded-lg border border-white/[0.06] w-full sm:w-fit mx-auto overflow-x-auto">{screens.map((s,i)=><button key={i} onClick={()=>setActiveTab(i)} className={`px-3 sm:px-5 py-2 text-xs sm:text-sm font-medium rounded-md cursor-pointer whitespace-nowrap flex-shrink-0 ${activeTab===i?"bg-[#216BE4] text-white shadow-lg shadow-[#216BE4]/20":"text-[#b3b3b3] hover:text-white hover:bg-white/[0.04]"}`}>{s.tab}</button>)}</div>
        <div className="blink-card p-4 sm:p-10 grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-10"><div><h3 className="text-xl sm:text-2xl font-semibold mb-2 sm:mb-3" style={serif}>{screens[activeTab].title}</h3><p className="text-xs sm:text-sm text-[#b3b3b3] leading-relaxed mb-4">{screens[activeTab].desc}</p><ul className="space-y-2 sm:space-y-3">{screens[activeTab].checks.map((ch,i)=><li key={i} className="flex gap-2 text-xs sm:text-sm"><span className="text-[#216BE4] flex-shrink-0">✓</span><span className="text-white/60">{ch}</span></li>)}</ul></div><ScreenPreview tab={activeTab}/></div>
      </div></section>

      {/* INTEGRATIONS */}
      <section id="integrations" className="py-16 sm:py-28 px-4 sm:px-6 section-glow"><div className="max-w-5xl mx-auto"><SectionHeader badge="Integrations" title="Works with your favorite tools" sub="Seamlessly connects with what your team already uses." />
        <div className="mt-10 sm:mt-16 flex flex-col items-center"><div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6 max-w-3xl w-full">{[{n:"Salesforce",icon:"https://cdn.jsdelivr.net/gh/devicons/devicon/icons/salesforce/salesforce-original.svg"},{n:"Gmail",icon:"https://www.gstatic.com/images/branding/product/2x/gmail_2020q4_48dp.png"},{n:"HubSpot",c:"#FF7A59"},{n:"Slack",icon:"https://cdn.jsdelivr.net/gh/devicons/devicon/icons/slack/slack-original.svg"},{n:"Zoom",c:"#2D8CFF"},{n:"Outlook",c:"#0078D4"},{n:"Deepgram",c:"#13EF93"},{n:"Google Meet",c:"#00832d"}].map(t=><div key={t.n} className="blink-card flex flex-col items-center justify-center p-4 sm:p-6 group hover:border-[#216BE4]/20"><div className="w-10 h-10 sm:w-14 sm:h-14 flex items-center justify-center mb-2 opacity-80 group-hover:opacity-100 transition-all">{t.icon?<img src={t.icon} alt={t.n} className="w-8 h-8 sm:w-10 sm:h-10 object-contain"/>:<div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm" style={{background:t.c}}>{t.n[0]}</div>}</div><span className="text-[10px] sm:text-xs text-white/40 group-hover:text-white/70 font-medium text-center">{t.n}</span></div>)}</div>
          <button className="btn-ghost-blink mt-8 sm:mt-12 px-8 py-3 rounded-full text-xs sm:text-sm">See More Integrations</button>
        </div></div></section>

      {/* CTA */}
      <section id="pricing" className="py-20 sm:py-32 px-4 sm:px-6 text-center section-glow"><div className="max-w-3xl mx-auto"><h2 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-normal mb-4 leading-[0.95]" style={serif}>Your agents are waiting.{" "}<span className="text-[#216BE4]">Tell them what to do.</span></h2><p className="text-[#b3b3b3] text-sm sm:text-lg mb-8 sm:mb-12 max-w-xl mx-auto">Join sales teams using Aetheryx AI to close more deals with real-time intelligence.</p><div className="flex flex-col sm:flex-row justify-center gap-3 px-4 sm:px-0"><Link href={APP_URL} className="btn-blink text-sm sm:text-base px-8 sm:px-10 py-3 sm:py-4 w-full sm:w-auto text-center">Get my first agent →</Link><Link href={APP_URL} className="btn-ghost-blink text-sm sm:text-base px-8 sm:px-10 py-3 sm:py-4 w-full sm:w-auto text-center">Book a Demo</Link></div></div></section>

      {/* FOOTER */}
      <footer className="border-t border-white/[0.06] py-10 sm:py-16 px-4 sm:px-6"><div className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-8 mb-8 sm:mb-12"><div className="col-span-2 sm:col-span-1"><a href="#" className="text-lg sm:text-xl tracking-tight" style={serif}>Aetheryx<sup className="text-[8px] text-[#216BE4] ml-0.5">AI</sup></a><p className="text-xs text-white/30 mt-3 leading-relaxed max-w-[200px]">Real-time sales intelligence. Transcribe, research, whisper, summarize, sync.</p></div>{[{t:"Product",l:["Dashboard","Post-Call","History","Analytics","Pricing"]},{t:"Integrations",l:["HubSpot","Gmail","Deepgram","AssemblyAI","Supabase"]},{t:"Company",l:["About","Blog","Careers","Privacy","Terms"]}].map(c=><div key={c.t}><h4 className="text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-white/30 mb-3 sm:mb-5">{c.t}</h4><ul className="space-y-2 sm:space-y-3">{c.l.map(x=><li key={x}><a href="#" className="text-xs sm:text-sm text-white/25 hover:text-white/60 transition-colors">{x}</a></li>)}</ul></div>)}</div><div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 border-t border-white/[0.06] text-[10px] sm:text-xs text-white/20"><span>© 2026 Aetheryx AI</span><div className="flex gap-4 sm:gap-6"><a href="#" className="hover:text-white/40">Privacy</a><a href="#" className="hover:text-white/40">Terms</a><a href="#" className="hover:text-white/40">Contact</a></div></div></footer>
    </div>
  )
}
