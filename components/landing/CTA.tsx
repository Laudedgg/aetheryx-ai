"use client";

import { Reveal } from "./scroll";

export default function CTA({ onRequestAccess }: { onRequestAccess?: () => void }) {
  return (
    <section className="cta" id="cta">
      <div className="wrap">
        <Reveal y={40}>
          <h2>
            Sell on a <em>different</em><br />plane.
          </h2>
        </Reveal>
        <Reveal y={20} delay={200}>
          <p>
            Aetheryx is rolling out to a small set of revenue teams each month. Tell us about your motion — we&apos;ll be in touch within a week.
          </p>
        </Reveal>
        <Reveal y={16} delay={350}>
          <div className="cta-row">
            <button className="btn btn-pri" type="button" onClick={() => onRequestAccess?.()}>Request access <span className="arr">→</span></button>
            <a className="btn btn-out" href="mailto:bas.ai.agents@gmail.com?subject=Aetheryx%20Founder%20Chat">Talk to founders</a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
