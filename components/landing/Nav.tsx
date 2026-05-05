"use client";

export default function Nav({ onRequestAccess }: { onRequestAccess?: () => void }) {
  return (
    <nav className="nav">
      <div className="wrap nav-inner">
        <a className="logo" href="#">
          <img className="logo-mark" src="/aetheryx-logo.png" alt="Aetheryx" width={32} height={32} />
          AETHERYX
        </a>
        <div className="nav-links">
          <a href="#layer">Platform</a>
          <a href="#work">Workflow</a>
          <a href="#tiers">Tiers</a>
          <a href="#">Customers</a>
          <a href="#">Changelog</a>
          <a href="#">Docs</a>
        </div>
        <div className="nav-cta">
          <a className="btn btn-ghost" href="#" onClick={(e) => { e.preventDefault(); onRequestAccess?.(); }}>Sign in</a>
          <button className="btn btn-pri" type="button" onClick={() => onRequestAccess?.()}>
            Request access <span className="arr">→</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
