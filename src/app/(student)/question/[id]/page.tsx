import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { PdfViewer } from "@/components/question/PdfViewer";
import { FlagModal } from "@/components/question/FlagModal";
import { EnlargeableImage } from "@/components/question/EnlargeableImage";
import { SolutionForm } from "@/components/solutions/SolutionForm";
import { SolutionList } from "@/components/solutions/SolutionList";
import { Badge } from "@/components/ui/badge";

export default async function QuestionPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: rawQuestion } = await supabase
    .from("past_questions")
    .select("*, course:course_id(code, title, level, department_id)")
    .eq("id", params.id)
    .single();
  const question = rawQuestion as unknown as {
    id: string;
    year: number;
    semester: "first" | "second";
    exam_type: string;
    file_type: "pdf" | "image";
    file_url: string;
    level: number;
    status: string;
    course: { code: string; title: string; level: number; department_id: string };
  } | null;

  if (!question || question.status !== "published") {
    redirect("/dashboard");
  }

  const { data: rawProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("auth_user_id", user.id)
    .single();
  const currentProfile = rawProfile as unknown as { id: string } | null;
  const currentProfileId = currentProfile?.id;

  const { data: rawSolutions } = await supabase
    .from("solutions")
    .select("*, submitted_by_profile:submitted_by(full_name)")
    .eq("question_id", params.id)
    .eq("status", "published")
    .order("created_at", { ascending: false });
  const dbSolutions = rawSolutions as unknown as Array<{
    id: string;
    body: string | null;
    submitted_by: string;
    file_url: string | null;
    upvotes: number;
    downvotes: number;
    submitted_by_profile: { full_name: string } | null;
    created_at: string;
  }> | null;

  const myVotes: Record<string, "up" | "down"> = {};
  if (currentProfileId) {
    const { data: voteRows } = await supabase
      .from("solution_votes")
      .select("solution_id, vote")
      .eq("voter_id", currentProfileId);
    const votes = voteRows as unknown as Array<{
      solution_id: string;
      vote: "up" | "down";
    }> | null;
    if (votes) {
      for (const v of votes) {
        myVotes[v.solution_id] = v.vote;
      }
    }
  }

  const solutions = (dbSolutions || []).map((s) => {
    const profile = s.submitted_by_profile as unknown as {
      full_name: string;
    } | null;
    return {
      id: s.id,
      body: s.body,
      file_url: s.file_url,
      submitted_by: s.submitted_by,
      author_name: profile?.full_name || "Anonymous",
      upvotes: s.upvotes ?? 0,
      downvotes: s.downvotes ?? 0,
      user_vote: (myVotes[s.id] ?? null) as "up" | "down" | null,
      is_own: currentProfileId === s.submitted_by,
      created_at: s.created_at,
    };
  });

  const course = question.course;

  return (
    <div className="space-y-6">
      <p className="animate-fade-in-down text-sm text-gray-500">
        <Link href="/dashboard" className="transition-colors hover:text-primary-600">
          Dashboard
        </Link>{" "}
        / {course.code}
      </p>

      <div className="animate-fade-in-up stagger-1 flex items-start justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            {question.year} —{" "}
            {question.semester === "first" ? "First" : "Second"} Semester
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            <span className="font-mono">{course.code}</span> · Level{" "}
            {question.level} ·{" "}
            {question.exam_type === "mid_semester" ? "Mid Semester" : "Examination"} ·{" "}
            <Badge
              variant="outline"
              className="border-gray-300 bg-gray-50 text-xs text-gray-600"
            >
              {question.file_type.toUpperCase()}
            </Badge>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <FlagModal questionId={question.id} />
        </div>
      </div>

      <div className="animate-fade-in-up stagger-2">
        {question.file_type === "pdf" ? (
          <PdfViewer fileUrl={question.file_url} />
        ) : (
          <EnlargeableImage
            src={`/api/storage/${question.file_url}`}
            alt={`Past question ${question.year}`}
            year={question.year}
          />
        )}
      </div>

      <hr className="border-gray-200 animate-fade-in" />

      <div className="animate-fade-in-up stagger-3">
        <h3 className="text-lg font-medium text-gray-900">
          Community Solutions
        </h3>
        <SolutionList solutions={solutions} />
        <div className="mt-4">
          <SolutionForm questionId={params.id} />
        </div>
      </div>
    </div>
  );
}
