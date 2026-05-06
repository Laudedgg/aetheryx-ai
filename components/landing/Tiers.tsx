"use client";

import { Reveal } from "./scroll";

export default function Tiers() {
  return (
    <section id="tiers">
      <div className="wrap">
        <Reveal className="layer-head" y={28}>
          <div>
            <div className="eyebrow">Tiers</div>
            <h2 className="h2">Built for the <em>full</em> motion.</h2>
          </div>
          <p className="lede">
            Start with one team. Scale across the GTM org. Aetheryx adapts to where revenue actually lives in your company.
          </p>
        </Reveal>

        <div className="grid3">
          <Reveal className="pcard" y={32} delay={0}>
            <span className="tag">Aetheryx · Lite</span>
            <h4>For founder-led teams</h4>
            <p>The intelligence layer, distilled. Rep-grade copilot, briefs, and live coach for teams under 12 reps.</p>
            <ul>
              <li>Up to 3 CRM-adjacent integrations</li>
              <li>Pre-call briefs &amp; live coach</li>
              <li>Single workspace, shared lists</li>
            </ul>
          </Reveal>
          <Reveal className="pcard hi" y={32} delay={120}>
            <span className="tag lit">Aetheryx · Core</span>
            <h4>For scaling RevOrgs</h4>
            <p>Everything in Lite plus the full reasoning graph, adaptive routing, and forecasting that the CRO can defend.</p>
            <ul>
              <li>Full reasoning graph &amp; 38 sources</li>
              <li>Adaptive routing &amp; risk scoring</li>
              <li>Forecast workspace, exportable</li>
              <li>SSO, SCIM, audit trails</li>
            </ul>
          </Reveal>
          <Reveal className="pcard" y={32} delay={240}>
            <span className="tag">Aetheryx · Atlas</span>
            <h4>For public-co revenue ops</h4>
            <p>Multi-tenant rollups, regional residency, custom reasoning, and a named architect to own your deployment.</p>
            <ul>
              <li>EU + US + APAC residency</li>
              <li>Custom signal sources &amp; agents</li>
              <li>Named TAM &amp; field architect</li>
              <li>Quarterly business reviews</li>
            </ul>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
