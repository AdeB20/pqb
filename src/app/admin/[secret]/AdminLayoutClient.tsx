"use client";

import { useEffect, useState } from "react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminMobileSidebar } from "@/components/admin/AdminMobileSidebar";
import { createClient } from "@/lib/supabase/client";

export function AdminLayoutClient({
  children,
  secret,
}: {
  children: React.ReactNode;
  secret: string;
}) {
  const [isAuthed, setIsAuthed] = useState<boolean | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    async function check() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setIsAuthed(false); return; }
      const { data: raw } = await supabase
        .from("profiles")
        .select("role")
        .eq("auth_user_id", user.id)
        .single();
      const profile = raw as unknown as { role: string } | null;
      setIsAuthed(profile?.role === "super_admin");
    }
    check();
  }, []);

  if (isAuthed === null) {
    return <div className="flex min-h-screen items-center justify-center bg-gray-50">{children}</div>;
  }

  if (!isAuthed) {
    return <div className="flex min-h-screen items-center justify-center bg-gray-50">{children}</div>;
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="hidden w-64 shrink-0 border-r border-gray-200 bg-white md:block">
        <AdminSidebar secret={secret} />
      </aside>

      <AdminMobileSidebar
        secret={secret}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between px-4 py-3 md:px-6">
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 md:hidden"
              aria-label="Open sidebar"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            </button>

            <div className="hidden md:block" />

            <form action="/auth/signout" method="post" className="md:hidden">
              <button
                type="submit"
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                </svg>
                Sign out
              </button>
            </form>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
