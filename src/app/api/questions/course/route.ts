import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const courseId = req.nextUrl.searchParams.get("courseId");
  const year = req.nextUrl.searchParams.get("year");
  const semester = req.nextUrl.searchParams.get("semester");
  const offset = parseInt(req.nextUrl.searchParams.get("offset") || "0");
  const limit = parseInt(req.nextUrl.searchParams.get("limit") || "20");

  if (!courseId) {
    return NextResponse.json({ error: "Missing courseId" }, { status: 400 });
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let query = supabase
    .from("past_questions")
    .select("id, year, semester, exam_type, file_type, level, status, flag_count, created_at", { count: "exact" })
    .eq("course_id", courseId)
    .eq("status", "published")
    .order("year", { ascending: false })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (year) query = query.eq("year", parseInt(year));
  if (semester) query = query.eq("semester", semester);

  const { data, count } = await query;

  return NextResponse.json({
    questions: data ?? [],
    total: count ?? 0,
    offset,
    limit,
  });
}
