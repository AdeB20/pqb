import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { redirect } from "next/navigation";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { AdminRegisterForm } from "@/components/admin/AdminRegisterForm";

export default async function AdminDashboardPage({
  params,
}: {
  params: { secret: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: rawProfile } = await supabase
      .from("profiles")
      .select("role")
      .eq("auth_user_id", user.id)
      .single();
    const profile = rawProfile as unknown as { role: string } | null;

    if (profile?.role === "super_admin") {
      return (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-900">Dashboard</h2>
          <AdminDashboard secret={params.secret} />
        </div>
      );
    }
  }

  const service = createServiceClient();
  const { data: existingAdmin } = await service
    .from("profiles")
    .select("id")
    .eq("role", "super_admin")
    .maybeSingle();

  if (existingAdmin) {
    redirect(`/admin/${params.secret}/login`);
  }

  return <AdminRegisterForm secret={params.secret} />;
}
