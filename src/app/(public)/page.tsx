import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function LandingPage() {
  const supabase = createClient();

  const { count: questionCount } = await supabase
    .from("past_questions")
    .select("*", { count: "exact", head: true })
    .eq("status", "published");

  const { count: studentCount } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("role", "student");

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-[640px] text-center">
        <div className="animate-fade-in-down">
          <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-primary-100 shadow-soft animate-bounce-in">
            <svg className="h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.098L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.098L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.098L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.098z" />
            </svg>
          </div>
        </div>

        <h1 className="animate-fade-in-up text-3xl font-bold text-gray-900 stagger-1">
          University Past Questions
        </h1>

        <p className="animate-fade-in-up mt-4 text-lg text-gray-500 stagger-2">
          Access past exam questions from your department. Upload, share, and
          study together.
        </p>

        <div className="animate-fade-in-up mt-8 flex items-center justify-center gap-4 stagger-3">
          <Link
            href="/register"
            className="inline-flex items-center rounded-md bg-primary-600 px-5 py-2.5 text-sm font-medium text-white shadow-soft transition-all duration-normal hover:bg-primary-700 hover:shadow-md active:scale-[0.97]"
          >
            Get started
            <svg className="ml-1.5 h-4 w-4 transition-transform duration-normal group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition-all duration-normal hover:bg-gray-50 hover:shadow-soft active:scale-[0.97]"
          >
            Log in
          </Link>
        </div>

        <div className="animate-fade-in-up mt-12 flex justify-center gap-12 stagger-4">
          <div className="transition-transform duration-normal hover:scale-105">
            <p className="text-2xl font-bold text-gray-900">
              {questionCount ?? 0}
            </p>
            <p className="text-sm text-gray-500">Past questions</p>
          </div>
          <div className="transition-transform duration-normal hover:scale-105">
            <p className="text-2xl font-bold text-gray-900">
              {studentCount ?? 0}
            </p>
            <p className="text-sm text-gray-500">Students</p>
          </div>
        </div>
      </div>
    </div>
  );
}
