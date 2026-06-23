import { NextResponse } from "next/server";
import { getHostByEmail, isDemoMode } from "@/lib/config";
import { getSupabaseAdmin, getUserFromBearerToken, hasSupabaseEnv } from "@/lib/supabase";

function isValidDate(value: unknown) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isValidTime(value: unknown) {
  return typeof value === "string" && /^\d{2}:\d{2}$/.test(value);
}

export async function GET(request: Request) {
  if (isDemoMode() || !hasSupabaseEnv()) {
    return NextResponse.json(
      { error: "Dashboard needs Supabase and DEMO_MODE=false." },
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

  const { data, error: windowsError } = await supabase
    .from("availability_windows")
    .select("*")
    .eq("host_id", host.id)
    .gte("available_date", new Date().toISOString().slice(0, 10))
    .order("available_date", { ascending: true })
    .order("start_time", { ascending: true });

  if (windowsError) {
    return NextResponse.json({ error: windowsError.message }, { status: 500 });
  }

  return NextResponse.json({ host, windows: data || [] });
}

export async function POST(request: Request) {
  if (isDemoMode() || !hasSupabaseEnv()) {
    return NextResponse.json(
      { error: "Dashboard needs Supabase and DEMO_MODE=false." },
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

  if (!isValidDate(body.available_date) || !isValidTime(body.start_time) || !isValidTime(body.end_time)) {
    return NextResponse.json({ error: "Invalid availability window." }, { status: 400 });
  }

  if (body.start_time >= body.end_time) {
    return NextResponse.json({ error: "Start time must be before end time." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  const { data, error: insertError } = await supabase
    .from("availability_windows")
    .insert({
      host_id: host.id,
      available_date: body.available_date,
      start_time: body.start_time,
      end_time: body.end_time
    })
    .select()
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ window: data });
}

export async function DELETE(request: Request) {
  if (isDemoMode() || !hasSupabaseEnv()) {
    return NextResponse.json(
      { error: "Dashboard needs Supabase and DEMO_MODE=false." },
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

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing availability id." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  const { error: deleteError } = await supabase
    .from("availability_windows")
    .delete()
    .eq("id", id)
    .eq("host_id", host.id);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
