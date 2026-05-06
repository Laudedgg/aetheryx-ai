"use client";

import { useRef } from "react";
import { Reveal, useScrollProgress } from "./scroll";

const heights = [42, 65, 38, 80, 58, 92, 72];

export default function IntelligenceLayer() {
  // Scroll progress drives the bar growth + signal sweep
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const p = useScrollProgress(sectionRef);
  // Map p (0..1) into a 0..1 curve that "completes" by 70% scroll
  const grow = Math.max(0, Math.min(1, (p - 0.15) / 0.5));

  // Brief typewriter — driven by scroll progress
  const briefText =
    "Lock infra, then expand";
  const briefVisible = Math.max(0, Math.min(briefText.length, Math.floor(((p - 0.35) / 0.4) * briefText.length)));
  const briefShown = briefText.slice(0, briefVisible);

  return (
    <section className="layer" id="layer" ref={sectionRef}>
      <div className="wrap">
        <Reveal className="layer-head" y={32}>
          <div>
            <div className="eyebrow">The Intelligence Layer</div>
            <h2 className="h2">
              Signals in.<br />Decisions <em>out.</em>
            </h2>
          </div>
          <p className="lede">
            Every rep on your team gets a private analyst that never sleeps. Aetheryx fuses your CRM, comms, calendar, and the open web into a single reasoning graph — then surfaces only what changes the next move.
          </p>
        </Reveal>

        <div className="stack">
          <Reveal className="card c-signal" delay={0} y={40}>
            <div>
              <div className="num">01 / SIGNAL CAPTURE</div>
              <h3>Listen across 38 sources, in real time.</h3>
              <p>Email threads, Gong calls, Salesforce, Slack channels, calendar invites, Crunchbase, news, LinkedIn moves, product telemetry. Everything streams into one reasoning graph.</p>
            </div>
            <div className="signal-viz">
              <svg viewBox="0 0 600 200" preserveAspectRatio="none" aria-hidden="true">
                <defs>
                  <linearGradient id="lg" x1="0" x2="1">
                    <stop offset="0" stopColor="#5B6CFF" stopOpacity="0" />
                    <stop offset=".5" stopColor="#8A6CFF" stopOpacity=".7" />
                    <stop offset="1" stopColor="#7CE7FF" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path
                  d="M0,160 C100,140 140,90 220,100 S360,160 420,120 S560,40 600,60"
                  fill="none"
                  stroke="url(#lg)"
                  strokeWidth="1.5"
                  strokeDasharray="900"
                  strokeDashoffset={900 - 900 * grow}
                  style={{ transition: "stroke-dashoffset .15s linear" }}
                />
                <path d="M0,170 C80,150 160,170 240,130 S400,90 480,110 S580,150 600,140" fill="none" stroke="rgba(183,156,255,.4)" strokeWidth="1" />
                <path d="M0,150 C120,180 200,80 300,90 S440,130 520,90 S600,80 600,80" fill="none" stroke="rgba(124,231,255,.35)" strokeWidth="1" />
                <g fill="rgba(255,255,255,.5)">
                  <circle cx="60" cy="155" r="2" /><circle cx="120" cy="120" r="2" /><circle cx="200" cy="100" r="2" />
                  <circle cx="320" cy="140" r="2" /><circle cx="420" cy="115" r="2" /><circle cx="500" cy="80" r="2" />
                </g>
              </svg>
              <div className="pulse" />
              <div className="pulse p2" />
              <div className="pulse p3" />
            </div>
          </Reveal>

          <Reveal className="card c-graph" delay={80} y={40}>
            <div className="num">02 / REVENUE GRAPH</div>
            <h3>One model of every account, person, and motion.</h3>
            <p>Account, contact, deal — connected and continuously re-scored. No more six dashboards to answer one question.</p>
            <div className="bars">
              {heights.map((h, i) => {
                // Stagger growth across bars based on scroll progress
                const start = i / heights.length * 0.7;
                const end = start + 0.35;
                const local = Math.max(0, Math.min(1, (p - start) / (end - start)));
                const eased = 1 - Math.pow(1 - local, 3);
                return (
                  <div
                    key={i}
                    className="bar"
                    style={{
                      height: `${h * eased}%`,
                      animation: "none", // override CSS keyframe; we drive it from scroll
                      transition: "height .12s linear",
                    }}
                  />
                );
              })}
            </div>
            <div className="legend">
              <span>MON</span><span>TUE</span><span>WED</span><span>THU</span><span>FRI</span><span>SAT</span><span>SUN</span>
            </div>
          </Reveal>

          <Reveal className="card c-route" delay={0} y={40}>
            <div className="num">03 / ADAPTIVE ROUTING</div>
            <h3>The right rep, the right minute.</h3>
            <div className="route-list">
              <div className="route-row">
                <span className="avatar" />
                <div className="who"><b>Northwind&nbsp;Industries</b><small>Renewal · $480K · 11d to close</small></div>
                <span className="badge hot">HOT</span>
              </div>
              <div className="route-row">
                <span className="avatar" style={{ background: "linear-gradient(135deg,#7CE7FF,#5B6CFF)" }} />
                <div className="who"><b>Loopwise</b><small>Champion changed · re-route to Priya</small></div>
                <span className="badge">SHIFT</span>
              </div>
              <div className="route-row">
                <span className="avatar" style={{ background: "linear-gradient(135deg,#FF9CC2,#8A6CFF)" }} />
                <div className="who"><b>Helia&nbsp;Capital</b><small>Pricing page · 4 stakeholders · 2d</small></div>
                <span className="badge">WARM</span>
              </div>
            </div>
          </Reveal>

          <Reveal className="card c-brief" delay={120} y={40}>
            <div className="num">04 / PRE-CALL BRIEFS</div>
            <h3>Walk into every call already prepared.</h3>
            <div className="brief">
              <span className="k">account</span>: <span className="v">Vector/3</span><br />
              <span className="k">stage</span>: <span className="v">Tech eval</span><br />
              <span className="k">attendees</span>: <span className="v">3 (1 new: VP Eng)</span><br />
              <span className="k">last_signal</span>: <span className="v">Reviewed SOC2 ↑</span><br />
              <span className="k">risk</span>: <span className="v">CTO quiet 9d</span><br />
              <span className="k">open_with</span>: <b>“{briefShown}”</b><span className="cursor" />
            </div>
          </Reveal>

          <Reveal className="card c-coach" delay={240} y={40}>
            <div className="num">05 / LIVE COACH</div>
            <h3>An AE in your ear, not on your back.</h3>
            <div className="coach-bub"><small>Prospect · 0:42</small>“Honestly, we've been burned by tools that don't sync to Salesforce…”</div>
            <div className="coach-bub you"><small>Aetheryx · suggest</small>Lead with the bidirectional sync demo — they cited this on the discovery call. Mention Northwind by name.</div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
