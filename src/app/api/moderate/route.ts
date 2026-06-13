import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

const rateLimitMap = new Map<string, { count: number; reset: number }>();
const RATE_LIMIT = 3;
const RATE_WINDOW_MS = 60_000;

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);
  if (!entry || now > entry.reset) {
    rateLimitMap.set(userId, { count: 1, reset: now + RATE_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

export async function POST(req: Request) {
  try {
    const supabase = createClient();
    const service = createServiceClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!checkRateLimit(user.id)) {
      return NextResponse.json(
        { error: "Too many requests. Please wait before uploading again." },
        { status: 429 },
      );
    }

    console.log("=== MODERATE START ===");
    const { questionId, courseCode, courseName } = await req.json();

    if (!questionId || !courseCode || !courseName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const { data: rawQuestion } = await service
      .from("past_questions")
      .select("file_url, file_type, uploaded_by, status")
      .eq("id", questionId)
      .single();
    const question = rawQuestion as unknown as {
      file_url: string;
      file_type: string;
      uploaded_by: string;
      status: string;
    } | null;

    if (!question) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const { data: rawProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("auth_user_id", user.id)
      .single();
    const profile = rawProfile as unknown as { id: string } | null;

    if (!profile || question.uploaded_by !== profile.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (question.status !== "pending_review") {
      return NextResponse.json(
        { error: "Question already processed" },
        { status: 409 },
      );
    }

    console.log("=== MODERATE: fetching file from pending ===", question.file_url);
    const { data: fileData } = await service.storage
      .from("pending")
      .download(question.file_url);

    console.log("=== MODERATE: fileData ===", fileData ? "got blob" : "null");
    if (!fileData) {
      return NextResponse.json(
        { error: "File not found in pending bucket" },
        { status: 404 },
      );
    }

    console.log("=== MODERATE: converting to base64 ===");
    const bytes = new Uint8Array(await fileData.arrayBuffer());
    const binary = Array.from(bytes).map((b) => String.fromCharCode(b)).join("");
    const fileBase64 = btoa(binary);
    console.log("=== MODERATE: base64 length ===", fileBase64.length);

    console.log("=== MODERATE: calling Gemini ===");
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL ?? "gemini-2.5-flash" });

    const prompt = `You are reviewing a university past question upload for a student platform.
Analyze the attached file carefully and return ONLY a valid JSON object — no preamble, no markdown, no explanation:
{ "pass": true or false, "reason": "..." }

Evaluate all four criteria. Fail if ANY single criterion is not met:

1. EXAM DOCUMENT: Is this file clearly a university examination, test paper, or past question paper? It should look like an official academic assessment with questions students are expected to answer.

2. READABILITY: Is the image or PDF sufficiently clear and legible for a student to read and study from? Blurry, extremely dark, or partially obscured documents should fail this check.

3. COURSE MATCH: Does the visible content of the document match the course it has been tagged as: "${courseCode} — ${courseName}"? Look for course codes, subject matter, department references, or any visible header information.

4. SAFE CONTENT: Is the document free from harmful, offensive, sexually explicit, or completely unrelated content?

Keep the reason field under 20 words. If pass is true, reason can be empty string.
Return JSON only.`;

    console.log("=== MODERATE: sending to Gemini ===");
    const result = await model.generateContent([
      {
        inlineData: {
          mimeType:
            question.file_type === "pdf" ? "application/pdf" : "image/jpeg",
          data: fileBase64,
        },
      },
      prompt,
    ]);

    console.log("=== MODERATE: Gemini responded ===");
    const raw = result.response.text().trim();
    let verdict: { pass: boolean; reason: string };

    try {
      verdict = JSON.parse(raw.replace(/```json|```/g, "").trim());
    } catch {
      await service
        .from("past_questions")
        .update({
          status: "rejected",
          ai_rejection_reason: "Review could not be completed — please re-upload",
        } as never)
        .eq("id", questionId);

      await service.storage.from("pending").remove([question.file_url]);

      return NextResponse.json(
        { pass: false, reason: "Review could not be completed — please re-upload" },
        { status: 200 },
      );
    }

    if (verdict.pass) {
      const ext = question.file_type === "pdf" ? "pdf" : "jpg";
      const newPath = `approved/${questionId}.${ext}`;

      const { error: uploadError } = await service.storage
        .from("approved")
        .upload(newPath, fileData);

      if (uploadError) {
        return NextResponse.json(
          { error: "Failed to move file to approved" },
          { status: 500 },
        );
      }

      await service.storage.from("pending").remove([question.file_url]);

      const { error: updateError } = await service
        .from("past_questions")
        .update({
          status: "published",
          file_url: newPath,
        } as never)
        .eq("id", questionId);

      if (updateError) {
        console.error("=== MODERATE: failed to update question status ===", updateError);
        return NextResponse.json(
          { error: "Failed to publish question" },
          { status: 500 },
        );
      }

      return NextResponse.json({ pass: true, reason: "" });
    } else {
      await service.storage.from("pending").remove([question.file_url]);

      await service
        .from("past_questions")
        .update({
          status: "rejected",
          ai_rejection_reason: verdict.reason,
        } as never)
        .eq("id", questionId);

      return NextResponse.json({ pass: false, reason: verdict.reason });
    }
  } catch (error) {
    const msg = error instanceof Error ? `${error.name}: ${error.message}\n${error.stack}` : String(error);
    console.error("=== MODERATE ERROR ===", msg);
    return NextResponse.json(
      { error: "Internal server error", detail: msg },
      { status: 500 },
    );
  }
}
