import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const service = createServiceClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: rawProfile } = await service
      .from("profiles")
      .select("role")
      .eq("auth_user_id", user.id)
      .single();
    const profile = rawProfile as unknown as { role: string } | null;

    if (profile?.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const action = req.nextUrl.searchParams.get("action");

    let formData: FormData;
    try {
      formData = await req.formData();
    } catch {
      formData = new FormData();
    }

    switch (action) {
      case "seed-faculty": {
        const name = formData.get("name") as string;
        if (!name) {
          return NextResponse.json({ error: "Name required" }, { status: 400 });
        }
        const slug = name.toLowerCase().replace(/\s+/g, "-");
        const { error } = await service.from("faculties").insert({ name, slug } as never);
        if (error) throw error;
        return NextResponse.json({ success: true });
      }

      case "seed-department": {
        const name = formData.get("name") as string;
        const faculty_id = formData.get("faculty_id") as string;
        if (!name || !faculty_id) {
          return NextResponse.json(
            { error: "Name and faculty_id required" },
            { status: 400 },
          );
        }
        const slug = name.toLowerCase().replace(/\s+/g, "-");
        const { error } = await service
          .from("departments")
          .insert({ name, slug, faculty_id } as never);
        if (error) throw error;
        return NextResponse.json({ success: true });
      }

      case "seed-course": {
        const code = formData.get("code") as string;
        const title = formData.get("title") as string;
        const department_id = formData.get("department_id") as string;
        const level = parseInt(formData.get("level") as string);
        const scope = (formData.get("scope") as string) || "departmental";
        const link_dept_ids = formData.getAll("link_dept_ids") as string[];
        if (!code || !title || !level) {
          return NextResponse.json(
            { error: "All course fields required" },
            { status: 400 },
          );
        }
        const insertData: Record<string, unknown> = { code, title, level, scope };
        if (department_id) insertData.department_id = department_id;
        const { data: newCourse, error } = await service
          .from("courses")
          .insert(insertData as never)
          .select("id")
          .single();
        if (error) throw error;
        const courseId = (newCourse as unknown as { id: string } | null)?.id;
        if (scope === "shared" && link_dept_ids.length > 0 && courseId) {
          const links = link_dept_ids.map((did: string) => ({
            department_id: did,
            course_id: courseId,
          }));
          await service.from("department_courses").insert(links as never);
        }
        return NextResponse.json({ success: true });
      }

      case "restore-question": {
        const id = formData.get("id") as string;
        if (!id) {
          return NextResponse.json({ error: "ID required" }, { status: 400 });
        }
        const { error } = await service
          .from("past_questions")
          .update({ status: "published" } as never)
          .eq("id", id);
        if (error) throw error;
        return NextResponse.json({ success: true });
      }

      case "delete-question": {
        const id = formData.get("id") as string;
        if (!id) {
          return NextResponse.json({ error: "ID required" }, { status: 400 });
        }
        const { data: rawQuestionForDelete } = await service
          .from("past_questions")
          .select("file_url")
          .eq("id", id)
          .single();
        const questionForDelete = rawQuestionForDelete as unknown as { file_url: string } | null;
        if (questionForDelete?.file_url) {
          await service.storage.from("approved").remove([questionForDelete.file_url]);
        }
        const { error } = await service
          .from("past_questions")
          .delete()
          .eq("id", id);
        if (error) throw error;
        return NextResponse.json({ success: true });
      }

      case "lock-student": {
        const id = formData.get("id") as string;
        if (!id) {
          return NextResponse.json({ error: "ID required" }, { status: 400 });
        }
        const { error } = await service
          .from("profiles")
          .update({ is_locked: true } as never)
          .eq("id", id);
        if (error) throw error;
        return NextResponse.json({ success: true });
      }

      case "unlock-student": {
        const id = formData.get("id") as string;
        if (!id) {
          return NextResponse.json({ error: "ID required" }, { status: 400 });
        }
        const { error } = await service
          .from("profiles")
          .update({ is_locked: false } as never)
          .eq("id", id);
        if (error) throw error;
        return NextResponse.json({ success: true });
      }

      case "update-settings": {
        const upload_obligation_days = parseInt(
          formData.get("upload_obligation_days") as string,
        );
        const lockout_enabled = formData.get("lockout_enabled") === "on";
        if (!upload_obligation_days) {
          return NextResponse.json(
            { error: "Invalid settings" },
            { status: 400 },
          );
        }
        const { data: settingsRow } = await service
          .from("platform_settings")
          .select("id")
          .single();
        const settingsId = ((settingsRow as unknown as { id: string } | null)?.id) ?? "";
        const { error } = await service
          .from("platform_settings")
          .update({ upload_obligation_days, lockout_enabled } as never)
          .eq("id", settingsId);
        if (error) throw error;
        return NextResponse.json({ success: true });
      }

      case "list-departments": {
        const { data: deptList } = await service
          .from("departments")
          .select("id, name")
          .order("name");
        return NextResponse.json({ departments: deptList ?? [] });
      }

      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Admin error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
