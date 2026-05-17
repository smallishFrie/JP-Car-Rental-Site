import RevealOnScroll from "./RevealOnScroll";

export default function HomeCredibilityStrip() {
  return (
    <section className="home-credibility" aria-label="At a glance">
      <RevealOnScroll className="home-credibility-reveal">
        <ul className="home-credibility-row">
          <li className="home-credibility-item">
            <span className="home-credibility-icon" aria-hidden>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
            </span>
            <span className="home-credibility-label">Book online in minutes</span>
          </li>
          <li className="home-credibility-item">
            <span className="home-credibility-icon" aria-hidden>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </span>
            <span className="home-credibility-label">PHP checkout, optional currency view</span>
          </li>
          <li className="home-credibility-item">
            <span className="home-credibility-icon" aria-hidden>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </span>
            <span className="home-credibility-label">Trips saved to your account</span>
          </li>
        </ul>
      </RevealOnScroll>
    </section>
  );
}
