import BookingApp from "@/components/BookingApp";
import type { HostId } from "@/lib/types";

export default function HostBookPage({ params }: { params: { host: HostId } }) {
  return (
    <main className="page">
      <section className="book-header panel">
        <img className="book-logo" src="/ayupulse-logo.png" alt="AyuPulse logo" />
        <div>
          <div className="eyebrow">Book a meeting</div>
          <h1>Choose your slot.</h1>
        </div>
      </section>

      <BookingApp initialHostId={params.host} />
    </main>
  );
}
