export default function Footer() {
  return (
    <footer>
      <div className="wrap">
        <div className="foot-grid">
          <div>
            <div className="logo" style={{ fontSize: 14 }}>
              <img className="logo-mark" src="/aetheryx-logo.png" alt="Aetheryx" width={28} height={28} /> AETHERYX
            </div>
            <p style={{ marginTop: 14, color: "var(--ink-3)", maxWidth: 280, fontSize: 12.5, lineHeight: 1.6 }}>
              The intelligence layer for modern sales. Headquartered between San Francisco and Lisbon.
            </p>
          </div>
          <div>
            <h5>Product</h5>
            <ul><li><a href="#">Platform</a></li><li><a href="#">Live Coach</a></li><li><a href="#">Briefs</a></li><li><a href="#">Forecast</a></li></ul>
          </div>
          <div>
            <h5>Company</h5>
            <ul><li><a href="#">About</a></li><li><a href="#">Careers</a></li><li><a href="#">Press</a></li><li><a href="#">Manifesto</a></li></ul>
          </div>
          <div>
            <h5>Resources</h5>
            <ul><li><a href="#">Docs</a></li><li><a href="#">API</a></li><li><a href="#">Status</a></li><li><a href="#">Changelog</a></li></ul>
          </div>
          <div>
            <h5>Legal</h5>
            <ul><li><a href="#">Privacy</a></li><li><a href="#">Terms</a></li><li><a href="#">Trust</a></li><li><a href="#">DPA</a></li></ul>
          </div>
        </div>

        <div className="word">A&nbsp;·&nbsp;E&nbsp;·&nbsp;T&nbsp;·&nbsp;H&nbsp;·&nbsp;E&nbsp;·&nbsp;R&nbsp;·&nbsp;Y&nbsp;·&nbsp;X</div>

        <div className="foot-bot">
          <span>© 2026 AETHERYX LABS, INC.</span>
          <span>DUBAI · SF · LISBON</span>
          <span>STATUS · ALL SYSTEMS NOMINAL</span>
        </div>
      </div>
    </footer>
  );
}
