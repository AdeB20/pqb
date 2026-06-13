import { AdminDashboard } from "@/components/admin/AdminDashboard";

export default function AdminDashboardPage({
  params,
}: {
  params: { secret: string };
}) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Dashboard</h2>
      <AdminDashboard secret={params.secret} />
    </div>
  );
}
