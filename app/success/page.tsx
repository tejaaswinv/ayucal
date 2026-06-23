import Link from "next/link";

const formatter = new Intl.DateTimeFormat("en-SG", {
  weekday: "long",
  day: "numeric",
  month: "long",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
  timeZone: "Asia/Singapore"
});

export default function SuccessPage({
  searchParams
}: {
  searchParams: { host?: string; time?: string; mode?: string; outlookUrl?: string };
}) {
  const time = searchParams.time ? formatter.format(new Date(searchParams.time)) : "Selected time";

  return (
    <main className="page">
      <section className="panel" style={{ maxWidth: 760, margin: "0 auto" }}>
        <div className="brand">
          <img className="logo" src="/ayupulse-logo.svg" alt="AyuPulse logo" />
          <div>
            <div className="eyebrow">Request received</div>
            <h1 style={{ fontSize: "clamp(2.8rem, 7vw, 5.5rem)", marginBottom: 0 }}>
              Pending confirmation.
            </h1>
          </div>
        </div>

        <div className="notice">
          <p>Requested meeting with <strong style={{ color: "var(--gold-2)" }}>{searchParams.host || "AyuPulse"}</strong></p>
          <p>Time: <strong style={{ color: "var(--gold-2)" }}>{time}</strong></p>
          <p>Status: <strong>Pending host confirmation</strong></p>
          <p style={{ marginBottom: 0 }}>Mode: <strong>{searchParams.mode || "demo"}</strong></p>
        </div>

        <p className="footer-note">
          The host will receive an email and confirm the appointment from their private AyuPulse dashboard.
        </p>

        <div className="actions">
          {searchParams.outlookUrl ? (
            <a className="btn btn-primary" href={searchParams.outlookUrl} target="_blank" rel="noreferrer">
              Add tentative slot to Outlook
            </a>
          ) : null}
          <Link className="btn btn-secondary" href="/book">Book another</Link>
          <Link className="btn btn-secondary" href="/">Home</Link>
        </div>
      </section>
    </main>
  );
}
