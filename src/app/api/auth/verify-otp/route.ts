import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function POST(req: Request) {
  try {
    const { email, code } = await req.json();
    if (!email || !code) {
      return NextResponse.json({ error: "Email and code required" }, { status: 400 });
    }

    const supabase = createServiceClient();

    const { data: otp, error: fetchError } = await supabase
      .from("pending_otps")
      .select("*")
      .eq("email", email)
      .eq("code", code)
      .eq("used", false)
      .gte("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (fetchError || !otp) {
      return NextResponse.json({ error: "Invalid or expired code" }, { status: 401 });
    }

    await supabase
      .from("pending_otps")
      .update({ used: true })
      .eq("id", otp.id);

    const { data: reg } = await supabase
      .from("pending_registrations")
      .select("*")
      .eq("email", email)
      .single();

    return NextResponse.json({
      success: true,
      hasPendingRegistration: !!reg,
      registration: reg
        ? {
            fullName: reg.full_name,
            matricNumber: reg.matric_number,
            departmentId: reg.department_id,
            currentLevel: reg.current_level,
          }
        : null,
    });
  } catch (err) {
    console.error("verify-otp error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
