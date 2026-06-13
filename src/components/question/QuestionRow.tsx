"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";

interface QuestionRowProps {
  id: string;
  year: number;
  semester: string;
  examType: string;
  fileType: string;
  solutionCount: number;
  flagCount: number;
}

export function QuestionRow({
  id,
  year,
  semester,
  examType,
  fileType,
  solutionCount,
  flagCount: _flagCount,
}: QuestionRowProps) {
  return (
    <div className="group flex items-center gap-4 rounded-lg border border-gray-200 bg-white p-4 transition-all duration-normal hover:-translate-y-0.5 hover:shadow-md hover:border-gray-300">
      <Link href={`/question/${id}`} className="min-w-0 flex-1">
        <p className="font-medium text-gray-900 transition-colors duration-normal group-hover:text-primary-600">
          {year} — {semester === "first" ? "First" : "Second"} Semester
          <span className="ml-2 text-xs font-normal text-gray-400">
            {examType === "mid_semester" ? "Mid Semester" : "Examination"}
          </span>
        </p>
        <p className="mt-0.5 text-sm text-gray-500">
          <Badge
            variant="outline"
            className="mr-2 border-gray-300 bg-gray-50 text-xs text-gray-600"
          >
            {fileType.toUpperCase()}
          </Badge>
          {solutionCount} solution{solutionCount !== 1 ? "s" : ""}
        </p>
      </Link>

      <div className="flex shrink-0 items-center gap-2">
        <Link
          href={`/question/${id}`}
          className="rounded-md bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 transition-all duration-fast hover:bg-primary-50 hover:text-primary-700"
        >
          View
        </Link>
      </div>
    </div>
  );
}
