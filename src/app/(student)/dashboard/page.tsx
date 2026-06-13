import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { CourseGrid } from "@/components/browse/CourseGrid";
import { LevelTabs } from "@/components/browse/LevelTabs";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { level?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: rawProfile } = await supabase
    .from("profiles")
    .select("*, department:department_id(id, name, available_levels)")
    .eq("auth_user_id", user.id)
    .single();
  const profile = rawProfile as unknown as {
    id: string;
    department_id: string;
    current_level: number;
    department: { id: string; name: string; available_levels: number[] };
  } | null;

  if (!profile) redirect("/login");

  const dept = profile.department;

  const { data: rawCourses } = await supabase
    .from("courses")
    .select("id, code, title, level, scope")
    .or(`scope.eq.general,department_id.eq.${profile.department_id}`)
    .order("level");
  const ownCourses = rawCourses as unknown as Array<{
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
  const courses = [
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

  const withCount = <T extends { id: string }>(c: T) => ({
    ...c,
    questionCount: questionCounts[c.id] || 0,
  });

  const generalCourses = courses?.filter((c) => c.scope === "general").map(withCount) || [];
  const deptCourses = courses?.filter((c) => c.scope !== "general").map(withCount) || [];
  const levels = dept?.available_levels || [];

  const selectedLevel = searchParams.level
    ? parseInt(searchParams.level)
    : profile.current_level;

  const filteredCourses = deptCourses.filter((c) => c.level === selectedLevel);

  return (
    <div className="space-y-8">
      <div className="animate-fade-in-down flex items-start justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Dashboard</h2>
          <p className="mt-1 text-sm text-gray-500">{dept?.name}</p>
        </div>
        <Link
          href="/upload"
          className="inline-flex items-center rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-all duration-normal hover:bg-primary-700 hover:shadow-md active:scale-[0.98]"
        >
          <svg className="mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Upload
        </Link>
      </div>

      <section className="animate-fade-in-up stagger-1">
        <h3 className="mb-3 text-sm font-medium uppercase tracking-wider text-gray-500">
          General Courses
        </h3>
        <CourseGrid courses={generalCourses} />
      </section>

      <section className="animate-fade-in-up stagger-2">
        <div className="mb-4">
          <LevelTabs
            levels={levels}
            activeLevel={selectedLevel}
          />
        </div>
        <CourseGrid
          courses={filteredCourses}
          emptyMessage="No courses found for this level."
        />
      </section>

      <Link
        href="/upload"
        className="fixed bottom-20 right-4 z-40 rounded-full bg-primary-600 p-3 text-white shadow-lg transition-all duration-normal hover:bg-primary-700 hover:shadow-xl hover:-translate-y-0.5 active:scale-95 lg:hidden"
        aria-label="Upload past question"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
      </Link>
    </div>
  );
}
