"use client";

import { Reveal } from "./scroll";

export default function Quote() {
  return (
    <section className="quote">
      <div className="wrap">
        <Reveal y={32}>
          <q>
            We replaced four tools, three dashboards, and an entire <em>RevOps Slack channel</em> with Aetheryx. Forecast accuracy went from 62% to 91% in a quarter.
          </q>
        </Reveal>
        <Reveal delay={300} y={20}>
          <div className="att">
            <span className="av" />{" "}
            <b style={{ color: "var(--ink)", fontWeight: 500 }}>Mireille Okafor</b> · CRO, Loopwise
          </div>
        </Reveal>
      </div>
    </section>
  );
}
