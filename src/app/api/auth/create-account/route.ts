import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    if (!email || !password || password.length < 8) {
      return NextResponse.json({ error: "Email and password (min 8 chars) required" }, { status: 400 });
    }

    const supabase = createServiceClient();

    const { data: reg } = await supabase
      .from("pending_registrations")
      .select("*")
      .eq("email", email)
      .single();

    if (!reg) {
      return NextResponse.json({ error: "No pending registration" }, { status: 400 });
    }

    const { error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: reg.full_name,
        matric_number: reg.matric_number,
        department_id: reg.department_id,
        current_level: reg.current_level,
      },
    });

    if (createError) {
      console.error("create-account error:", createError);
      return NextResponse.json({ error: "Failed to create account" }, { status: 500 });
    }

    await supabase.from("pending_registrations").delete().eq("email", email);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("create-account error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
