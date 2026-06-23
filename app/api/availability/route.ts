import { NextResponse } from "next/server";
import { getHost, getMeetingType, isDemoMode } from "@/lib/config";
import { createSlotsFromWindows, getTodayDateInputValue } from "@/lib/slots";
import { getSupabaseAdmin, hasSupabaseEnv } from "@/lib/supabase";
import type { AvailabilityWindow, HostId } from "@/lib/types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const hostId = searchParams.get("hostId") || "";
  const meetingTypeId = searchParams.get("meetingTypeId") || "quick";
  const date = searchParams.get("date") || getTodayDateInputValue();

  const host = getHost(hostId);
  const meetingType = getMeetingType(meetingTypeId);

  if (!host || !meetingType) {
    return NextResponse.json({ error: "Invalid host or meeting type." }, { status: 400 });
  }

  if (meetingType.disabled) {
    return NextResponse.json({ error: "This meeting type is not available yet." }, { status: 400 });
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Invalid date." }, { status: 400 });
  }

  let existingBookings: Array<{ start_time: string; end_time: string }> = [];
  let windows: AvailabilityWindow[] = [];

  if (!isDemoMode() && hasSupabaseEnv()) {
    const supabase = getSupabaseAdmin();

    const startOfDay = new Date(`${date}T00:00:00+08:00`);
    const endOfDay = new Date(`${date}T23:59:59+08:00`);

    const [{ data: bookings, error: bookingError }, { data: availability, error: windowError }] =
      await Promise.all([
        supabase
          .from("bookings")
          .select("start_time,end_time")
          .eq("host_id", host.id)
          .in("status", ["pending", "confirmed"])
          .lt("start_time", endOfDay.toISOString())
          .gt("end_time", startOfDay.toISOString()),
        supabase
          .from("availability_windows")
          .select("*")
          .eq("host_id", host.id)
          .eq("available_date", date)
          .order("start_time", { ascending: true })
      ]);

    if (bookingError) {
      return NextResponse.json({ error: bookingError.message }, { status: 500 });
    }

    if (windowError) {
      return NextResponse.json({ error: windowError.message }, { status: 500 });
    }

    existingBookings = bookings || [];
    windows = availability || [];
  }

  // Demo mode deliberately returns no random data.
  // Add date-specific availability in Supabase and set DEMO_MODE=false.
  const slots = createSlotsFromWindows({
    hostId: host.id as HostId,
    date,
    windows,
    durationMinutes: meetingType.durationMinutes,
    existingBookings
  });

  return NextResponse.json({
    mode: isDemoMode() ? "demo-empty" : "supabase",
    date,
    slots
  });
}
