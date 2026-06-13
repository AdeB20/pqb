import { SuspendedQueue } from "@/components/admin/SuspendedQueue";

export default function AdminQuestionsPage({
  params,
}: {
  params: { secret: string };
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Question Moderation</h2>
        <p className="mt-1 text-sm text-gray-500">
          Review flagged and pending questions — restore or delete as needed
        </p>
      </div>
      <SuspendedQueue secret={params.secret} />
    </div>
  );
}
