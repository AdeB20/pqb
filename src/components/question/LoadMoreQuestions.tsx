"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { QuestionList } from "./QuestionList";
import { useSearchParams } from "next/navigation";

interface Question {
  id: string;
  year: number;
  semester: string;
  exam_type: string;
  file_type: string;
  flag_count: number;
  level: number;
  status: string;
  created_at: string | null;
}

interface LoadMoreQuestionsProps {
  initialQuestions: Question[];
  courseId: string;
}

export function LoadMoreQuestions({
  initialQuestions,
  courseId,
}: LoadMoreQuestionsProps) {
  const searchParams = useSearchParams();
  const [questions, setQuestions] = useState<Question[]>(initialQuestions);
  const [offset, setOffset] = useState(initialQuestions.length);
  const [hasMore, setHasMore] = useState(initialQuestions.length >= 20);
  const [loading, setLoading] = useState(false);
  const filtersKey = `${searchParams.get("year") ?? ""}-${searchParams.get("semester") ?? ""}`;
  const filtersKeyRef = useRef(filtersKey);
  const offsetRef = useRef(offset);
  offsetRef.current = offset;

  const fetchQuestions = useCallback(
    async (startOffset: number, replace: boolean) => {
      setLoading(true);
      const year = searchParams.get("year");
      const semester = searchParams.get("semester");
      const params = new URLSearchParams({
        courseId,
        offset: String(startOffset),
        limit: "20",
      });
      if (year) params.set("year", year);
      if (semester) params.set("semester", semester);

      const res = await fetch(`/api/questions/course?${params}`);
      const data = await res.json();
      if (data.questions) {
        if (replace) {
          setQuestions(data.questions);
          setOffset(data.questions.length);
          setHasMore(data.questions.length >= 20);
        } else {
          setQuestions((prev) => [...prev, ...data.questions]);
          setOffset((prev) => prev + data.questions.length);
          setHasMore(data.questions.length >= 20);
        }
      }
      setLoading(false);
    },
    [courseId, searchParams],
  );

  useEffect(() => {
    if (filtersKeyRef.current !== filtersKey) {
      filtersKeyRef.current = filtersKey;
      fetchQuestions(0, true);
    }
  }, [filtersKey, fetchQuestions]);

  const loadMore = useCallback(() => {
    fetchQuestions(offsetRef.current, false);
  }, [fetchQuestions]);

  const isEmpty = questions.length === 0 && !loading;

  return (
    <div className="space-y-4">
      {isEmpty ? (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
          <p className="text-gray-500">
            No past questions yet. Be the first to upload!
          </p>
        </div>
      ) : (
        <QuestionList questions={questions} />
      )}
      {loading && (
        <div className="flex justify-center pt-2">
          <div className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-6 py-3 text-sm text-gray-400">
            <svg className="h-4 w-4 animate-spinner" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Loading...
          </div>
        </div>
      )}
      {hasMore && !loading && (
        <div className="flex justify-center pt-2">
          <button
            type="button"
            onClick={loadMore}
            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-6 py-2 text-sm font-medium text-gray-700 transition-all duration-normal hover:bg-gray-50 hover:shadow-soft active:scale-[0.98]"
          >
            Load More
          </button>
        </div>
      )}
    </div>
  );
}
