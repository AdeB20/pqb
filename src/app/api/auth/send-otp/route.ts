import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, fullName, matricNumber, departmentId, currentLevel } = body;

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    const supabase = createServiceClient();
    const code = generateCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const { error: dbError } = await supabase.from("pending_otps").insert({
      email,
      code,
      expires_at: expiresAt,
    });

    if (dbError) {
      console.error("send-otp db error:", dbError);
      return NextResponse.json({ error: "Failed to store OTP" }, { status: 500 });
    }

    if (fullName && matricNumber && departmentId && currentLevel) {
      await supabase.from("pending_registrations").upsert({
        email,
        full_name: fullName,
        matric_number: matricNumber,
        department_id: departmentId,
        current_level: currentLevel,
      });
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "UniPastQ <noreply@devalyze.space>",
        to: email,
        subject: "Your UniPastQ sign-in code",
        html: `<h2>Your sign-in code</h2>
<p>Use the code below to sign in to UniPastQ. It expires in 10 minutes.</p>
<p style="font-size:24px;font-weight:bold;letter-spacing:8px;text-align:center;padding:16px;background:#f3f4f6;border-radius:8px">${code}</p>`,
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      console.error("Resend API error:", errBody);
      return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("send-otp error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
