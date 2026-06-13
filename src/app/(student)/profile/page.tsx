import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: rawProfile } = await supabase
    .from("profiles")
    .select("*, department:department_id(name)")
    .eq("auth_user_id", user.id)
    .single();
  const profile = rawProfile as unknown as {
    id: string;
    full_name: string;
    matric_number: string;
    department_id: string;
    current_level: number;
    last_upload_at: string | null;
    is_locked: boolean;
    department: { name: string } | null;
  } | null;

  if (!profile) redirect("/login");

  const { data: rawSettings } = await supabase
    .from("platform_settings")
    .select("upload_obligation_days")
    .single();
  const settings = rawSettings as unknown as {
    upload_obligation_days: number;
  } | null;

  const dept = profile.department;
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

  const { data: rawUploads } = await supabase
    .from("past_questions")
    .select("id, year, semester, status, created_at, course:course_id(code)")
    .eq("uploaded_by", profile.id)
    .order("created_at", { ascending: false });
  const uploads = rawUploads as unknown as Array<{
    id: string;
    year: number;
    semester: string;
    status: string;
    created_at: string;
    course: { code: string } | null;
  }> | null;

  return (
    <div className="space-y-8">
      <div className="animate-fade-in-down">
        <h2 className="text-xl font-semibold text-gray-900">Profile</h2>
      </div>

      <div className="animate-fade-in-up stagger-1 rounded-lg border border-gray-200 bg-white p-6">
        <dl className="space-y-4">
          <div className="transition-colors hover:bg-gray-50 -mx-6 -my-4 px-6 py-4 first:rounded-t-lg last:rounded-b-lg">
            <dt className="text-xs font-medium uppercase text-gray-500">Name</dt>
            <dd className="mt-1 text-sm text-gray-900">{profile.full_name}</dd>
          </div>
          <div className="transition-colors hover:bg-gray-50 -mx-6 -my-4 px-6 py-4 first:rounded-t-lg last:rounded-b-lg">
            <dt className="text-xs font-medium uppercase text-gray-500">Email</dt>
            <dd className="mt-1 text-sm text-gray-900">{user.email}</dd>
          </div>
          <div className="transition-colors hover:bg-gray-50 -mx-6 -my-4 px-6 py-4 first:rounded-t-lg last:rounded-b-lg">
            <dt className="text-xs font-medium uppercase text-gray-500">Matric</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {profile.matric_number}
            </dd>
          </div>
          <div className="transition-colors hover:bg-gray-50 -mx-6 -my-4 px-6 py-4 first:rounded-t-lg last:rounded-b-lg">
            <dt className="text-xs font-medium uppercase text-gray-500">Department</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {dept?.name || "—"}
            </dd>
          </div>
          <div className="transition-colors hover:bg-gray-50 -mx-6 -my-4 px-6 py-4 first:rounded-t-lg last:rounded-b-lg">
            <dt className="text-xs font-medium uppercase text-gray-500">Current level</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {profile.current_level}
            </dd>
          </div>
          <div className="transition-colors hover:bg-gray-50 -mx-6 -my-4 px-6 py-4 first:rounded-t-lg last:rounded-b-lg">
            <dt className="text-xs font-medium uppercase text-gray-500">
              Upload obligation
            </dt>
            <dd className="mt-1 text-sm text-gray-900">
              {profile.last_upload_at
                ? `${daysRemaining} days remaining`
                : "No uploads yet — action required"}
            </dd>
          </div>
        </dl>
      </div>

      <div className="animate-fade-in-up stagger-2">
        <h3 className="text-sm font-medium uppercase tracking-wider text-gray-500">
          Upload history
        </h3>
        {uploads && uploads.length > 0 ? (
          <div className="mt-3 space-y-2">
            {uploads.map((u, idx) => {
              const course = u.course as unknown as { code: string } | null;
              return (
                <div
                  key={u.id}
                  className="animate-fade-in-up flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 transition-all duration-normal hover:-translate-y-0.5 hover:shadow-sm"
                  style={{ animationDelay: `${idx * 60}ms` }}
                >
                  <p className="text-sm text-gray-900">
                    {course?.code || "Unknown"} — {u.year}{" "}
                    {u.semester === "first" ? "1st" : "2nd"} Sem
                  </p>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      u.status === "published"
                        ? "bg-success-50 text-success-600"
                        : u.status === "rejected"
                          ? "bg-danger-50 text-danger-600"
                          : "bg-warning-50 text-warning-600"
                    }`}
                  >
                    {u.status}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="mt-3 text-sm text-gray-500">
            You haven&apos;t uploaded any past questions yet.
          </p>
        )}
      </div>
    </div>
  );
}
