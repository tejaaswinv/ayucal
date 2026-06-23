import type { AvailabilityWindow, HostId, Slot } from "./types";

const formatter = new Intl.DateTimeFormat("en-SG", {
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
  timeZone: "Asia/Singapore"
});

export function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60_000);
}

export function getTodayDateInputValue() {
  const now = new Date();
  const singaporeDate = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Singapore",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(now);

  return singaporeDate;
}

function normalizeTime(time: string) {
  return time.length >= 5 ? time.slice(0, 5) : time;
}

function makeSingaporeDateTime(date: string, time: string) {
  const normalized = normalizeTime(time);
  return new Date(`${date}T${normalized}:00+08:00`);
}

export function createSlotsFromWindows(params: {
  hostId: HostId;
  date: string;
  windows: Array<Pick<AvailabilityWindow, "available_date" | "start_time" | "end_time">>;
  durationMinutes: number;
  existingBookings: Array<{ start_time: string; end_time: string }>;
}): Slot[] {
  const now = new Date();
  const slots: Slot[] = [];

  const windowsForDate = params.windows.filter((window) => window.available_date === params.date);

  for (const window of windowsForDate) {
    const windowStart = makeSingaporeDateTime(params.date, window.start_time);
    const windowEnd = makeSingaporeDateTime(params.date, window.end_time);

    let start = new Date(windowStart);

    while (addMinutes(start, params.durationMinutes) <= windowEnd) {
      const end = addMinutes(start, params.durationMinutes);

      const overlapsBooked = params.existingBookings.some((booking) => {
        const bookedStart = new Date(booking.start_time);
        const bookedEnd = new Date(booking.end_time);
        return start < bookedEnd && end > bookedStart;
      });

      if (start > now && !overlapsBooked) {
        slots.push({
          start: start.toISOString(),
          end: end.toISOString(),
          label: formatter.format(start)
        });
      }

      start = addMinutes(start, params.durationMinutes);
    }
  }

  return slots.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
}

export function buildOutlookCalendarUrl(params: {
  title: string;
  start: string;
  end: string;
  body: string;
}) {
  const startDate = new Date(params.start);
  const endDate = new Date(params.end);

  function singaporeLocal(date: Date) {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Singapore",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    }).formatToParts(date);

    const get = (type: string) => parts.find((part) => part.type === type)?.value || "00";

    return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}:00`;
  }

  const search = new URLSearchParams({
    path: "/calendar/action/compose",
    rru: "addevent",
    subject: params.title,
    startdt: singaporeLocal(startDate),
    enddt: singaporeLocal(endDate),
    body: params.body,
    location: "Online / TBD"
  });

  return `https://outlook.office.com/calendar/deeplink/compose?${search.toString()}`;
}
