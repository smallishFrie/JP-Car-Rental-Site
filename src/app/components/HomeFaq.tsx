import RevealOnScroll from "./RevealOnScroll";

const FAQ_ITEMS: { question: string; answer: string }[] = [
  {
    question: "What do I need to bring at pickup?",
    answer:
      "A valid driver’s license, a matching ID, and proof of insurance for the rental period. Minimum age and deposit rules are confirmed during checkout.",
  },
  {
    question: "How does pricing work?",
    answer:
      "Rates shown are per day in PHP. Your total updates when you choose pickup and return dates. Taxes or location fees, if any, are summarized before you pay.",
  },
  {
    question: "Can I change or cancel a booking?",
    answer:
      "Use your account to review upcoming trips. Change and cancellation rules depend on the vehicle and dates you selected—see the policy callout on the car page before you confirm.",
  },
  {
    question: "Where can I pick up the car?",
    answer:
      "Pickup options depend on the vehicle and availability. You’ll choose or confirm a location as part of booking. Sunday pickups may be by appointment.",
  },
  {
    question: "How do I pay?",
    answer:
      "Checkout is handled through our payment partner (Xendit). You’ll complete payment on a secure flow after you confirm trip details.",
  },
  {
    question: "What if I need help after I book?",
    answer:
      "Sign in and open Account to see booking status and messages. For urgent pickup-day issues, use the contact details on your confirmation email.",
  },
];

export default function HomeFaq() {
  return (
    <section className="home-bottom-section home-faq" aria-labelledby="home-faq-heading">
      <RevealOnScroll>
        <h2 className="home-section-heading" id="home-faq-heading">
          Frequently asked questions
        </h2>
        <div className="home-faq-list">
          {FAQ_ITEMS.map((item) => (
            <details key={item.question} className="home-faq-item">
              <summary className="home-faq-summary">{item.question}</summary>
              <p className="home-faq-answer">{item.answer}</p>
            </details>
          ))}
        </div>
      </RevealOnScroll>
    </section>
  );
}
