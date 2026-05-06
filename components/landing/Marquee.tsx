export default function Marquee() {
  const items = [
    { t: "Northwind", mono: true },
    { t: "obsidian", mono: false },
    { t: "Loopwise", mono: true },
    { t: "helia\u00a0capital", mono: false },
    { t: "Vector/3", mono: true },
    { t: "fern\u00a0&\u00a0forge", mono: false },
    { t: "Polestar AI", mono: true },
    { t: "monolith", mono: false },
    { t: "Quanta", mono: true },
    { t: "halcyon", mono: false },
  ];
  const all = [...items, ...items];

  return (
    <section className="marquee" id="customers">
      <div className="marquee-label">Powering revenue motions for</div>
      <div className="track">
        {all.map((it, i) => (
          <span key={i} className={it.mono ? "mono" : ""}>{it.t}</span>
        ))}
      </div>
    </section>
  );
}
