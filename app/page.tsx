import Link from "next/link";

export default function HomePage() {
  return (
    <main className="page">
      <section className="landing-clean panel">
        <img className="hero-brand-logo" src="/ayupulse-logo.png" alt="AyuPulse logo" />

        <div className="eyebrow">AyuPulse Scheduler</div>

        <h1>Book a conversation with AyuPulse.</h1>

        <p>
          Choose a host, select an available date, and request a focused 15-minute meeting.
        </p>

        <Link className="btn btn-primary" href="/book">
          Book a meeting
        </Link>
      </section>
    </main>
  );
}
