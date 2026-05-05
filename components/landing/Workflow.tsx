"use client";

import { useEffect, useRef, useState } from "react";
import { Reveal, useScrollProgress } from "./scroll";

const FEED_ALL = [
  { t: "14:02", n: "Helia Capital", m: "CFO viewed pricing 3×", high: true },
  { t: "13:48", n: "Loopwise", m: "new VP Eng joined call", high: false },
  { t: "13:21", n: "Vector/3", m: "sandbox seats +6 in 24h", high: false },
  { t: "12:55", n: "Quanta", m: "security review uploaded", high: false },
  { t: "12:30", n: "Monolith", m: "champion left LinkedIn", high: true },
  { t: "12:11", n: "Northwind", m: "renewal at-risk · re-route", high: true },
  { t: "11:48", n: "Polestar", m: "exec sponsor opened deck", high: false },
];

const KPI_TARGETS = {
  coverage: 3.4,
  forecast: 91,
  cycle: 42,
  slip: 1.2,
};

export default function Workflow() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const p = useScrollProgress(sectionRef as React.RefObject<HTMLElement>);

  // KPI count-up driven by scroll progress
  const ease = (x: number) => 1 - Math.pow(1 - x, 3);
  const e = ease(Math.max(0, Math.min(1, (p - 0.1) / 0.5)));
  const coverage = (KPI_TARGETS.coverage * e).toFixed(1);
  const forecast = Math.round(KPI_TARGETS.forecast * e);
  const cycle = Math.round(KPI_TARGETS.cycle * e);
  const slip = (KPI_TARGETS.slip * e).toFixed(1);

  // Live feed: rotate items in once section is in view
  const [feed, setFeed] = useState(FEED_ALL.slice(0, 5));
  const inView = useRef(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          inView.current = entry.isIntersecting;
        });
      },
      { threshold: 0.25 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => {
      if (!inView.current) return;
      setFeed((cur) => {
        const next = [...cur];
        // rotate: take last from FEED_ALL pool not currently in feed
        const inSet = new Set(next.map((i) => i.n + i.t));
        const candidate = FEED_ALL.find((i) => !inSet.has(i.n + i.t));
        if (!candidate) return cur;
        next.unshift(candidate);
        next.pop();
        return next;
      });
    }, 2200);
    return () => window.clearInterval(id);
  }, []);

  // Animated chart line: stroke-dashoffset based on progress
  const lineLen = 1400;
  const draw = Math.max(0, Math.min(1, (p - 0.15) / 0.55));

  return (
    <section className="work" id="work" ref={sectionRef as React.RefObject<HTMLElement>}>
      <div className="wrap">
        <Reveal className="layer-head" y={28}>
          <div>
            <div className="eyebrow">Inside Aetheryx</div>
            <h2 className="h2">Where pipeline <em>lives</em>.</h2>
          </div>
          <p className="lede">
            A single workspace that rolls up every account, every signal, every brief. Every rep gets a copilot that knows their book — every leader gets an honest read on the quarter.
          </p>
        </Reveal>

        <Reveal className="frame" y={48} delay={120}>
          <div className="frame-bar">
            <div className="dots"><i /><i /><i /></div>
            <div className="url">app.aetheryx.ai / pipeline / Q3 — Mid-Market</div>
          </div>
          <div className="frame-body">
            <aside className="side">
              <h4>Workspace</h4>
              <a><span className="ic" /> Home</a>
              <a className="active"><span className="ic" /> Pipeline</a>
              <a><span className="ic" /> Accounts</a>
              <a><span className="ic" /> Briefs</a>
              <a><span className="ic" /> Live Coach</a>
              <a><span className="ic" /> Forecast</a>
              <h4 style={{ marginTop: 22 }}>Lists</h4>
              <a><span className="ic" /> At-risk renewals</a>
              <a><span className="ic" /> CFO viewing pricing</a>
              <a><span className="ic" /> Champion moved</a>
              <a><span className="ic" /> Cold accounts heating</a>
            </aside>

            <div className="main">
              <div className="crumbs">PIPELINE / Q3 / MID-MARKET</div>
              <h2>Mid-Market — Q3</h2>
              <p className="lead">42 deals · $11.8M open · forecast within 4% of plan</p>

              <div className="kpis">
                <div className="kpi">
                  <div className="lab">Coverage</div>
                  <div className="num">{coverage}×</div>
                  <div className="delta">↑ 0.6 vs Q2</div>
                </div>
                <div className="kpi">
                  <div className="lab">Forecast</div>
                  <div className="num">{forecast}%</div>
                  <div className="delta">↑ accuracy</div>
                </div>
                <div className="kpi">
                  <div className="lab">Cycle</div>
                  <div className="num">{cycle}d</div>
                  <div className="delta">↓ 11d</div>
                </div>
                <div className="kpi">
                  <div className="lab">Slip Risk</div>
                  <div className="num">${slip}M</div>
                  <div className="delta down">↑ this week</div>
                </div>
              </div>

              <div className="chart">
                <div className="ch-head">
                  <h5>Pipeline by stage · weighted</h5>
                  <div className="seg">
                    <button>1W</button>
                    <button className="on">4W</button>
                    <button>QTD</button>
                    <button>YTD</button>
                  </div>
                </div>
                <svg viewBox="0 0 700 200" style={{ width: "100%", height: 200 }} preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="ar" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0" stopColor="#8A6CFF" stopOpacity=".55" />
                      <stop offset="1" stopColor="#8A6CFF" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <g stroke="rgba(255,255,255,.06)">
                    <line x1="0" y1="40" x2="700" y2="40" />
                    <line x1="0" y1="90" x2="700" y2="90" />
                    <line x1="0" y1="140" x2="700" y2="140" />
                  </g>
                  <path
                    d="M0,160 C80,150 130,120 200,110 S320,80 380,90 S520,40 600,30 L700,40 L700,200 L0,200 Z"
                    fill="url(#ar)"
                    style={{ opacity: draw }}
                  />
                  <path
                    d="M0,160 C80,150 130,120 200,110 S320,80 380,90 S520,40 600,30 L700,40"
                    fill="none"
                    stroke="#B79CFF"
                    strokeWidth="2"
                    strokeDasharray={lineLen}
                    strokeDashoffset={lineLen - lineLen * draw}
                    style={{ transition: "stroke-dashoffset .12s linear" }}
                  />
                  <path
                    d="M0,180 C80,175 140,165 220,160 S360,140 420,150 S560,120 700,110"
                    fill="none"
                    stroke="rgba(124,231,255,.6)"
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                    style={{ opacity: draw }}
                  />
                  <g fill="#fff" style={{ opacity: draw }}>
                    <circle cx="200" cy="110" r="3" />
                    <circle cx="380" cy="90" r="3" />
                    <circle cx="600" cy="30" r="3" />
                  </g>
                </svg>
              </div>
            </div>

            <aside className="right">
              <h4><span className="live" /> Aetheryx · Live</h4>
              <div className="ai-card">
                <div className="hd">▲ NEXT BEST ACTION</div>
                <p><b>Northwind</b> renewal moved from <i>likely</i> to <i>at risk</i>. Champion (Sara T.) changed roles 22m ago. Loop in exec sponsor, share Q2 ROI memo.</p>
                <div className="actions">
                  <a className="a">Draft email</a>
                  <a className="a">Add to brief</a>
                  <a className="a">Snooze 1d</a>
                </div>
              </div>

              <h4>Signal feed</h4>
              <div className="feed">
                {feed.map((row) => (
                  <div
                    key={row.n + row.t}
                    className={"feed-row" + (row.high ? " high" : "")}
                    style={{
                      animation: "feedIn .55s cubic-bezier(.2,.7,.2,1) both",
                    }}
                  >
                    <div className="t">{row.t}</div>
                    <div>
                      <b>{row.n}</b> — {row.m}
                    </div>
                  </div>
                ))}
              </div>
            </aside>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
