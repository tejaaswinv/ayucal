"use client";

import { useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import type { AvailabilityWindow, BookingRecord, Host } from "@/lib/types";
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

const dateFormatter = new Intl.DateTimeFormat("en-SG", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Asia/Singapore"
});

type DashboardPayload = {
  host: Host;
  windows: AvailabilityWindow[];
};

type BookingsPayload = {
  host: Host;
  bookings: BookingRecord[];
};

export default function PrivateDashboard() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [sessionReady, setSessionReady] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [payload, setPayload] = useState<DashboardPayload | null>(null);
  const [bookingsPayload, setBookingsPayload] = useState<BookingsPayload | null>(null);
  const [message, setMessage] = useState("");
  const [availableDate, setAvailableDate] = useState(getTodayDateInputValue());
  const [startTime, setStartTime] = useState("16:00");
  const [endTime, setEndTime] = useState("22:00");

  async function getAccessToken() {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token || null;
  }

  async function fetchWithToken(url: string, init?: RequestInit) {
    const token = await getAccessToken();

    if (!token) {
      throw new Error("Please log in again.");
    }

    return fetch(url, {
      ...init,
      headers: {
        ...(init?.headers || {}),
        Authorization: `Bearer ${token}`
      }
    });
  }

  async function loadDashboard() {
    setMessage("");

    const token = await getAccessToken();

    if (!token) {
      setIsLoggedIn(false);
      setPayload(null);
      setBookingsPayload(null);
      return;
    }

    const [availabilityResponse, bookingsResponse] = await Promise.all([
      fetch("/api/dashboard/availability", {
        headers: { Authorization: `Bearer ${token}` }
      }),
      fetch("/api/dashboard/bookings", {
        headers: { Authorization: `Bearer ${token}` }
      })
    ]);

    const availabilityData = await availabilityResponse.json();
    const bookingsData = await bookingsResponse.json();

    if (!availabilityResponse.ok) {
      setMessage(availabilityData.error || "Could not load dashboard.");
      setPayload(null);
      return;
    }

    if (!bookingsResponse.ok) {
      setMessage(bookingsData.error || "Could not load bookings.");
      setBookingsPayload(null);
    } else {
      setBookingsPayload(bookingsData);
    }

    setIsLoggedIn(true);
    setPayload(availabilityData);
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setIsLoggedIn(Boolean(data.session));
      setSessionReady(true);
      if (data.session) loadDashboard();
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(Boolean(session));
      if (session) loadDashboard();
      else {
        setPayload(null);
        setBookingsPayload(null);
      }
    });

    return () => listener.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function signIn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setMessage(error.message);
      return;
    }

    await loadDashboard();
  }

  async function signOut() {
    await supabase.auth.signOut();
    setPayload(null);
    setBookingsPayload(null);
    setIsLoggedIn(false);
  }

  async function addWindow(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    const response = await fetchWithToken("/api/dashboard/availability", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        available_date: availableDate,
        start_time: startTime,
        end_time: endTime
      })
    });

    const data = await response.json();

    if (!response.ok) {
      setMessage(data.error || "Could not add availability.");
      return;
    }

    setMessage("Availability added.");
    await loadDashboard();
  }

  async function deleteWindow(id?: string) {
    if (!id) return;

    const response = await fetchWithToken(`/api/dashboard/availability?id=${id}`, {
      method: "DELETE"
    });

    const data = await response.json();

    if (!response.ok) {
      setMessage(data.error || "Could not remove availability.");
      return;
    }

    setMessage("Availability removed.");
    await loadDashboard();
  }

  async function updateBooking(bookingId: string, action: "confirm" | "cancel") {
    setMessage("");

    const response = await fetchWithToken("/api/dashboard/bookings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId, action })
    });

    const data = await response.json();

    if (!response.ok) {
      setMessage(data.error || "Could not update booking.");
      return;
    }

    setMessage(action === "confirm" ? "Booking confirmed." : "Booking cancelled.");
    await loadDashboard();
  }

  const pendingBookings = bookingsPayload?.bookings.filter((booking) => booking.status === "pending") || [];
  const confirmedBookings = bookingsPayload?.bookings.filter((booking) => booking.status === "confirmed") || [];

  if (!sessionReady) return <div className="notice">Loading secure dashboard...</div>;

  if (!isLoggedIn) {
    return (
      <section className="dashboard-shell">
        <div className="dashboard-hero panel minimal-hero">
          <div className="brand">
            <img className="logo large-logo" src="/ayupulse-logo.png" alt="AyuPulse logo" />
            <div>
              <div className="eyebrow">Private dashboard</div>
              <h1>Host sign in.</h1>
              <p>Manage your own AyuPulse availability and booking requests.</p>
            </div>
          </div>
        </div>

        <form className="panel login-card" onSubmit={signIn}>
          <h2>Login</h2>

          <label>
            Email
            <input
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>

          <button className="btn btn-primary btn-full" type="submit">Sign in</button>

          {message ? <p className="footer-note error">{message}</p> : null}
        </form>
      </section>
    );
  }

  return (
    <section className="dashboard-shell">
      <div className="dashboard-hero panel minimal-hero">
        <div className="brand">
          <img className="logo large-logo" src="/ayupulse-logo.png" alt="AyuPulse logo" />
          <div>
            <div className="eyebrow">Private dashboard</div>
            <h1>{payload?.host.name || "Host"} schedule.</h1>
            <p>Add exact dates and time windows for public booking.</p>
          </div>
        </div>

        <button className="btn btn-secondary" onClick={signOut} type="button">Sign out</button>
      </div>

      <div className="dashboard-grid">
        <form className="panel" onSubmit={addWindow}>
          <h2>Add date availability</h2>

          <label>
            Date
            <input
              type="date"
              min={getTodayDateInputValue()}
              value={availableDate}
              onChange={(event) => setAvailableDate(event.target.value)}
              required
            />
          </label>

          <label>
            Start time
            <input type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} required />
          </label>

          <label>
            End time
            <input type="time" value={endTime} onChange={(event) => setEndTime(event.target.value)} required />
          </label>

          <button className="btn btn-primary btn-full" type="submit">Add availability</button>
          {message ? <p className="footer-note success">{message}</p> : null}
        </form>

        <div className="panel">
          <h2>Upcoming availability</h2>

          {!payload?.windows.length ? (
            <div className="notice">No availability added yet.</div>
          ) : (
            <div className="rules-list">
              {payload.windows.map((window) => (
                <div className="rule-card" key={window.id}>
                  <div>
                    <strong>
                      {dateFormatter.format(new Date(`${window.available_date}T00:00:00+08:00`))}
                    </strong>
                    <span>{String(window.start_time).slice(0, 5)} – {String(window.end_time).slice(0, 5)}</span>
                  </div>
                  <button className="delete-btn" type="button" onClick={() => deleteWindow(window.id)}>
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="panel">
        <div className="section-heading">
          <span className="step">01</span>
          <div>
            <h2>Pending requests</h2>
            <p>Confirm only the appointments you want to accept.</p>
          </div>
        </div>

        {!pendingBookings.length ? (
          <div className="notice">No pending requests.</div>
        ) : (
          <div className="booking-cards">
            {pendingBookings.map((booking) => (
              <div className="booking-card pending" key={booking.id}>
                <div>
                  <strong>{formatter.format(new Date(booking.start_time))}</strong>
                  <p>{booking.guest_name} · {booking.guest_email}</p>
                  <p>Telegram: {booking.guest_telegram}</p>
                  {booking.agenda ? <p>Agenda: {booking.agenda}</p> : null}
                </div>
                <div className="booking-actions">
                  {booking.outlook_url ? (
                    <a className="btn btn-secondary" href={booking.outlook_url} target="_blank" rel="noreferrer">
                      Add to Outlook
                    </a>
                  ) : null}
                  <button className="btn btn-primary" onClick={() => updateBooking(booking.id, "confirm")} type="button">
                    Confirm
                  </button>
                  <button className="delete-btn" onClick={() => updateBooking(booking.id, "cancel")} type="button">
                    Cancel
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="panel">
        <div className="section-heading">
          <span className="step">02</span>
          <div>
            <h2>Confirmed appointments</h2>
            <p>Accepted appointments for your account.</p>
          </div>
        </div>

        {!confirmedBookings.length ? (
          <div className="notice">No confirmed appointments yet.</div>
        ) : (
          <div className="booking-cards">
            {confirmedBookings.map((booking) => (
              <div className="booking-card" key={booking.id}>
                <div>
                  <strong>{formatter.format(new Date(booking.start_time))}</strong>
                  <p>{booking.guest_name} · {booking.guest_email}</p>
                  <p>Telegram: {booking.guest_telegram}</p>
                </div>
                {booking.outlook_url ? (
                  <a className="btn btn-secondary" href={booking.outlook_url} target="_blank" rel="noreferrer">
                    Add to Outlook
                  </a>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
