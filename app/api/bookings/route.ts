import { NextResponse } from "next/server";
import { getSupabaseAdmin, hasSupabaseEnv } from "@/lib/supabase";
import { isDemoMode } from "@/lib/config";

export async function GET() {
  if (isDemoMode() || !hasSupabaseEnv()) {
    return NextResponse.json({
      mode: "demo",
      bookings: [],
      note: "Connect Supabase and set DEMO_MODE=false to view real bookings."
    });
  }

  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .order("start_time", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ mode: "supabase", bookings: data || [] });
}
