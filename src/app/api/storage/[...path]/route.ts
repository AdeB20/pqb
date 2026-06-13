import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function GET(
  _req: NextRequest,
  { params }: { params: { path: string[] } },
) {
  const filePath = params.path.join("/");
  if (!filePath.startsWith("approved/")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const service = createServiceClient();
  const { data, error } = await service.storage
    .from("approved")
    .download(filePath);

  if (error || !data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const ext = filePath.split(".").pop()?.toLowerCase();
  const mimeTypes: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    pdf: "application/pdf",
  };

  return new NextResponse(data, {
    headers: {
      "Content-Type": mimeTypes[ext || ""] || "application/octet-stream",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
