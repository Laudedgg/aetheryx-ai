import { useState } from "react";

const VIDEO_SRC =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260314_131748_f2ca2a28-fed7-44c8-b9a9-bd9acdd5ec31.mp4";

const serif = { fontFamily: "'Instrument Serif', serif" };

const agents = [
  { icon: "🔍", name: "Research Agent", desc: "Researches prospect and company in real-time — surfaces company profile, funding history, tech stack, recent news, and suggested pitch angles.", provider: "Perplexity", model: "sonar-pro", trigger: "Research Prospect" },
  { icon: "🎯", name: "Sales Strategy Agent", desc: "Analyzes live transcript chunks and generates contextual objection handlers, next best questions, and pitch angle recommendations.", provider: "Anthropic", model: "claude-sonnet-4-5", trigger: "Get Suggestions" },
  { icon: "📊", name: "Post-Call Intelligence", desc: "Processes complete call transcript to generate structured summary, deal-closing probability score with signal analysis, and email draft.", provider: "OpenAI", model: "gpt-5.2", trigger: "Generate Report" },
  { icon: "🔗", name: "CRM & Email Sync", desc: "Creates or updates HubSpot contact and deal records, sends follow-up email via Gmail — zero manual entry.", provider: "OpenAI", model: "gpt-4.1", trigger: "Sync & Send" },
];

const screens = [
  { tab: "Live Call", title: "Live Call Dashboard", desc: "Three-column workspace — transcript, research, and AI suggestions visible simultaneously during active calls.", checks: ["Auto-scrolling transcript with speaker diarization", "Client Intelligence — company, funding, tech stack, news", "AI Whisper Panel — objection handlers, pitch angles", "Deal Probability gauge with live signal chips", '"Research Prospect" and "Get Suggestions" CTAs'] },
  { tab: "Post-Call", title: "Post-Call Review", desc: "Review AI-generated summary, deal probability, and follow-up email before syncing.", checks: ["Structured summary — client, outcome, next steps", "Deal probability with signal analysis", "Editable follow-up email — pre-filled", '"Generate Report" triggers Post-Call Agent', '"Sync & Send" triggers CRM Agent'] },
  { tab: "History", title: "Call History", desc: "Browse every past call with transcripts, summaries, and outcomes.", checks: ["Sortable table — Date, Client, Probability, Status", "Expandable detail panel", "Search and filter by date, outcome, company", "One-click re-send or re-sync"] },
  { tab: "Analytics", title: "Analytics Dashboard", desc: "Pipeline overview and rep coaching insights for managers.", checks: ["KPI cards — total calls, avg probability, conversion", "Deal probability trends over time", "Top objections across all reps", "Rep performance leaderboard"] },
];

function App() {
  const [activeTab, setActiveTab] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen" style={{ background: "#060a14", color: "#f2f2f2" }}>

      {/* ═══ HERO ═══ */}
      <div className="relative min-h-screen overflow-hidden">
        <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover z-0 opacity-40">
          <source src={VIDEO_SRC} type="video/mp4" />
        </video>
        <div className="spotlight" />
        <div className="absolute inset-0 z-[2] bg-gradient-to-b from-transparent via-transparent to-[#060a14]" />

        {/* Star field */}
        <StarField />

        {/* Nav */}
        <nav className="relative z-10 border-b border-white/[0.06]">
          <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 py-4 sm:py-5 max-w-[90rem] mx-auto">
            <a href="#" className="text-xl sm:text-2xl tracking-tight" style={serif}>
              Aetheryx<sup className="text-[10px] ml-0.5 text-[#216BE4]">AI</sup>
            </a>
            <ul className="hidden md:flex items-center gap-8">
              {["Features", "Agents", "Platform", "Integrations", "Pricing"].map((item) => (
                <li key={item}>
                  <a href={`#${item.toLowerCase()}`} className="text-sm text-[#b3b3b3] hover:text-white transition-colors">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
            <div className="flex gap-2 sm:gap-3 items-center">
              <button className="btn-ghost-blink hidden sm:block">See Pricing</button>
              <button className="btn-blink text-sm px-4 py-2 sm:px-6 sm:py-3">Get Started</button>
              {/* Mobile menu toggle */}
              <button
                className="md:hidden ml-1 p-2 text-white/60 hover:text-white"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  {mobileMenuOpen ? (
                    <path d="M6 6l12 12M6 18L18 6" />
                  ) : (
                    <path d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
          {/* Mobile menu */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-white/[0.06] bg-[#060a14]/95 backdrop-blur-lg px-4 py-4">
              {["Features", "Agents", "Platform", "Integrations", "Pricing"].map((item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  className="block py-3 text-sm text-[#b3b3b3] hover:text-white border-b border-white/[0.04] last:border-0"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item}
                </a>
              ))}
            </div>
          )}
        </nav>

        {/* Hero Content */}
        <section className="relative z-10 flex flex-col items-center text-center px-4 sm:px-6 pt-20 sm:pt-28 md:pt-36 pb-24 sm:pb-32">
          <div className="animate-fade-rise mb-6 sm:mb-8">
            <span className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-full text-[11px] sm:text-xs font-medium border border-[#216BE4]/30 bg-[#216BE4]/10 text-[#216BE4]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#216BE4] animate-pulse" />
              Introducing Aetheryx AI
            </span>
          </div>

          <h1
            className="animate-fade-rise text-[32px] sm:text-5xl md:text-7xl lg:text-[80px] font-normal leading-[0.95] tracking-[-1px] sm:tracking-[-2px] max-w-5xl px-2"
            style={serif}
          >
            Your AI sales co-pilot{" "}
            <span className="text-[#216BE4]">working for you,</span>{" "}
            on every call.
          </h1>

          <p className="animate-fade-rise-delay text-[#b3b3b3] text-sm sm:text-base md:text-lg max-w-2xl mt-5 sm:mt-7 leading-relaxed px-2">
            The easiest way to close more deals. Live transcription, instant prospect research,
            On call and Post call Intelligence, auto summaries & follow-ups — all synced to HubSpot / Gmail.
            No setup, no API keys. Ready in 60 seconds.
          </p>

          <div className="animate-fade-rise-delay-2 flex flex-col sm:flex-row gap-3 mt-8 sm:mt-10 w-full sm:w-auto px-4 sm:px-0">
            <button className="btn-blink text-sm sm:text-base px-6 sm:px-8 py-3 sm:py-3.5 w-full sm:w-auto">
              Get my first agent →
            </button>
            <button className="btn-ghost-blink text-sm sm:text-base px-6 sm:px-8 py-3 sm:py-3.5 w-full sm:w-auto">
              See pricing
            </button>
          </div>
        </section>

        {/* Dashboard Preview — hidden on very small screens */}
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 -mt-4 sm:-mt-8 mb-[-40px] sm:mb-[-80px] hidden sm:block">
          <div className="animate-fade-rise-delay-3 blink-card p-1 rounded-xl sm:rounded-2xl shadow-2xl shadow-black/60">
            <DashboardMockup />
          </div>
        </div>
      </div>

      {/* ═══ HOW IT WORKS ═══ */}
      <section id="features" className="pt-24 sm:pt-40 pb-16 sm:pb-28 px-4 sm:px-6 section-glow">
        <div className="max-w-5xl mx-auto">
          <Header
            badge="How it works"
            title="From cold call to closed deal"
            sub="Four phases, four AI agents, zero manual work."
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-10 sm:mt-16">
            {[
              { n: "01", t: "Start Call", d: "Click start. Call Listener transcribes audio, detects entities — name, company, role — in real time." },
              { n: "02", t: "Live Intelligence", d: "Research Agent surfaces company intel. Strategy Agent whispers objection handlers and pitch angles." },
              { n: "03", t: "Post-Call Report", d: "AI generates structured summary, deal probability score, and personalized follow-up email draft." },
              { n: "04", t: "Sync & Send", d: "One click — contact, deal, and follow-up email all pushed to HubSpot and Gmail." },
            ].map((step, i) => (
              <div key={i} className="blink-card p-5 sm:p-6 group">
                <span className="text-xs font-mono text-[#216BE4] mb-2 sm:mb-3 block">{step.n}</span>
                <h3 className="text-sm sm:text-base font-semibold mb-2">{step.t}</h3>
                <p className="text-xs sm:text-sm text-[#b3b3b3] leading-relaxed">{step.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ AGENTS ═══ */}
      <section id="agents" className="py-16 sm:py-28 px-4 sm:px-6 section-glow">
        <div className="max-w-5xl mx-auto">
          <Header
            badge="AI Agents"
            title="Here's what a team of agents actually looks like"
            sub="Each agent is independently triggered at the right moment."
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mt-10 sm:mt-16">
            {agents.map((a) => (
              <div key={a.name} className="blink-card p-5 sm:p-7 group">
                <div className="flex items-start gap-3 sm:gap-4 mb-3 sm:mb-4">
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-lg sm:text-xl flex-shrink-0">
                    {a.icon}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm sm:text-base font-semibold truncate">{a.name}</h3>
                    <span className="text-xs text-[#216BE4]">{a.trigger}</span>
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-[#b3b3b3] leading-relaxed mb-4 sm:mb-5">{a.desc}</p>
                <div className="flex flex-wrap gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-white/[0.06]">
                  <Chip label="Provider" value={a.provider} />
                  <Chip label="Model" value={a.model} />
                </div>
              </div>
            ))}
          </div>

          {/* Workflow — scrollable on mobile */}
          <div className="blink-card p-4 sm:p-6 md:p-8 mt-6 sm:mt-8 overflow-x-auto">
            <p className="text-[10px] sm:text-[11px] font-mono uppercase tracking-widest text-white/20 mb-4 sm:mb-6">Agent Workflow</p>
            <div className="flex items-center min-w-[500px] sm:min-w-[650px]">
              {[
                { icon: "📞", label: "Input", sub: "Call starts", active: true },
                { icon: "🔍", label: "Research", sub: "Company · stack" },
                { icon: "🎯", label: "Strategy", sub: "Objections · pitch" },
                { icon: "📊", label: "Post-Call", sub: "Summary · score" },
                { icon: "🔗", label: "Sync", sub: "HubSpot + Gmail" },
              ].map((n, i, arr) => (
                <div key={i} className="contents">
                  <div className={`flex-1 rounded-lg sm:rounded-xl p-3 sm:p-4 text-center border transition-all ${
                    n.active ? "bg-[#216BE4]/10 border-[#216BE4]/20" : "bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04]"
                  }`}>
                    <div className="text-xl sm:text-2xl mb-1">{n.icon}</div>
                    <div className="text-[10px] sm:text-xs font-semibold text-white/80">{n.label}</div>
                    <div className="text-[9px] sm:text-[10px] text-white/30">{n.sub}</div>
                  </div>
                  {i < arr.length - 1 && <span className="px-1 sm:px-2 text-white/15 text-xs sm:text-sm">→</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ PLATFORM ═══ */}
      <section id="platform" className="py-16 sm:py-28 px-4 sm:px-6 section-glow">
        <div className="max-w-5xl mx-auto">
          <Header
            badge="Platform"
            title="Built for every moment of the sale"
            sub="Four purpose-built screens with zero cognitive load."
          />
          {/* Tabs — scrollable on mobile */}
          <div className="flex gap-1 mt-10 sm:mt-14 mb-4 sm:mb-6 bg-white/[0.03] p-1 rounded-lg sm:rounded-xl border border-white/[0.06] w-full sm:w-fit mx-auto overflow-x-auto">
            {screens.map((s, i) => (
              <button
                key={i}
                onClick={() => setActiveTab(i)}
                className={`px-3 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-medium rounded-md sm:rounded-lg transition-all cursor-pointer whitespace-nowrap flex-shrink-0 ${
                  activeTab === i
                    ? "bg-[#216BE4] text-white shadow-lg shadow-[#216BE4]/20"
                    : "text-[#b3b3b3] hover:text-white hover:bg-white/[0.04]"
                }`}
              >
                {s.tab}
              </button>
            ))}
          </div>
          {/* Panel */}
          <div className="blink-card p-4 sm:p-6 md:p-10 grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-10">
            <div>
              <h3 className="text-xl sm:text-2xl font-semibold mb-2 sm:mb-3" style={serif}>{screens[activeTab].title}</h3>
              <p className="text-xs sm:text-sm text-[#b3b3b3] leading-relaxed mb-4 sm:mb-6">{screens[activeTab].desc}</p>
              <ul className="space-y-2 sm:space-y-3">
                {screens[activeTab].checks.map((c, i) => (
                  <li key={i} className="flex gap-2 sm:gap-3 text-xs sm:text-sm">
                    <span className="text-[#216BE4] flex-shrink-0 mt-0.5">✓</span>
                    <span className="text-white/60">{c}</span>
                  </li>
                ))}
              </ul>
            </div>
            <ScreenPreview tab={activeTab} />
          </div>
        </div>
      </section>

      {/* ═══ INTEGRATIONS ═══ */}
      <section id="integrations" className="py-16 sm:py-28 px-4 sm:px-6 section-glow">
        <div className="max-w-5xl mx-auto">
          <Header
            badge="Integrations"
            title="Aetheryx works with all your favorite solutions"
            sub="Seamlessly connects with the tools your team already relies on."
          />
          <div className="mt-10 sm:mt-16 flex flex-col items-center">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6 md:gap-8 max-w-3xl w-full">
              {[
                { name: "Salesforce", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/salesforce/salesforce-original.svg" },
                { name: "Zoom", svg: <svg viewBox="0 0 24 24" className="w-8 h-8 sm:w-10 sm:h-10" fill="#2D8CFF"><path d="M1.5 5.5C1.5 4.395 2.395 3.5 3.5 3.5h11c1.105 0 2 .895 2 2v7c0 1.105-.895 2-2 2h-11c-1.105 0-2-.895-2-2v-7zm15 2.5l4.5-3v10l-4.5-3V8z"/></svg> },
                { name: "Gmail", icon: "https://www.gstatic.com/images/branding/product/2x/gmail_2020q4_48dp.png" },
                { name: "Microsoft Teams", svg: <svg viewBox="0 0 24 24" className="w-8 h-8 sm:w-9 sm:h-9"><path fill="#5059C9" d="M16.5 3.5a2 2 0 110 4 2 2 0 010-4zm3 5h-4.1c.38.56.6 1.24.6 1.97V17a3 3 0 01-.17 1H19.5a2.5 2.5 0 002.5-2.5V11a2.5 2.5 0 00-2.5-2.5z"/><path fill="#7B83EB" d="M13.5 2.5a2.5 2.5 0 110 5 2.5 2.5 0 010-5zM15 8.5H7a2 2 0 00-2 2V17a4 4 0 008 0v-6.5a2 2 0 00-2-2h4z"/><path fill="#fff" opacity="0.2" d="M15 8.5H11v12.26A4 4 0 0015 17V8.5z"/></svg> },
                { name: "HubSpot", svg: <svg viewBox="0 0 24 24" className="w-8 h-8 sm:w-9 sm:h-9" fill="#FF7A59"><path d="M17.08 9.15V6.88a2.24 2.24 0 001.31-2A2.27 2.27 0 0016.12 2.6a2.27 2.27 0 00-2.27 2.27 2.24 2.24 0 001.31 2v2.28a5.3 5.3 0 00-2.44 1.16L6.67 5.88a2.65 2.65 0 00.08-.6 2.62 2.62 0 10-2.62 2.62 2.6 2.6 0 001.54-.51l5.92 4.36a5.35 5.35 0 00-.25 1.61 5.39 5.39 0 00.39 2l-1.73 1.73a2.08 2.08 0 00-.62-.1 2.1 2.1 0 102.1 2.1 2.08 2.08 0 00-.1-.62l1.69-1.69a5.37 5.37 0 103.96-7.64z"/></svg> },
                { name: "Outlook", svg: <svg viewBox="0 0 24 24" className="w-8 h-8 sm:w-9 sm:h-9" fill="#0078D4"><path d="M12 2L2 6v12l10 4 10-4V6L12 2zm-1 18.5l-7-2.8V7.3l7 2.8v10.4zm1-11.3L5.5 6.5 12 3.7l6.5 2.8L12 9.2zm8 7.1l-7 2.8V8.7l7-2.8v10.4z"/></svg> },
                { name: "Google Meet", svg: <svg viewBox="0 0 24 24" className="w-8 h-8 sm:w-9 sm:h-9"><path fill="#00832d" d="M14.5 11L18 7.5V16.5L14.5 13V16H6V8H14.5V11Z"/><path fill="#0066da" d="M6 8H14.5V16H6Z" opacity="0.3"/><path fill="#e37400" d="M18 7.5L14.5 11L18 14.5V16.5L22 13V11L18 7.5Z"/></svg> },
                { name: "Deepgram", svg: <svg viewBox="0 0 24 24" className="w-8 h-8 sm:w-9 sm:h-9" fill="#13EF93"><circle cx="12" cy="12" r="10"/><path d="M8 8h3v8H8V8zm5 0h3v5h-3V8z" fill="#050505"/></svg> },
              ].map((tool) => (
                <div
                  key={tool.name}
                  className="blink-card flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 group hover:border-[#216BE4]/20 transition-all"
                >
                  <div className="w-10 h-10 sm:w-14 sm:h-14 flex items-center justify-center mb-2 sm:mb-3 opacity-80 group-hover:opacity-100 transition-all duration-300">
                    {tool.icon ? (
                      <img src={tool.icon} alt={tool.name} className="w-8 h-8 sm:w-10 sm:h-10 object-contain" />
                    ) : (
                      tool.svg
                    )}
                  </div>
                  <span className="text-[10px] sm:text-xs text-white/40 group-hover:text-white/70 transition-colors font-medium text-center">{tool.name}</span>
                </div>
              ))}
            </div>
            <button className="btn-ghost-blink mt-8 sm:mt-12 px-8 sm:px-10 py-3 sm:py-3.5 rounded-full text-xs sm:text-sm">
              See More Integrations
            </button>
          </div>
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section id="pricing" className="py-20 sm:py-32 px-4 sm:px-6 text-center relative overflow-hidden section-glow">
        <div className="spotlight" style={{ top: "-300px" }} />
        <div className="relative z-10 max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-normal mb-4 sm:mb-5 leading-[0.95]" style={serif}>
            Your agents are waiting.{" "}
            <span className="text-[#216BE4]">Tell them what to do.</span>
          </h2>
          <p className="text-[#b3b3b3] text-sm sm:text-lg mb-8 sm:mb-12 max-w-xl mx-auto">
            Join sales teams using Aetheryx AI to close more deals with real-time intelligence.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 px-4 sm:px-0">
            <button className="btn-blink text-sm sm:text-base px-8 sm:px-10 py-3 sm:py-4 w-full sm:w-auto">
              Get my first agent →
            </button>
            <button className="btn-ghost-blink text-sm sm:text-base px-8 sm:px-10 py-3 sm:py-4 w-full sm:w-auto">
              Book a Demo
            </button>
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="border-t border-white/[0.06] py-10 sm:py-16 px-4 sm:px-6 bg-gradient-to-b from-transparent to-black/20">
        <div className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-8 sm:gap-10 mb-8 sm:mb-12">
          <div className="col-span-2 sm:col-span-1">
            <a href="#" className="text-lg sm:text-xl tracking-tight" style={serif}>
              Aetheryx<sup className="text-[8px] text-[#216BE4] ml-0.5">AI</sup>
            </a>
            <p className="text-xs text-white/30 mt-3 sm:mt-4 leading-relaxed max-w-[200px]">
              Real-time sales intelligence. Transcribe, research, whisper, summarize, sync.
            </p>
          </div>
          {[
            { title: "Product", links: ["Live Dashboard", "Post-Call Review", "Call History", "Analytics", "Pricing"] },
            { title: "Integrations", links: ["HubSpot", "Gmail", "Deepgram", "AssemblyAI", "Supabase"] },
            { title: "Company", links: ["About", "Blog", "Careers", "Privacy", "Terms"] },
          ].map((col) => (
            <div key={col.title}>
              <h4 className="text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-white/30 mb-3 sm:mb-5">{col.title}</h4>
              <ul className="space-y-2 sm:space-y-3">
                {col.links.map((l) => (
                  <li key={l}><a href="#" className="text-xs sm:text-sm text-white/25 hover:text-white/60 transition-colors">{l}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 sm:pt-8 border-t border-white/[0.06] text-[10px] sm:text-xs text-white/20">
          <span>© 2026 Aetheryx AI. All rights reserved.</span>
          <div className="flex gap-4 sm:gap-6">
            <a href="#" className="hover:text-white/40 transition-colors">Privacy</a>
            <a href="#" className="hover:text-white/40 transition-colors">Terms</a>
            <a href="#" className="hover:text-white/40 transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ── Components ── */

function Header({ badge, title, sub }: { badge: string; title: string; sub: string }) {
  return (
    <div className="text-center px-2">
      <span className="inline-block text-[10px] sm:text-[11px] font-mono uppercase tracking-widest text-[#216BE4] mb-3 sm:mb-4">{badge}</span>
      <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-normal mb-3 sm:mb-4 leading-[1.05]" style={serif}>{title}</h2>
      <p className="text-sm sm:text-base text-[#b3b3b3] max-w-lg mx-auto leading-relaxed">{sub}</p>
    </div>
  );
}

function Chip({ label, value }: { label: string; value: string }) {
  return (
    <span className="text-[10px] sm:text-xs text-[#b3b3b3]">
      <span className="text-white/40 font-medium">{label}</span>{" "}
      <span className="inline-flex px-1.5 sm:px-2 py-0.5 rounded bg-white/[0.04] border border-white/[0.06] text-white/60 ml-1">{value}</span>
    </span>
  );
}

function DashboardMockup() {
  return (
    <div className="rounded-lg sm:rounded-xl overflow-hidden" style={{ background: "#080d18" }}>
      <div className="flex items-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 border-b border-white/[0.06]" style={{ background: "#0a1020" }}>
        <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-red-500/60" />
        <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-yellow-500/60" />
        <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-green-500/60" />
        <span className="ml-auto text-[8px] sm:text-[10px] text-white/20 font-mono hidden sm:block">Live Call Dashboard — Aetheryx AI</span>
      </div>
      <div className="grid grid-cols-3 min-h-[220px] sm:min-h-[280px] md:min-h-[320px]">
        {/* Transcript */}
        <div className="p-2.5 sm:p-4 border-r border-white/[0.04] flex flex-col gap-1.5 sm:gap-2 overflow-hidden">
          <div className="flex items-center gap-1.5 mb-0.5 sm:mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-[8px] sm:text-[9px] font-semibold text-red-400 uppercase tracking-wider">Live</span>
          </div>
          <p className="text-[8px] sm:text-[9px] text-white/20 uppercase tracking-wider font-semibold mb-0.5 sm:mb-1">Transcript</p>
          <div>
            <span className="text-[8px] sm:text-[9px] font-bold text-[#216BE4]">REP</span>
            <p className="text-[9px] sm:text-[10px] text-white/40 bg-white/[0.02] rounded p-1 sm:p-1.5 mt-0.5">How are your current tools handling pipeline reporting?</p>
          </div>
          <div>
            <span className="text-[8px] sm:text-[9px] font-bold text-pink-400">PROSPECT</span>
            <p className="text-[9px] sm:text-[10px] text-white/40 bg-white/[0.02] rounded p-1 sm:p-1.5 mt-0.5 border-l-2 border-[#216BE4]/40">It's a mess. We're on HubSpot but nobody uses it...</p>
          </div>
        </div>
        {/* Intel */}
        <div className="p-2.5 sm:p-4 border-r border-white/[0.04] flex flex-col gap-1.5 sm:gap-2 overflow-hidden">
          <p className="text-[8px] sm:text-[9px] text-white/20 uppercase tracking-wider font-semibold mb-0.5 sm:mb-1">Client Intelligence</p>
          <div className="rounded-md sm:rounded-lg p-2 sm:p-2.5 bg-[#216BE4]/[0.06] border border-[#216BE4]/10">
            <p className="text-[8px] sm:text-[9px] text-[#216BE4] font-semibold mb-0.5 sm:mb-1">Company</p>
            <p className="text-[9px] sm:text-[10px] text-white/60 font-semibold">Acme Corp · Series B</p>
            <p className="text-[9px] sm:text-[10px] text-white/40">$12M raised · 320 employees</p>
          </div>
          <div className="rounded-md sm:rounded-lg p-2 sm:p-2.5 bg-[#216BE4]/[0.06] border border-[#216BE4]/10">
            <p className="text-[8px] sm:text-[9px] text-[#216BE4] font-semibold mb-0.5 sm:mb-1">Tech Stack</p>
            <div className="flex flex-wrap gap-0.5 sm:gap-1 mt-0.5 sm:mt-1">
              {["HubSpot", "Salesforce", "Slack"].map(t => (
                <span key={t} className="text-[8px] sm:text-[9px] px-1 sm:px-1.5 py-0.5 rounded bg-[#216BE4]/10 text-[#216BE4]/70">{t}</span>
              ))}
            </div>
          </div>
        </div>
        {/* Probability & Whisper */}
        <div className="p-2.5 sm:p-4 flex flex-col gap-1.5 sm:gap-2 overflow-hidden">
          <div className="rounded-md sm:rounded-lg p-2 sm:p-3 bg-white/[0.02] border border-white/[0.04]">
            <p className="text-[8px] sm:text-[9px] text-white/20 uppercase tracking-wider font-semibold">Deal Probability</p>
            <p className="text-lg sm:text-2xl font-bold text-green-400 mt-0.5 sm:mt-1">74%</p>
            <div className="h-0.5 sm:h-1 bg-white/[0.06] rounded-full mt-1.5 sm:mt-2">
              <div className="h-full w-[74%] rounded-full bg-gradient-to-r from-[#216BE4] to-green-400" />
            </div>
          </div>
          <p className="text-[8px] sm:text-[9px] text-white/20 uppercase tracking-wider font-semibold mt-0.5 sm:mt-1">AI Whisper</p>
          <div className="rounded-md sm:rounded-lg p-1.5 sm:p-2.5 bg-white/[0.02] border border-white/[0.04]">
            <p className="text-[7px] sm:text-[8px] font-bold text-[#216BE4] uppercase tracking-wider mb-0.5 sm:mb-1">💡 Objection</p>
            <p className="text-[8px] sm:text-[10px] text-white/40 leading-snug">"Onboarding gets teams live in 2 weeks."</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ScreenPreview({ tab }: { tab: number }) {
  const card = "rounded-md sm:rounded-lg p-2.5 sm:p-3 border border-white/[0.04]";
  const cardBg = "bg-white/[0.02]";
  const label = "text-[9px] sm:text-[10px] font-semibold text-white/20 uppercase tracking-wider mb-1.5 sm:mb-2";

  if (tab === 0) return (
    <div className="blink-card p-3 sm:p-5 flex flex-col gap-2 sm:gap-3">
      <div className="flex justify-between items-center pb-2 sm:pb-3 border-b border-white/[0.06]">
        <span className="text-[10px] sm:text-xs font-semibold text-white/50">Live Call — Acme Corp</span>
        <span className="text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 font-semibold">● LIVE</span>
      </div>
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
        <div className={`sm:flex-[1.4] ${card} ${cardBg}`}>
          <p className={label}>Transcript</p>
          <p className="text-[9px] sm:text-[10px] text-[#216BE4] font-bold">REP</p>
          <p className="text-[10px] sm:text-[11px] text-white/40 mb-1.5 sm:mb-2">What's your biggest challenge?</p>
          <p className="text-[9px] sm:text-[10px] text-pink-400 font-bold">PROSPECT</p>
          <p className="text-[10px] sm:text-[11px] text-white/40 border-l-2 border-[#216BE4]/40 pl-2">Our team won't adopt without onboarding...</p>
        </div>
        <div className={`sm:flex-1 ${card} ${cardBg} text-center`}>
          <p className={label}>Probability</p>
          <p className="text-xl sm:text-2xl font-bold text-[#216BE4]">74%</p>
          <div className="h-1 bg-white/[0.06] rounded-full mt-1.5 sm:mt-2 mb-1"><div className="h-full w-[74%] bg-[#216BE4] rounded-full" /></div>
          <p className="text-[9px] sm:text-[10px] text-white/25">✓ Budget · ✓ Pain · ✓ DM</p>
        </div>
      </div>
      <div className={`${card} ${cardBg}`}>
        <p className={label}>AI Whisper</p>
        <p className="text-[10px] sm:text-[11px] text-white/40 italic">"We get teams onboarded in 2 weeks — walk through?"</p>
      </div>
    </div>
  );

  if (tab === 1) return (
    <div className="blink-card p-3 sm:p-5 flex flex-col gap-2 sm:gap-3">
      <div className="flex justify-between items-center pb-2 sm:pb-3 border-b border-white/[0.06]">
        <span className="text-[10px] sm:text-xs font-semibold text-white/50">Post-Call — Acme Corp</span>
        <span className="text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full bg-white/[0.06] text-white/40 font-semibold">Ready</span>
      </div>
      <div className={`${card} ${cardBg}`}>
        <p className={label}>Summary</p>
        <p className="text-[10px] sm:text-[11px] text-white/40 leading-relaxed"><b className="text-white/55">Client:</b> Sarah Chen, VP Ops<br/><b className="text-white/55">Pain:</b> Low CRM adoption<br/><b className="text-white/55">Next:</b> CFO demo Thursday<br/><b className="text-white/55">Score:</b> <span className="text-[#216BE4] font-semibold">74%</span></p>
      </div>
      <div className={`${card} ${cardBg}`}>
        <p className={label}>Follow-Up Email</p>
        <p className="text-[10px] sm:text-[11px] text-white/40 italic">Hi Sarah, great call. Calendar invite for CFO demo Thursday...</p>
      </div>
    </div>
  );

  if (tab === 2) {
    const rows = [
      { n: "Sarah Chen", c: "Acme Corp", p: "74%", pc: "text-green-400", s: "Sent", sc: "bg-green-500/10 text-green-400" },
      { n: "Mike Torres", c: "NovaTech", p: "41%", pc: "text-orange-400", s: "Pending", sc: "bg-orange-500/10 text-orange-400" },
      { n: "Priya Nair", c: "CloudBase", p: "88%", pc: "text-green-400", s: "Synced", sc: "bg-green-500/10 text-green-400" },
    ];
    return (
      <div className="blink-card p-3 sm:p-5 flex flex-col gap-2 sm:gap-3">
        <div className="flex justify-between items-center pb-2 sm:pb-3 border-b border-white/[0.06]">
          <span className="text-[10px] sm:text-xs font-semibold text-white/50">Call History</span>
          <span className="text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full bg-white/[0.06] text-white/40 font-semibold">48 calls</span>
        </div>
        <div className="hidden sm:grid grid-cols-[1fr_1fr_44px_56px] gap-2 text-[10px] text-white/20 uppercase font-semibold px-1">
          <span>Client</span><span>Company</span><span>Prob</span><span>Status</span>
        </div>
        {rows.map(r => (
          <div key={r.n} className="flex flex-col sm:grid sm:grid-cols-[1fr_1fr_44px_56px] gap-1 sm:gap-2 text-[10px] sm:text-[11px] bg-white/[0.02] rounded-md sm:rounded-lg px-3 py-2 border border-white/[0.04] sm:items-center">
            <span className="font-medium text-white/50">{r.n} <span className="sm:hidden text-white/25">· {r.c}</span></span>
            <span className="text-white/30 hidden sm:block">{r.c}</span>
            <span className={`font-semibold ${r.pc}`}>{r.p}</span>
            <span className={`text-[9px] px-1.5 py-0.5 rounded text-center w-fit sm:w-auto ${r.sc}`}>{r.s}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="blink-card p-3 sm:p-5 flex flex-col gap-2 sm:gap-3">
      <div className="flex justify-between items-center pb-2 sm:pb-3 border-b border-white/[0.06]">
        <span className="text-[10px] sm:text-xs font-semibold text-white/50">Analytics — Mar 2026</span>
        <span className="text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full bg-white/[0.06] text-white/40 font-semibold">Manager</span>
      </div>
      <div className="flex gap-2">
        {[{ l: "Avg Prob", v: "67%", c: "" }, { l: "This Week", v: "142", c: "" }, { l: "Convert", v: "31%", c: "text-green-400" }].map(k => (
          <div key={k.l} className="flex-1 bg-white/[0.02] rounded-md sm:rounded-lg p-2 sm:p-3 border border-white/[0.04] text-center">
            <p className="text-[8px] sm:text-[9px] text-white/20 uppercase font-semibold">{k.l}</p>
            <p className={`text-base sm:text-lg font-bold ${k.c || "text-white/70"}`}>{k.v}</p>
          </div>
        ))}
      </div>
      <div className={`${card} ${cardBg}`}>
        <p className={label}>Top Objections</p>
        {[{ l: '"Too expensive"', p: 78 }, { l: '"Need approval"', p: 54 }, { l: '"Have a tool"', p: 39 }].map(o => (
          <div key={o.l} className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-1.5 text-[10px] sm:text-[11px]">
            <span className="flex-1 text-white/30 truncate">{o.l}</span>
            <div className="flex-[2] h-1 sm:h-1.5 bg-white/[0.04] rounded-full"><div className="h-full bg-[#216BE4]/50 rounded-full" style={{ width: `${o.p}%` }} /></div>
            <span className="text-white/30 font-semibold w-6 sm:w-7 text-right">{o.p}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Star Field (randomly placed twinkling stars) ── */
function StarField() {
  const stars = Array.from({ length: 80 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    duration: `${2 + Math.random() * 4}s`,
    delay: `${Math.random() * 3}s`,
    type: Math.random() > 0.85 ? "bright" : Math.random() > 0.92 ? "glow" : "",
  }));

  return (
    <div className="starfield">
      {stars.map((s) => (
        <div
          key={s.id}
          className={`star ${s.type}`}
          style={{
            left: s.left,
            top: s.top,
            "--duration": s.duration,
            "--delay": s.delay,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}

export default App;
