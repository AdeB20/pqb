import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { CourseGrid } from "@/components/browse/CourseGrid";

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: { q?: string; level?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: rawProfile } = await supabase
    .from("profiles")
    .select("department_id, current_level")
    .eq("auth_user_id", user.id)
    .single();
  const profile = rawProfile as unknown as {
    department_id: string;
    current_level: number;
  } | null;

  if (!profile) redirect("/login");

  const search = (searchParams.q || "").toLowerCase();

  const { data: rawOwnCourses } = await supabase
    .from("courses")
    .select("id, code, title, level, scope")
    .or(`scope.eq.general,department_id.eq.${profile.department_id}`)
    .order("level");
  const ownCourses = rawOwnCourses as unknown as Array<{
    id: string;
    code: string;
    title: string;
    level: number;
    scope: "departmental" | "shared" | "general";
  }> | null;

  const { data: rawDeptLinks } = await supabase
    .from("department_courses")
    .select("course_id, course:course_id(id, code, title, level, scope)")
    .eq("department_id", profile.department_id);
  const deptLinks = rawDeptLinks as unknown as Array<{
    course_id: string;
    course: {
      id: string;
      code: string;
      title: string;
      level: number;
      scope: "departmental" | "shared" | "general";
    };
  }> | null;

  const linkedIds = new Set(deptLinks?.map((l) => l.course_id) || []);
  let courses = [
    ...(ownCourses || []).filter((c) => !linkedIds.has(c.id)),
    ...(deptLinks || []).map((l) => l.course),
  ].sort((a, b) => a.level - b.level);

  const courseIds = courses.map((c) => c.id);
  const { data: questionData } = courseIds.length > 0
    ? await supabase
        .from("past_questions")
        .select("course_id")
        .in("course_id", courseIds)
        .eq("status", "published")
    : { data: [] };
  const questionCounts: Record<string, number> = {};
  for (const q of (questionData || []) as { course_id: string }[]) {
    questionCounts[q.course_id] = (questionCounts[q.course_id] || 0) + 1;
  }

  courses = courses.map((c) => ({
    ...c,
    questionCount: questionCounts[c.id] || 0,
  }));

  if (search) {
    courses = courses.filter(
      (c) =>
        c.code.toLowerCase().includes(search) ||
        c.title.toLowerCase().includes(search),
    );
  }

  return (
    <div className="space-y-6">
      <div className="animate-fade-in-down rounded-[1.75rem] border border-white/70 bg-white/70 p-5 shadow-[0_18px_45px_rgba(63,39,50,0.08)] backdrop-blur-xl">
        <h2 className="text-xl font-semibold text-primary">Browse Courses</h2>
        {search && (
          <p className="mt-1 text-sm text-gray-500">
            Results for &quot;{search}&quot;
          </p>
        )}
      </div>

      <div className="animate-fade-in-up">
        {courses.length > 0 ? (
          <CourseGrid
            courses={courses}
            emptyMessage={search ? `No courses matching "${search}"` : "No courses available."}
          />
        ) : (
          <div className="clay-surface p-8 text-center">
            <p className="text-gray-500">
              {search
                ? `No courses matching "${search}"`
                : "No courses available."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
