import RevealOnScroll from "./RevealOnScroll";

export default function HomeHowItWorks() {
  return (
    <section className="home-steps" aria-labelledby="home-steps-heading">
      <RevealOnScroll className="home-steps-reveal">
        <h2 className="home-steps-heading" id="home-steps-heading">
          How it works
        </h2>
        <ol className="home-steps-grid">
          <li className="home-step">
            <h3 className="home-step-title">Choose your vehicle and dates</h3>
            <p className="home-step-text">Browse the fleet, open a car you like, and select pickup and return on the calendar.</p>
          </li>
          <li className="home-step">
            <h3 className="home-step-title">Confirm your details</h3>
            <p className="home-step-text">Review the rate, location, and trip notes before you head to checkout.</p>
          </li>
          <li className="home-step">
            <h3 className="home-step-title">Pick up and go</h3>
            <p className="home-step-text">Arrive at your chosen location with your booking confirmation and hit the road.</p>
          </li>
        </ol>
      </RevealOnScroll>
    </section>
  );
}
