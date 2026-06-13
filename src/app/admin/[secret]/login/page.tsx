import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";

export default async function AdminLoginPage({
  params,
}: {
  params: { secret: string };
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    const { data: raw } = await supabase
      .from("profiles")
      .select("role")
      .eq("auth_user_id", user.id)
      .single();
    const profile = raw as unknown as { role: string } | null;
    if (profile?.role === "super_admin") {
      redirect(`/admin/${params.secret}`);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="mb-6 text-center text-xl font-semibold text-gray-900">
          Admin Access
        </h1>
        <AdminLoginForm secret={params.secret} />
      </div>
    </div>
  );
}
