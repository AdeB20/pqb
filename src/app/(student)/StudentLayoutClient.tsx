"use client";

import { useState, createContext, useContext } from "react";
import { cn } from "@/lib/utils";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { BottomNav } from "@/components/layout/BottomNav";
import { MobileSidebarSheet } from "@/components/layout/MobileSidebarSheet";
import { ObligationBanner } from "@/components/upload/ObligationBanner";

interface StudentProfile {
  id: string;
  fullName: string;
  departmentId: string;
  currentLevel: number;
  isLocked: boolean;
  daysRemaining: number;
}

interface Course {
  id: string;
  code: string;
  title: string;
  level: number;
  scope: "departmental" | "shared" | "general";
}

const ProfileContext = createContext<StudentProfile | null>(null);

export function useProfile() {
  return useContext(ProfileContext);
}

interface StudentLayoutClientProps {
  profile: StudentProfile;
  departmentName: string;
  availableLevels: number[];
  generalCourses: Course[];
  departmentCourses: Course[];
  children: React.ReactNode;
}

export function StudentLayoutClient({
  profile,
  departmentName,
  availableLevels,
  generalCourses,
  departmentCourses,
  children,
}: StudentLayoutClientProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <ProfileContext.Provider value={profile}>
      <div className="flex min-h-screen flex-col lg:flex-row">
        <aside className={cn(
          "hidden shrink-0 border-r border-gray-200 bg-white transition-all duration-normal lg:block",
          sidebarCollapsed ? "w-14" : "w-60",
        )}>
          <Sidebar
            generalCourses={generalCourses}
            departmentCourses={departmentCourses}
            departmentName={departmentName}
            availableLevels={availableLevels}
            currentLevel={profile.currentLevel}
            collapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          />
        </aside>

        <MobileSidebarSheet
          open={mobileMenuOpen}
          onOpenChange={setMobileMenuOpen}
          generalCourses={generalCourses}
          departmentCourses={departmentCourses}
          departmentName={departmentName}
          availableLevels={availableLevels}
          currentLevel={profile.currentLevel}
        />

        <div className="flex flex-1 flex-col">
          <Header
            onMenuClick={() => setMobileMenuOpen(true)}
            userName={profile.fullName}
          />

          {profile.daysRemaining <= 14 && profile.daysRemaining > 0 && (
            <ObligationBanner daysRemaining={profile.daysRemaining} />
          )}

          <main className="flex-1 overflow-auto p-4 pb-20 lg:p-8 lg:pb-8">
            <div className="mx-auto max-w-[900px]">{children}</div>
          </main>
        </div>

        <BottomNav />
      </div>
    </ProfileContext.Provider>
  );
}
