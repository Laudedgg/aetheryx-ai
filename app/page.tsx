'use client'

import { useState } from "react"
import Link from "next/link"

const APP_URL = "/dashboard"

const agents = [
  { icon: "🔍", name: "Research Agent", desc: "Surfaces company profile, funding, tech stack, news, and pitch angles in real-time.", provider: "Perplexity", model: "sonar-pro" },
  { icon: "🎯", name: "Sales Strategy", desc: "Generates objection handlers, next questions, and pitch recommendations live.", provider: "OpenAI", model: "gpt-4.1" },
  { icon: "📊", name: "Post-Call Intel", desc: "Structured summary, deal probability score, and follow-up email draft.", provider: "OpenAI", model: "gpt-4.1" },
  { icon: "🔗", name: "CRM & Email Sync", desc: "Creates HubSpot contacts/deals and sends Gmail follow-ups automatically.", provider: "OpenAI", model: "gpt-4.1" },
]

const integrations = [
  { name: "HubSpot", icon: "🟠" }, { name: "Gmail", icon: "📧" }, { name: "Salesforce", icon: "☁️" },
  { name: "Zoom", icon: "📹" }, { name: "Deepgram", icon: "🎙️" }, { name: "Twilio", icon: "📞" },
  { name: "Pinecone", icon: "🗄️" }, { name: "Outlook", icon: "📬" },
]

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="min-h-screen relative" style={{ background: 'linear-gradient(180deg, #0a0e1a 0%, #060a14 30%, #050510 60%, #030308 100%)', color: '#f0f2f6', fontFamily: "'Manrope', 'Inter', system-ui, sans-serif" }}>

      {/* ══ BLUE RADIAL GLOW ══ */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div style={{ position: 'absolute', top: '-20%', left: '50%', transform: 'translateX(-50%)', width: '140%', height: '800px', background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(30,60,140,0.35), rgba(10,30,80,0.15) 40%, transparent 65%)', pointerEvents: 'none' }} />
      </div>

      {/* ══ STAR FIELD ══ */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {Array.from({ length: 120 }, (_, i) => (
          <div key={i} style={{
            position: 'absolute',
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            width: Math.random() > 0.9 ? '2px' : '1px',
            height: Math.random() > 0.9 ? '2px' : '1px',
            background: '#fff',
            borderRadius: '50%',
            opacity: 0.15 + Math.random() * 0.4,
            animation: `twinkle ${2 + Math.random() * 4}s ease-in-out ${Math.random() * 3}s infinite alternate`,
          }} />
        ))}
      </div>

      {/* ══ NAV ══ */}
      <nav className="relative z-50 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(5,5,5,0.85)', backdropFilter: 'blur(20px)' }}>
        <div className="flex items-center justify-between px-5 sm:px-8 py-4 max-w-7xl mx-auto">
          <Link href="/" className="flex items-center gap-2.5">
            <img src="/logo-icon.jpeg" alt="Aetheryx" className="w-7 h-7 rounded-lg object-cover" />
            <span className="text-[17px] font-bold tracking-tight">Aetheryx</span>
          </Link>
          <ul className="items-center gap-7" style={{ display: 'none' }} data-nav-cta>
            {["Features", "Agents", "Platform", "Integrations"].map(i => (
              <li key={i}><a href={`#${i.toLowerCase()}`} className="text-[13px] text-white/50 hover:text-white transition-colors duration-200">{i}</a></li>
            ))}
          </ul>
          <div className="flex items-center gap-3">
            <Link href={APP_URL} className="text-[13px] font-semibold px-5 py-2 rounded-full transition-all duration-200 hover:bg-white/[0.06]" style={{ display: 'none', border: '1px solid rgba(255,255,255,0.15)', color: '#f0f2f6' }} data-nav-cta>Get Started</Link>
            <button className="p-2 text-white/50 hover:text-white rounded-lg hover:bg-white/[0.06] transition-colors" data-nav-burger onClick={() => setMenuOpen(!menuOpen)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">{menuOpen ? <path d="M6 6l12 12M6 18L18 6" /> : <path d="M4 7h16M4 12h16M4 17h16" />}</svg>
            </button>
          </div>
        </div>
        {menuOpen && (
          <div className="border-t px-5 py-4 space-y-3" style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(5,5,5,0.95)' }} data-nav-burger>
            {["Features", "Agents", "Platform", "Integrations"].map(i => (
              <a key={i} href={`#${i.toLowerCase()}`} onClick={() => setMenuOpen(false)} className="block text-[14px] text-white/40 hover:text-white py-2 transition-colors">{i}</a>
            ))}
            <Link href={APP_URL} className="block text-center text-[13px] font-semibold px-5 py-2.5 rounded-full mt-2" style={{ background: '#0069ff', color: '#fff' }} onClick={() => setMenuOpen(false)}>Get Started</Link>
          </div>
        )}
      </nav>

      {/* ══ HERO ══ */}
      <section className="relative z-10 flex flex-col items-center text-center px-5 pt-20 sm:pt-28 pb-16 sm:pb-24">
        {/* Badge */}
        <div className="mb-6 sm:mb-8">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px] font-semibold tracking-wide" style={{ border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.6)' }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#0069ff', boxShadow: '0 0 8px rgba(0,105,255,0.5)' }} />
            AI-Powered Sales Intelligence
          </span>
        </div>

        <h1 className="text-[36px] sm:text-[52px] md:text-[64px] lg:text-[72px] font-bold leading-[1.05] tracking-[-0.04em] max-w-4xl">
          Close More Deals{" "}
          <span style={{ color: '#0069ff' }}>With AI</span>{" "}
          on Every Call
        </h1>

        <p className="text-[15px] sm:text-[17px] max-w-xl mt-5 sm:mt-7 leading-relaxed tracking-[-0.02em]" style={{ color: 'rgba(255,255,255,0.45)' }}>
          Live transcription, instant prospect research, on-call and post-call intelligence, auto summaries & follow-ups — all synced to HubSpot / Gmail.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 mt-8 sm:mt-10 w-full sm:w-auto">
          <Link href={APP_URL} className="text-[14px] font-semibold px-8 py-3 rounded-full text-white text-center transition-all duration-200 hover:shadow-[0_0_30px_rgba(0,105,255,0.3)]" style={{ background: '#0069ff' }}>
            Get my first agent →
          </Link>
          <a href="#features" className="text-[14px] font-medium px-8 py-3 rounded-full text-center transition-all duration-200 hover:bg-white/[0.06]" style={{ border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.6)' }}>
            See how it works
          </a>
        </div>

        {/* Dashboard Preview */}
        <div className="mt-14 sm:mt-20 w-full max-w-5xl">
          <div className="rounded-[1.35rem] overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)', background: '#0a0a0a', boxShadow: '0 24px 80px -32px rgba(0,80,255,0.15), 0 24px 48px -28px rgba(0,0,0,0.7)' }}>
            <DashboardMockup />
          </div>
        </div>
      </section>

      {/* ══ HOW IT WORKS ══ */}
      <section id="features" className="relative z-10 py-20 sm:py-28 px-5">
        <div className="max-w-5xl mx-auto">
          <SectionHeader badge="How it works" title="From cold call to closed deal" sub="Four phases, four AI agents, zero manual work." />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-14">
            {[
              { n: "01", t: "Start Call", d: "Click start. Transcribes audio and detects entities in real time." },
              { n: "02", t: "Live Intelligence", d: "Research Agent + Strategy Agent whisper objection handlers." },
              { n: "03", t: "Post-Call Report", d: "AI generates summary, probability score, and email draft." },
              { n: "04", t: "Sync & Send", d: "One click — contact, deal, email pushed to HubSpot + Gmail." },
            ].map((s, i) => (
              <div key={i} className="rounded-[1.35rem] p-6 transition-all duration-300 hover:border-white/20 group" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <span className="text-[11px] font-mono mb-3 block" style={{ color: '#0069ff' }}>{s.n}</span>
                <h3 className="text-[15px] font-semibold mb-2 text-white/90">{s.t}</h3>
                <p className="text-[13px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.4)' }}>{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ AGENTS ══ */}
      <section id="agents" className="relative z-10 py-20 sm:py-28 px-5">
        <div className="max-w-5xl mx-auto">
          <SectionHeader badge="AI Agents" title="Four agents working in sync" sub="Each agent is independently triggered at the right moment." />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-14">
            {agents.map(a => (
              <div key={a.name} className="rounded-[1.35rem] p-7 transition-all duration-300 hover:border-white/20 group" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>{a.icon}</div>
                  <div>
                    <h3 className="text-[15px] font-semibold text-white/90">{a.name}</h3>
                    <span className="text-[11px]" style={{ color: '#0069ff' }}>{a.provider} · {a.model}</span>
                  </div>
                </div>
                <p className="text-[13px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.4)' }}>{a.desc}</p>
              </div>
            ))}
          </div>

          {/* Workflow */}
          <div className="rounded-[1.35rem] p-6 sm:p-8 mt-6 overflow-x-auto" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-[10px] font-mono uppercase tracking-widest mb-5" style={{ color: 'rgba(255,255,255,0.2)' }}>Agent Workflow</p>
            <div className="flex items-center min-w-[600px]">
              {[
                { icon: "📞", label: "Input", sub: "Call starts", active: true },
                { icon: "🔍", label: "Research", sub: "Company · stack" },
                { icon: "🎯", label: "Strategy", sub: "Objections · pitch" },
                { icon: "📊", label: "Post-Call", sub: "Summary · score" },
                { icon: "🔗", label: "Sync", sub: "HubSpot + Gmail" },
              ].map((n, i, arr) => (
                <div key={i} className="contents">
                  <div className={`flex-1 rounded-xl p-4 text-center border transition-all ${n.active ? '' : 'hover:bg-white/[0.03]'}`} style={{ background: n.active ? 'rgba(0,105,255,0.08)' : 'rgba(255,255,255,0.02)', borderColor: n.active ? 'rgba(0,105,255,0.2)' : 'rgba(255,255,255,0.06)' }}>
                    <div className="text-2xl mb-1">{n.icon}</div>
                    <div className="text-[12px] font-semibold text-white/80">{n.label}</div>
                    <div className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>{n.sub}</div>
                  </div>
                  {i < arr.length - 1 && <span className="px-2 text-white/10 text-sm">→</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══ INTEGRATIONS ══ */}
      <section id="integrations" className="relative z-10 py-20 sm:py-28 px-5">
        <div className="max-w-5xl mx-auto">
          <SectionHeader badge="Integrations" title="Works with your stack" sub="Seamlessly connects with the tools your team already uses." />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-14 max-w-3xl mx-auto">
            {integrations.map(t => (
              <div key={t.name} className="rounded-[1.35rem] flex flex-col items-center justify-center p-6 sm:p-8 transition-all duration-300 hover:border-white/20 group" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <span className="text-2xl mb-2">{t.icon}</span>
                <span className="text-[12px] font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>{t.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ CTA ══ */}
      <section className="relative z-10 py-24 sm:py-32 px-5 text-center overflow-hidden">
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(0,101,255,0.1), transparent 60%)' }} />
        <div className="relative z-10 max-w-2xl mx-auto">
          <h2 className="text-[28px] sm:text-[40px] md:text-[48px] font-bold leading-[1.1] tracking-[-0.04em] mb-5">
            Your agents are waiting.{" "}
            <span style={{ color: '#0069ff' }}>Tell them what to do.</span>
          </h2>
          <p className="text-[15px] sm:text-[17px] mb-10" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Join sales teams using Aetheryx AI to close more deals with real-time intelligence.
          </p>
          <div className="flex justify-center gap-3 flex-wrap">
            <Link href={APP_URL} className="text-[14px] font-semibold px-10 py-3.5 rounded-full text-white transition-all duration-200 hover:shadow-[0_0_30px_rgba(0,105,255,0.3)]" style={{ background: '#0069ff' }}>
              Get my first agent →
            </Link>
            <a href="#" className="text-[14px] font-medium px-10 py-3.5 rounded-full transition-all duration-200 hover:bg-white/[0.06]" style={{ border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.6)' }}>
              Book a Demo
            </a>
          </div>
        </div>
      </section>

      {/* ══ FOOTER ══ */}
      <footer className="relative z-10 py-12 sm:py-16 px-5" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-8 mb-10">
          <div className="col-span-2 sm:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <img src="/logo-icon.jpeg" alt="Aetheryx" className="w-6 h-6 rounded-md object-cover" />
              <span className="text-[15px] font-bold tracking-tight">Aetheryx</span>
            </Link>
            <p className="text-[13px] leading-relaxed max-w-[200px]" style={{ color: 'rgba(255,255,255,0.3)' }}>Real-time sales intelligence. Transcribe, research, whisper, summarize, sync.</p>
          </div>
          {[
            { t: "Product", l: ["Dashboard", "Post-Call", "History", "Analytics", "Pricing"] },
            { t: "Integrations", l: ["HubSpot", "Gmail", "Deepgram", "Twilio", "Pinecone"] },
            { t: "Company", l: ["About", "Blog", "Careers", "Privacy", "Terms"] },
          ].map(c => (
            <div key={c.t}>
              <h4 className="text-[11px] font-semibold uppercase tracking-widest mb-4" style={{ color: 'rgba(255,255,255,0.25)' }}>{c.t}</h4>
              <ul className="space-y-2.5">{c.l.map(x => <li key={x}><a href="#" className="text-[13px] transition-colors duration-200 hover:text-white/60" style={{ color: 'rgba(255,255,255,0.3)' }}>{x}</a></li>)}</ul>
            </div>
          ))}
        </div>
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 pt-6" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <span className="text-[12px]" style={{ color: 'rgba(255,255,255,0.2)' }}>© 2026 Aetheryx AI</span>
          <div className="flex gap-5">{["Privacy", "Terms", "Contact"].map(x => <a key={x} href="#" className="text-[12px] hover:text-white/40 transition-colors" style={{ color: 'rgba(255,255,255,0.2)' }}>{x}</a>)}</div>
        </div>
      </footer>
    </div>
  )
}

/* ── Components ── */

function SectionHeader({ badge, title, sub }: { badge: string; title: string; sub: string }) {
  return (
    <div className="text-center px-2">
      <span className="inline-block text-[10px] sm:text-[11px] font-mono uppercase tracking-widest mb-3 sm:mb-4" style={{ color: '#0069ff' }}>{badge}</span>
      <h2 className="text-[26px] sm:text-[36px] md:text-[44px] font-bold mb-3 sm:mb-4 leading-[1.1] tracking-[-0.04em]">{title}</h2>
      <p className="text-[14px] sm:text-[15px] max-w-lg mx-auto leading-relaxed" style={{ color: 'rgba(255,255,255,0.4)' }}>{sub}</p>
    </div>
  )
}

function DashboardMockup() {
  const cb = '#0c0c0c'
  const bdr = '1px solid rgba(255,255,255,0.06)'
  return (
    <div style={{ background: '#050505' }}>
      {/* Window chrome */}
      <div className="flex items-center gap-2 px-4 py-2.5" style={{ borderBottom: bdr }}>
        <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'rgba(255,255,255,0.15)' }} />
        <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'rgba(255,255,255,0.15)' }} />
        <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'rgba(255,255,255,0.15)' }} />
        <span className="ml-auto text-[10px] font-mono" style={{ color: 'rgba(255,255,255,0.15)' }}>Aetheryx AI Dashboard</span>
      </div>
      <div className="flex" style={{ minHeight: 380 }}>
        {/* Sidebar */}
        <div className="hidden sm:flex flex-col w-[130px] flex-shrink-0 p-2 gap-1.5" style={{ background: cb, borderRight: bdr }}>
          <div className="flex items-center gap-1.5 px-2 py-1.5">
            <img src="/logo-icon.jpeg" alt="" className="w-4 h-4 rounded object-cover" />
            <span className="text-[8px] font-bold text-white/50">Aetheryx AI</span>
          </div>
          <div className="rounded-lg p-1 space-y-0.5" style={{ background: 'rgba(255,255,255,0.02)', border: bdr }}>
            {[{ l: '📞 Live Call', a: true }, { l: '📋 History', a: false }, { l: '📊 Analytics', a: false }].map(n => (
              <div key={n.l} className="px-2 py-1 rounded-md text-[7px]" style={n.a ? { background: '#0069ff', color: '#fff' } : { color: 'rgba(255,255,255,0.25)' }}>{n.l}</div>
            ))}
          </div>
          <div className="mt-auto px-2">
            <p className="text-[6px] uppercase tracking-wider font-bold mb-1" style={{ color: 'rgba(255,255,255,0.15)' }}>Agents</p>
            {['🔍 Research', '🎯 Strategy', '📊 Post-Call', '🔗 CRM'].map((a, i) => (
              <div key={a} className="flex items-center gap-1 py-0.5">
                <span className={`w-1 h-1 rounded-full ${i === 0 ? 'bg-emerald-400' : ''}`} style={i !== 0 ? { background: 'rgba(255,255,255,0.1)' } : {}} />
                <span className={`text-[6px] ${i === 0 ? 'text-emerald-400' : ''}`} style={i !== 0 ? { color: 'rgba(255,255,255,0.2)' } : {}}>{a}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Center */}
        <div className="flex-1 flex flex-col p-2 gap-1.5" style={{ borderRight: bdr }}>
          <div className="rounded-lg px-3 py-2" style={{ background: 'linear-gradient(135deg, rgba(0,101,255,0.08), rgba(0,101,255,0.03))', border: '1px solid rgba(0,101,255,0.1)' }}>
            <p className="text-[8px] font-bold text-white/60">Your AI Sales Co-Pilot</p>
            <p className="text-[6px]" style={{ color: 'rgba(255,255,255,0.3)' }}>Real-time call intelligence powered by AI agents.</p>
          </div>
          <div className="flex-1 rounded-lg flex flex-col" style={{ background: cb, border: bdr }}>
            <div className="flex items-center justify-between px-3 py-2" style={{ borderBottom: bdr }}>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[8px] font-bold text-white/60">Live Transcript</span>
              </div>
              <span className="text-[7px] text-white/20 font-mono">4 lines</span>
            </div>
            <div className="p-2 space-y-1.5 flex-1">
              {[{ s: 'Rep', t: 'How are your tools handling pipeline?', c: '#0069ff' }, { s: 'Client', t: "It's a mess. Nobody uses HubSpot properly...", c: '#f472b6' }, { s: 'Client', t: 'Our CFO is asking about budget for a solution.', c: '#f472b6' }].map((l, i) => (
                <div key={i} className="rounded-md px-2 py-1.5" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.03)' }}>
                  <span className="text-[7px] font-bold" style={{ color: l.c }}>{l.s}</span>
                  <p className="text-[8px]" style={{ color: 'rgba(255,255,255,0.45)' }}>{l.t}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right */}
        <div className="hidden md:flex flex-col w-[160px] flex-shrink-0 p-2 gap-1.5">
          <div className="rounded-lg p-2.5" style={{ background: cb, border: bdr }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[8px] font-bold text-white/50">Agent Pulse</span>
              <span className="text-[6px] px-1.5 py-0.5 rounded-full font-semibold" style={{ background: 'rgba(52,211,153,0.08)', color: '#34d399' }}>● Live</span>
            </div>
            <div className="grid grid-cols-2 gap-1">
              {[{ v: '47', l: 'Calls' }, { v: '0', l: 'Synced' }, { v: '0:20', l: 'Avg' }, { v: '0', l: 'Emails' }].map(s => (
                <div key={s.l} className="rounded-md p-1.5" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                  <p className="text-[10px] font-bold text-white/60">{s.v}</p>
                  <p className="text-[5px]" style={{ color: 'rgba(255,255,255,0.2)' }}>{s.l}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="flex-1 rounded-lg flex flex-col" style={{ background: cb, border: bdr }}>
            <div className="flex items-center justify-between px-2.5 py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <span className="text-[7px] font-semibold text-white/50">✦ AI Assistant</span>
              <span className="text-[5px]" style={{ color: 'rgba(255,255,255,0.15)' }}>Always On</span>
            </div>
            <div className="flex-1 flex items-center justify-center p-2">
              <p className="text-[6px] text-center" style={{ color: 'rgba(255,255,255,0.15)' }}>Ask about calls, coaching, or follow-ups.</p>
            </div>
            <div className="px-2 py-1.5" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
              <div className="flex items-center rounded-md px-2 h-5" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                <span className="text-[6px]" style={{ color: 'rgba(255,255,255,0.15)' }}>Ask the AI...</span>
                <span className="ml-auto text-[8px]" style={{ color: '#0069ff' }}>↗</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
