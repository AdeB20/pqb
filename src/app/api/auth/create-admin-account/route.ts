import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function POST(req: Request) {
  try {
    const { email, password, fullName } = await req.json();
    if (!email || !password || password.length < 8 || !fullName) {
      return NextResponse.json(
        { error: "Email, full name, and password (min 8 chars) required" },
        { status: 400 },
      );
    }

    if (email !== "ifeoluwa.bankole05@gmail.com") {
      return NextResponse.json(
        { error: "Only the designated admin email can register" },
        { status: 403 },
      );
    }

    const supabase = createServiceClient();

    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .eq("role", "super_admin")
      .limit(1)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "Admin already registered. Go to login." },
        { status: 409 },
      );
    }

    const { data: deptRow } = await supabase
      .from("departments")
      .select("id")
      .limit(1)
      .single();

    if (!deptRow) {
      return NextResponse.json(
        { error: "No departments exist yet. Seed a department first via /settings" },
        { status: 400 },
      );
    }

    const { error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });

    if (createError) {
      console.error("create-admin error:", createError);
      return NextResponse.json(
        { error: "Failed to create admin account" },
        { status: 500 },
      );
    }

    const { data: authUser } = await supabase.auth.admin.listUsers();
    const adminUser = authUser?.users.find((u) => u.email === email);

    if (adminUser) {
      const deptId = (deptRow as unknown as { id: string }).id;
      await supabase.from("profiles").insert({
        auth_user_id: adminUser.id,
        full_name: fullName,
        matric_number: "ADMIN0001",
        department_id: deptId,
        current_level: 100,
        role: "super_admin",
      } as never);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("create-admin-account error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
