import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const adminSecret = process.env.ADMIN_SECRET_PATH;
  const isAdminLogin =
    adminSecret && pathname === `/admin/${adminSecret}/login`;
  const isAdminRoot =
    adminSecret && pathname === `/admin/${adminSecret}`;

  const isStudentRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/browse") ||
    pathname.startsWith("/course") ||
    pathname.startsWith("/question") ||
    pathname.startsWith("/profile");

  const isUploadRoute = pathname.startsWith("/upload");
  const isAdminRoute = pathname.startsWith("/admin") && !isAdminLogin && !isAdminRoot;

  if (isStudentRoute || isUploadRoute) {
    if (!user) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    if (!isUploadRoute) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_locked")
        .eq("auth_user_id", user.id)
        .single();

      if (profile?.is_locked) {
        return NextResponse.redirect(new URL("/upload?locked=true", request.url));
      }
    }
  }

  if (isAdminRoute) {
    if (!user) {
      const loginUrl = adminSecret
        ? `/admin/${adminSecret}/login`
        : "/login";
      return NextResponse.redirect(new URL(loginUrl, request.url));
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("auth_user_id", user.id)
      .single();

    if (profile?.role !== "super_admin") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/browse/:path*",
    "/course/:path*",
    "/question/:path*",
    "/upload/:path*",
    "/profile/:path*",
    "/admin/:path*",
  ],
};
