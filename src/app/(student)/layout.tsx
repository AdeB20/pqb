import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { StudentLayoutClient } from "./StudentLayoutClient";

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
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

  if (!rawProfile) redirect("/login");

  const profile = rawProfile as unknown as {
    id: string;
    auth_user_id: string;
    full_name: string;
    matric_number: string;
    department_id: string;
    current_level: number;
    role: string;
    last_upload_at: string | null;
    is_locked: boolean;
    created_at: string;
    department: { id: string; name: string; available_levels: number[] };
  };

  const dept = profile.department;

  const { data: rawOwnCourses } = await supabase
    .from("courses")
    .select("id, code, title, level, scope, department_id")
    .or(`scope.eq.general,department_id.eq.${profile.department_id}`)
    .order("level");
  const ownCourses = rawOwnCourses as unknown as Array<{
    id: string;
    code: string;
    title: string;
    level: number;
    scope: "departmental" | "shared" | "general";
    department_id: string;
  }> | null;

  const { data: rawDeptLinks } = await supabase
    .from("department_courses")
    .select("course_id, course:course_id(id, code, title, level, scope, department_id)")
    .eq("department_id", profile.department_id);
  const deptLinks = rawDeptLinks as unknown as Array<{
    course_id: string;
    course: {
      id: string;
      code: string;
      title: string;
      level: number;
      scope: "departmental" | "shared" | "general";
      department_id: string;
    };
  }> | null;

  const linkedIds = new Set(deptLinks?.map((l) => l.course_id) || []);
  const allCourses = [
    ...((ownCourses || []).filter((c) => !linkedIds.has(c.id))),
    ...(deptLinks || []).map((l) => l.course),
  ].sort((a, b) => a.level - b.level);

  const generalCourses =
    allCourses.filter((c) => c.scope === "general") || [];
  const departmentCourses =
    allCourses.filter((c) => c.scope !== "general") || [];

  const { data: rawSettings } = await supabase
    .from("platform_settings")
    .select("upload_obligation_days")
    .single();
  const settings = rawSettings as unknown as {
    upload_obligation_days: number;
  } | null;

  const daysRemaining = profile.last_upload_at
    ? Math.max(
        0,
        Math.ceil(
          (new Date(profile.last_upload_at).getTime() +
            (settings?.upload_obligation_days || 90) * 86400000 -
            Date.now()) /
            86400000,
        ),
      )
    : 0;

  return (
    <StudentLayoutClient
      profile={{
        id: profile.id,
        fullName: profile.full_name,
        departmentId: profile.department_id,
        currentLevel: profile.current_level,
        isLocked: profile.is_locked,
        daysRemaining,
      }}
      departmentName={dept?.name || ""}
      availableLevels={dept?.available_levels || []}
      generalCourses={generalCourses}
      departmentCourses={departmentCourses}
    >
      {children}
    </StudentLayoutClient>
  );
}
