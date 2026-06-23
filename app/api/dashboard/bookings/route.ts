import { NextResponse } from "next/server";
import { getHostByEmail, isDemoMode } from "@/lib/config";
import { buildGuestConfirmedEmail, sendEmail } from "@/lib/email";
import { getSupabaseAdmin, getUserFromBearerToken, hasSupabaseEnv } from "@/lib/supabase";

const formatter = new Intl.DateTimeFormat("en-SG", {
  weekday: "long",
  day: "numeric",
  month: "long",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
  timeZone: "Asia/Singapore"
});

export async function GET(request: Request) {
  if (isDemoMode() || !hasSupabaseEnv()) {
    return NextResponse.json(
      { error: "Bookings dashboard needs Supabase and DEMO_MODE=false." },
      { status: 501 }
    );
  }

  const { user, error } = await getUserFromBearerToken(request);
  if (error || !user) {
    return NextResponse.json({ error: error || "Unauthorized." }, { status: 401 });
  }

  const host = getHostByEmail(user.email);
  if (!host) {
    return NextResponse.json(
      { error: "Your email is not registered as an AyuPulse host." },
      { status: 403 }
    );
  }

  const supabase = getSupabaseAdmin();

  const { data, error: bookingsError } = await supabase
    .from("bookings")
    .select("*")
    .eq("host_id", host.id)
    .in("status", ["pending", "confirmed"])
    .order("start_time", { ascending: true });

  if (bookingsError) {
    return NextResponse.json({ error: bookingsError.message }, { status: 500 });
  }

  return NextResponse.json({ host, bookings: data || [] });
}

export async function PATCH(request: Request) {
  if (isDemoMode() || !hasSupabaseEnv()) {
    return NextResponse.json(
      { error: "Bookings dashboard needs Supabase and DEMO_MODE=false." },
      { status: 501 }
    );
  }

  const { user, error } = await getUserFromBearerToken(request);
  if (error || !user) {
    return NextResponse.json({ error: error || "Unauthorized." }, { status: 401 });
  }

  const host = getHostByEmail(user.email);
  if (!host) {
    return NextResponse.json(
      { error: "Your email is not registered as an AyuPulse host." },
      { status: 403 }
    );
  }

  const body = await request.json();
  const bookingId = body.bookingId;
  const action = body.action;

  if (!bookingId || !["confirm", "cancel"].includes(action)) {
    return NextResponse.json({ error: "Invalid booking action." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  const { data: booking, error: fetchError } = await supabase
    .from("bookings")
    .select("*")
    .eq("id", bookingId)
    .eq("host_id", host.id)
    .single();

  if (fetchError || !booking) {
    return NextResponse.json(
      { error: fetchError?.message || "Booking not found for this host." },
      { status: 404 }
    );
  }

  if (action === "confirm") {
    const { data, error: updateError } = await supabase
      .from("bookings")
      .update({
        status: "confirmed",
        confirmed_at: new Date().toISOString()
      })
      .eq("id", bookingId)
      .eq("host_id", host.id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    try {
      await sendEmail({
        to: booking.guest_email,
        subject: `AyuPulse meeting confirmed: ${formatter.format(new Date(booking.start_time))}`,
        html: buildGuestConfirmedEmail({
          guestName: booking.guest_name,
          hostName: host.name,
          meetingTitle: `Quick Chat with ${host.name}`,
          formattedTime: formatter.format(new Date(booking.start_time)),
          outlookUrl: booking.outlook_url || ""
        })
      });
    } catch (emailError) {
      console.error("Confirmation email failed.", emailError);
    }

    return NextResponse.json({ booking: data });
  }

  const { data, error: cancelError } = await supabase
    .from("bookings")
    .update({
      status: "cancelled",
      cancelled_at: new Date().toISOString()
    })
    .eq("id", bookingId)
    .eq("host_id", host.id)
    .select()
    .single();

  if (cancelError) {
    return NextResponse.json({ error: cancelError.message }, { status: 500 });
  }

  return NextResponse.json({ booking: data });
}
