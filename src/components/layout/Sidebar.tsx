"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface Course {
  id: string;
  code: string;
  title: string;
  level: number;
  scope: "departmental" | "shared" | "general";
}

interface SidebarProps {
  generalCourses: Course[];
  departmentCourses: Course[];
  departmentName: string;
  availableLevels: number[];
  currentLevel: number;
  collapsed?: boolean;
  onClose?: () => void;
}

const mainNav = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25a2.25 2.25 0 01-2.25 2.25h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0120.25 20.25h-2.25a2.25 2.25 0 01-2.25-2.25v-2.25z" />
      </svg>
    ),
  },
  {
    href: "/browse",
    label: "Browse",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
      </svg>
    ),
  },
  {
    href: "/explore",
    label: "Other Past Questions",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
      </svg>
    ),
  },
  {
    href: "/upload",
    label: "Upload",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
      </svg>
    ),
  },
  {
    href: "/profile",
    label: "Profile",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
      </svg>
    ),
  },
];

export function Sidebar({
  generalCourses,
  departmentCourses,
  departmentName,
  availableLevels,
  currentLevel,
  collapsed = false,
  onClose,
}: SidebarProps) {
  const pathname = usePathname();
  const [openLevel, setOpenLevel] = useState<number>(currentLevel);

  const groupedByLevel = availableLevels.map((level) => ({
    level,
    courses: departmentCourses.filter((c) => c.level === level),
  }));

  const isNavActive = (href: string) => pathname === href;
  const isCourseActive = (id: string) => pathname === `/course/${id}`;

  return (
    <TooltipProvider delay={150}>
      <nav className={cn(
        "flex h-full flex-col overflow-y-auto transition-all duration-300 ease-in-out",
        collapsed ? "overflow-x-hidden" : "",
      )}>
      <div className={cn(
        "flex pt-5 pb-3",
        collapsed ? "justify-center px-0" : "justify-between px-4",
      )}>
        <Link href="/" className="flex items-center gap-2 min-w-0" onClick={onClose}>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-primary text-white shadow-[0_12px_24px_rgba(122,16,48,0.2)]">
            <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.098L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.098L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.098L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.098z" />
            </svg>
          </div>
          <span className={cn(
            "text-lg font-bold text-gray-900 transition-all duration-300 ease-in-out",
            collapsed ? "w-0 opacity-0 overflow-hidden" : "opacity-100",
          )}>
            UniPastQ
          </span>
        </Link>
      </div>

      <div className={cn("py-3", collapsed ? "px-0" : "px-3")}>
        <div className={cn(
          "flex flex-col items-center",
          collapsed ? "gap-3" : "space-y-1",
        )}>
          {mainNav.map((item) => (
            <Tooltip key={item.href}>
              <TooltipTrigger
                render={(
                  <Link
                    href={item.href}
                    onClick={onClose}
                    aria-label={item.label}
                  />
                )}
                className={cn(
                  "flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-300 ease-in-out",
                  collapsed ? "h-11 w-11 justify-center p-0" : "px-3 py-2.5",
                  isNavActive(item.href)
                    ? collapsed
                      ? "bg-[#7A1030] text-white shadow-[0_12px_24px_rgba(122,16,48,0.18)]"
                      : "bg-secondary/15 text-primary ring-1 ring-secondary/20"
                    : collapsed
                      ? "bg-primary/10 text-primary hover:bg-primary/15"
                      : "text-gray-700 hover:bg-secondary/10 hover:text-secondary",
                )}
              >
                <span className="shrink-0">
                  {item.icon}
                </span>
                <span className={cn(
                  "transition-all duration-300 ease-in-out",
                  collapsed ? "w-0 opacity-0 overflow-hidden" : "opacity-100",
                )}>
                  {item.label}
                </span>
              </TooltipTrigger>
              {collapsed && (
                <TooltipContent side="right">
                  {item.label}
                </TooltipContent>
              )}
            </Tooltip>
          ))}
        </div>
      </div>

      {!collapsed && (
        <>
          <div className="my-2 mx-4 h-px bg-gray-200" />

          <div className="px-4 py-3">
            <p className="px-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
              General Courses
            </p>
            <div className="mt-2 space-y-0.5">
              {generalCourses.length === 0 && (
                <p className="px-3 py-2 text-sm text-gray-400">No general courses</p>
              )}
              {generalCourses.map((course) => (
                <Link
                  key={course.id}
                  href={`/course/${course.id}`}
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-2 rounded-2xl px-3 py-2 text-sm transition-all duration-fast",
                    isCourseActive(course.id)
                      ? "bg-secondary/15 font-medium text-primary ring-1 ring-secondary/20"
                      : "text-gray-700 hover:bg-secondary/10 hover:text-secondary",
                  )}
                >
                  <span className="font-mono text-xs text-gray-400">{course.code}</span>
                  <span className="truncate">{course.title}</span>
                </Link>
              ))}
            </div>
          </div>

          <div className="my-2 mx-4 h-px bg-gray-200" />

          <div className="px-4 py-3">
            <p className="px-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
              {departmentName}
            </p>
            <div className="mt-2 space-y-1">
              {groupedByLevel.map(({ level, courses }) => (
                <div key={level}>
                  <button
                    type="button"
                    onClick={() => setOpenLevel(openLevel === level ? 0 : level)}
                    className="flex w-full items-center gap-2 rounded-2xl px-3 py-2 text-sm font-medium text-gray-700 transition-all duration-fast hover:bg-secondary/10 hover:text-secondary"
                  >
                    <svg
                      className={cn(
                        "h-3.5 w-3.5 text-gray-400 transition-transform duration-normal",
                        openLevel === level && "rotate-90",
                      )}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" />
                    </svg>
                    {level} Level
                    <span className="ml-auto text-xs text-gray-400">{courses.length}</span>
                  </button>
                  {openLevel === level && (
                    <div className="ml-4 space-y-0.5 overflow-hidden animate-fade-in-down">
                      {courses.map((course) => (
                        <Link
                          key={course.id}
                          href={`/course/${course.id}`}
                          onClick={onClose}
                          className={cn(
                            "flex items-center gap-2 rounded-2xl px-3 py-1.5 text-sm transition-all duration-fast",
                            isCourseActive(course.id)
                             ? "bg-secondary/15 font-medium text-primary ring-1 ring-secondary/20"
                              : "text-gray-700 hover:bg-secondary/10 hover:text-secondary",
                          )}
                        >
                          <span className="font-mono text-xs text-gray-400">{course.code}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
      </nav>
    </TooltipProvider>
  );
}
