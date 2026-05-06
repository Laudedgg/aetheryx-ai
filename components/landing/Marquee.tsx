export default function Marquee() {
  const items = [
    { t: "Live transcription", mono: true },
    { t: "real-time\u00a0research", mono: false },
    { t: "Adaptive routing", mono: true },
    { t: "post-call\u00a0intel", mono: false },
    { t: "Strategy coach", mono: true },
    { t: "auto\u00a0follow-up", mono: false },
    { t: "Intent signals", mono: true },
    { t: "knowledge\u00a0graph", mono: false },
    { t: "Objection handling", mono: true },
    { t: "CRM auto-sync", mono: false },
  ];
  const all = [...items, ...items];

  return (
    <section className="marquee">
      <div className="marquee-label">Inside Aetheryx \u2014 every signal that matters</div>
      <div className="track">
        {all.map((it, i) => (
          <span key={i} className={it.mono ? "mono" : ""}>{it.t}</span>
        ))}
      </div>
    </section>
  );
}
