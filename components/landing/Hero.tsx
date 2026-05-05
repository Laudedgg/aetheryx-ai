"use client";

import { useRef } from "react";
import { useWindowScrollY } from "./scroll";

export default function Hero({ onRequestAccess }: { onRequestAccess?: () => void }) {
  const y = useWindowScrollY();
  const orbRef = useRef<HTMLDivElement | null>(null);

  // Parallax: orb drifts up + scales as user scrolls hero out — more dramatic so
  // mobile users get a clear "mascot rises into frame" experience past the text.
  const orbT = Math.min(y * 0.32, 280);
  const orbScale = 1 + Math.min(y / 1400, 0.22);
  const orbBrightness = 0.95 + Math.min(y / 1600, 0.18);
  const headT = Math.min(y * 0.08, 60);
  const subOpacity = Math.max(1 - y / 600, 0);

  return (
    <header className="hero">
      <div className="hero-grid" style={{ transform: `translate3d(0, ${y * 0.08}px, 0)` }} />

      <div
        className="orb-wrap"
        ref={orbRef}
        aria-hidden="true"
        style={{
          transform: `translate3d(0, ${-orbT}px, 0) scale(${orbScale})`,
          willChange: "transform",
        }}
      >
        <div className="mascot-frame">
          <video
            className="mascot"
            src="/mascot.mp4"
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            style={{
              filter: `saturate(${1 + (orbBrightness - 0.95) * 1.5}) contrast(1.05) brightness(${orbBrightness})`,
            }}
          />
        </div>

        <div className="chip c1" style={{ transform: `translate3d(0, ${y * -0.05}px, 0)` }}>
          <span className="d" style={{ background: "#7CE7FF", boxShadow: "0 0 10px #7CE7FF" }} />
          <span className="lbl">Signal</span> ACME · CFO viewed pricing
        </div>
        <div className="chip c2" style={{ transform: `translate3d(0, ${y * -0.09}px, 0)` }}>
          <span className="d" style={{ background: "#B79CFF", boxShadow: "0 0 10px #B79CFF" }} />
          <span className="lbl">Intent</span> +312% / 7d
        </div>
        <div className="chip c3" style={{ transform: `translate3d(0, ${y * -0.04}px, 0)` }}>
          <span className="d" style={{ background: "#5EE6C9", boxShadow: "0 0 10px #5EE6C9" }} />
          <span className="lbl">Route</span> → Priya K.
        </div>
        <div className="chip c4" style={{ transform: `translate3d(0, ${y * -0.07}px, 0)` }}>
          <span className="d" style={{ background: "#FF9CC2", boxShadow: "0 0 10px #FF9CC2" }} />
          <span className="lbl">Risk</span> Champion left LinkedIn
        </div>
        <div className="chip c5" style={{ transform: `translate3d(0, ${y * -0.06}px, 0)` }}>
          <span className="d" style={{ background: "#F2D29B", boxShadow: "0 0 10px #F2D29B" }} />
          <span className="lbl">Brief</span> 14s ago
        </div>
      </div>

      <div className="wrap hero-text" style={{ position: "relative", transform: `translate3d(0, ${headT}px, 0)` }}>
        <span className="pill">
          <span className="dot" /> <b>v3.1</b> &nbsp;·&nbsp; Adaptive routing, multi-account briefs, live coach
        </span>
        <h1 className="head">
          The intelligence<br />
          layer for <em>modern&nbsp;sales.</em>
        </h1>
        <p className="sub" style={{ opacity: subOpacity }}>
          Aetheryx listens to every signal that matters — across calls, inboxes, calendars, CRMs, and the open web — and delivers reps the next move before they ask. Less reporting. More closing.
        </p>
        <div className="hero-ctas">
          <button className="btn btn-pri" type="button" onClick={() => onRequestAccess?.()}>
            Request access <span className="arr">→</span>
          </button>
        </div>
        <div className="meta-row">
          <span>SOC 2 Type II</span><span>·</span><span>EU + US data residency</span>
          <span className="bar" />
          <span>Trusted by GTM teams at 140+ companies</span>
        </div>
      </div>

      <div className="wrap">
        <div className="strip">
          <div><div className="k">+38%</div><div className="v">Win rate lift, mid-market</div></div>
          <div><div className="k">11.4×</div><div className="v">Faster handoff to AE</div></div>
          <div><div className="k">2,400</div><div className="v">Signals reasoned daily / rep</div></div>
        </div>
      </div>
    </header>
  );
}
