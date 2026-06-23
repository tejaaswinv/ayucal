import { NextResponse } from "next/server";
import { addMinutes, buildOutlookCalendarUrl } from "@/lib/slots";
import { getHost, getMeetingType, isDemoMode } from "@/lib/config";
import { getSupabaseAdmin, hasSupabaseEnv } from "@/lib/supabase";
import { buildGuestPendingEmail, buildHostConfirmationEmail, sendEmail } from "@/lib/email";
import type { BookingRequest } from "@/lib/types";

const formatter = new Intl.DateTimeFormat("en-SG", {
  weekday: "long",
  day: "numeric",
  month: "long",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
  timeZone: "Asia/Singapore"
});

export async function POST(request: Request) {
  const body = (await request.json()) as BookingRequest;

  const host = getHost(body.hostId);
  const meetingType = getMeetingType(body.meetingTypeId);

  if (!host || !meetingType) {
    return NextResponse.json({ error: "Invalid host or meeting type." }, { status: 400 });
  }

  if (meetingType.disabled) {
    return NextResponse.json({ error: "This meeting type is not available yet." }, { status: 400 });
  }

  if (!body.guestName || !body.guestEmail || !body.guestTelegram || !body.start) {
    return NextResponse.json({ error: "Missing required booking fields." }, { status: 400 });
  }

  const start = new Date(body.start);
  const end = addMinutes(start, meetingType.durationMinutes);

  const meetingTitle = `${meetingType.title} with ${host.name}`;
  const formattedTime = formatter.format(start);
  const eventBody = [
    `Guest: ${body.guestName}`,
    `Guest email: ${body.guestEmail}`,
    `Telegram: ${body.guestTelegram}`,
    `Host: ${host.name}`,
    `Status: Pending host confirmation`,
    `Agenda: ${body.agenda || "Not provided"}`,
    "",
    "This booking was created through AyuPulse Scheduler."
  ].join("\n");

  const outlookUrl = buildOutlookCalendarUrl({
    title: meetingTitle,
    start: start.toISOString(),
    end: end.toISOString(),
    body: eventBody
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const dashboardUrl = `${appUrl}/dashboard`;
  const confirmationToken = crypto.randomUUID();

  if (!isDemoMode() && hasSupabaseEnv()) {
    const supabase = getSupabaseAdmin();

    const { data: clashes, error: clashError } = await supabase
      .from("bookings")
      .select("id")
      .eq("host_id", host.id)
      .in("status", ["pending", "confirmed"])
      .lt("start_time", end.toISOString())
      .gt("end_time", start.toISOString());

    if (clashError) {
      return NextResponse.json({ error: clashError.message }, { status: 500 });
    }

    if (clashes && clashes.length > 0) {
      return NextResponse.json(
        { error: "This slot was just requested or booked. Please select another slot." },
        { status: 409 }
      );
    }

    const { data, error } = await supabase
      .from("bookings")
      .insert({
        host_id: host.id,
        meeting_type_id: meetingType.id,
        guest_name: body.guestName,
        guest_email: body.guestEmail,
        guest_telegram: body.guestTelegram,
        agenda: body.agenda || "",
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        status: "pending",
        outlook_url: outlookUrl,
        confirmation_token: confirmationToken
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    try {
      await sendEmail({
        to: host.email,
        subject: `Confirm AyuPulse meeting: ${body.guestName} at ${formattedTime}`,
        html: buildHostConfirmationEmail({
          hostName: host.name,
          guestName: body.guestName,
          guestEmail: body.guestEmail,
          guestTelegram: body.guestTelegram,
          agenda: body.agenda,
          meetingTitle,
          formattedTime,
          dashboardUrl,
          outlookUrl
        })
      });

      await sendEmail({
        to: body.guestEmail,
        subject: `AyuPulse booking request received: ${formattedTime}`,
        html: buildGuestPendingEmail({
          guestName: body.guestName,
          hostName: host.name,
          meetingTitle,
          formattedTime,
          outlookUrl
        })
      });
    } catch (emailError) {
      console.error("Booking was saved, but email failed.", emailError);
    }

    return NextResponse.json({
      mode: "supabase",
      bookingId: data.id,
      status: "pending",
      outlookUrl,
      booking: data
    });
  }

  return NextResponse.json({
    mode: "demo",
    bookingId: crypto.randomUUID(),
    status: "pending",
    outlookUrl,
    booking: {
      host,
      meetingType,
      start: start.toISOString(),
      end: end.toISOString(),
      guestName: body.guestName,
      guestEmail: body.guestEmail,
      guestTelegram: body.guestTelegram,
      agenda: body.agenda || ""
    }
  });
}
