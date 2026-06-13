import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { redirect } from "next/navigation";
import { UploadForm } from "@/components/upload/UploadForm";
import { UploadWall } from "@/components/upload/UploadWall";

export default async function UploadPage({
  searchParams,
}: {
  searchParams: { locked?: string; courseId?: string };
}) {
  const supabase = createClient();
  const service = createServiceClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: rawProfile } = await supabase
    .from("profiles")
    .select("id, department_id, is_locked")
    .eq("auth_user_id", user.id)
    .single();
  const profile = rawProfile as unknown as {
    id: string;
    department_id: string;
    is_locked: boolean;
  } | null;

  if (!profile) redirect("/login");

  if (profile.is_locked || searchParams.locked === "true") {
    const { data: rawSettings } = await service
      .from("platform_settings")
      .select("upload_obligation_days")
      .single();
    const settings = rawSettings as unknown as { upload_obligation_days: number } | null;
    return <UploadWall obligationDays={settings?.upload_obligation_days ?? 30} />;
  }

  const { data: rawCourses } = await supabase
    .from("courses")
    .select("id, code, title, level")
    .order("level");
  const courses = rawCourses as unknown as Array<{
    id: string;
    code: string;
    title: string;
    level: number;
  }> | null;

  return (
    <div className="space-y-6">
      <h2 className="animate-fade-in-down text-xl font-semibold text-gray-900">
        Upload Past Question
      </h2>
      <div className="animate-fade-in-up">
        <UploadForm courses={courses || []} />
      </div>
    </div>
  );
}
