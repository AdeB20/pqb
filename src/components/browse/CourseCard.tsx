import Link from "next/link";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface CourseCardProps {
  id: string;
  code: string;
  title: string;
  level: number;
  scope: "departmental" | "shared" | "general";
  questionCount: number;
  solutionCount?: number;
  className?: string;
}

export function CourseCard({
  id,
  code,
  title,
  level,
  scope,
  questionCount,
  solutionCount,
  className,
}: CourseCardProps) {
  return (
    <Link
      href={`/course/${id}`}
      className={cn(
        "group block rounded-lg border border-gray-200 bg-white p-6 shadow-soft transition-all duration-normal hover:-translate-y-0.5 hover:shadow-md hover:border-gray-300",
        className,
      )}
    >
      <div className="flex items-start justify-between">
        <p className="font-mono text-sm font-medium text-gray-900 transition-colors duration-normal group-hover:text-primary-600">{code}</p>
        {scope === "general" && (
          <Badge variant="default" className="bg-info-50 text-info-600 border-info-200">
            General
          </Badge>
        )}
        {scope === "shared" && (
          <Badge variant="secondary" className="bg-primary-50 text-primary-600 border-primary-200">
            Shared
          </Badge>
        )}
      </div>
      <p className="mt-1 text-base font-medium text-gray-900">{title}</p>
      <p className="mt-2 text-sm text-gray-500 transition-colors duration-normal group-hover:text-gray-700">
        Level {level} · {questionCount} question{questionCount !== 1 ? "s" : ""}
      </p>
      {solutionCount !== undefined && solutionCount > 0 && (
        <p className="text-sm text-gray-500">
          {solutionCount} solution{solutionCount !== 1 ? "s" : ""}
        </p>
      )}
    </Link>
  );
}
