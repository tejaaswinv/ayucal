"use client";

import { useEffect, useMemo, useState } from "react";
import { hosts, meetingTypes } from "@/lib/config";
import type { HostId, MeetingType, Slot } from "@/lib/types";
import { getTodayDateInputValue } from "@/lib/slots";

const formatter = new Intl.DateTimeFormat("en-SG", {
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
  timeZone: "Asia/Singapore"
});

const longDateFormatter = new Intl.DateTimeFormat("en-SG", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Asia/Singapore"
});

export default function BookingApp({ initialHostId }: { initialHostId?: HostId }) {
  const [hostId, setHostId] = useState<HostId>(initialHostId || "tejaaswin");
  const [meetingTypeId, setMeetingTypeId] = useState<MeetingType["id"]>("quick");
  const [selectedDate, setSelectedDate] = useState(getTodayDateInputValue());
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const host = hosts.find((item) => item.id === hostId)!;
  const meetingType = meetingTypes.find((item) => item.id === meetingTypeId)!;

  useEffect(() => {
    async function loadSlots() {
      setLoadingSlots(true);
      setMessage("");
      setSelectedSlot(null);

      const response = await fetch(
        `/api/availability?hostId=${hostId}&meetingTypeId=${meetingTypeId}&date=${selectedDate}`
      );
      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error || "Could not load slots.");
        setSlots([]);
      } else {
        setSlots(data.slots || []);
      }

      setLoadingSlots(false);
    }

    if (!meetingType.disabled) {
      loadSlots();
    }
  }, [hostId, meetingTypeId, selectedDate, meetingType.disabled]);

  const summaryTime = useMemo(() => {
    if (!selectedSlot) return "Select a slot";
    return formatter.format(new Date(selectedSlot.start));
  }, [selectedSlot]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (!selectedSlot) {
      setMessage("Please select a time slot first.");
      return;
    }

    const formData = new FormData(event.currentTarget);
    setSubmitting(true);

    const response = await fetch("/api/book", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        hostId,
        meetingTypeId,
        start: selectedSlot.start,
        guestName: formData.get("guestName"),
        guestEmail: formData.get("guestEmail"),
        guestTelegram: formData.get("guestTelegram"),
        agenda: formData.get("agenda")
      })
    });

    const data = await response.json();

    if (!response.ok) {
      setMessage(data.error || "Could not create booking.");
      setSubmitting(false);
      return;
    }

    const params = new URLSearchParams({
      host: host.name,
      time: selectedSlot.start,
      mode: data.mode || "supabase",
      outlookUrl: data.outlookUrl || ""
    });

    window.location.href = `/success?${params.toString()}`;
  }

  return (
    <section className="booking-grid">
      <div className="panel clean-panel">
        <div className="section-heading">
          <span className="step">01</span>
          <div>
            <h2>Choose host</h2>
            <p>Select who you would like to meet.</p>
          </div>
        </div>

        <div className="options-grid">
          {hosts.map((item) => (
            <button
              key={item.id}
              className={`option-card ${item.id === hostId ? "active" : ""}`}
              onClick={() => setHostId(item.id)}
              type="button"
            >
              <h3>{item.name}</h3>
              <p>{item.role}</p>
            </button>
          ))}
        </div>

        <div className="section-heading" style={{ marginTop: 32 }}>
          <span className="step">02</span>
          <div>
            <h2>Select duration</h2>
            <p>Choose a meeting length.</p>
          </div>
        </div>

        <div className="options-grid type-grid">
          {meetingTypes.map((item) => (
            <button
              key={item.id}
              className={`option-card ${item.id === meetingTypeId ? "active" : ""} ${item.disabled ? "disabled" : ""}`}
              onClick={() => {
                if (!item.disabled) setMeetingTypeId(item.id);
              }}
              type="button"
              disabled={item.disabled}
            >
              <h3>
                {item.durationMinutes} min
                {item.badge ? <span className="badge">{item.badge}</span> : null}
              </h3>
              <p>{item.title}</p>
            </button>
          ))}
        </div>

        <div className="section-heading" style={{ marginTop: 32 }}>
          <span className="step">03</span>
          <div>
            <h2>Pick date</h2>
            <p>Only dates added by the host will show available slots.</p>
          </div>
        </div>

        <div className="date-picker-card">
          <label>
            Appointment date
            <input
              type="date"
              value={selectedDate}
              min={getTodayDateInputValue()}
              onChange={(event) => setSelectedDate(event.target.value)}
            />
          </label>
          <div>
            <strong>{longDateFormatter.format(new Date(`${selectedDate}T00:00:00+08:00`))}</strong>
            <span>Singapore time</span>
          </div>
        </div>

        <div className="section-heading" style={{ marginTop: 32 }}>
          <span className="step">04</span>
          <div>
            <h2>Pick time</h2>
            <p>Slots are split automatically based on selected duration.</p>
          </div>
        </div>

        {loadingSlots ? (
          <div className="notice">Loading available slots...</div>
        ) : slots.length === 0 ? (
          <div className="notice">
            No available slots on this date. Choose another date or contact the host.
          </div>
        ) : (
          <div className="slots compact-slots">
            {slots.map((slot) => (
              <button
                key={slot.start}
                className={`slot ${selectedSlot?.start === slot.start ? "active" : ""}`}
                onClick={() => setSelectedSlot(slot)}
                type="button"
              >
                <strong>{formatter.format(new Date(slot.start))}</strong>
                <span>15-minute slot</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <aside className="panel sticky clean-panel">
        <div className="summary">
          <h2>Booking summary</h2>
          <div className="summary-row">
            <span>Host</span>
            <strong>{host.name}</strong>
          </div>
          <div className="summary-row">
            <span>Date</span>
            <strong>{selectedDate}</strong>
          </div>
          <div className="summary-row">
            <span>Time</span>
            <strong>{summaryTime}</strong>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <label>
            Your name
            <input name="guestName" placeholder="Enter your full name" required />
          </label>

          <label>
            Email
            <input name="guestEmail" type="email" placeholder="you@example.com" required />
          </label>

          <label>
            Telegram handle
            <input name="guestTelegram" placeholder="@yourhandle" required />
          </label>

          <label>
            Agenda
            <textarea name="agenda" rows={4} placeholder="What would you like to discuss?" />
          </label>

          <button className="btn btn-primary btn-full" type="submit" disabled={submitting}>
            {submitting ? "Requesting..." : "Request meeting"}
          </button>

          {message ? <p className="footer-note error">{message}</p> : null}
        </form>
      </aside>
    </section>
  );
}
