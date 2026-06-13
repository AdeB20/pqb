"use client";

import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Sidebar } from "./Sidebar";

interface Course {
  id: string;
  code: string;
  title: string;
  level: number;
  scope: "departmental" | "shared" | "general";
}

interface MobileSidebarSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  generalCourses: Course[];
  departmentCourses: Course[];
  departmentName: string;
  availableLevels: number[];
  currentLevel: number;
}

export function MobileSidebarSheet({
  open,
  onOpenChange,
  generalCourses,
  departmentCourses,
  departmentName,
  availableLevels,
  currentLevel,
}: MobileSidebarSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-[260px] p-0">
        <div className="pt-12">
          <Sidebar
            generalCourses={generalCourses}
            departmentCourses={departmentCourses}
            departmentName={departmentName}
            availableLevels={availableLevels}
            currentLevel={currentLevel}
            onClose={() => onOpenChange(false)}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
