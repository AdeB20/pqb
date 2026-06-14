"use client";

import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { solutionSchema } from "@/lib/validations";

type FormData = z.infer<typeof solutionSchema>;

interface SolutionFormProps {
  questionId: string;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const VALID_TYPES = ["application/pdf", "image/jpeg", "image/png"];

export function SolutionForm({ questionId }: SolutionFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [solutionFile, setSolutionFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(solutionSchema),
  });

  const onSubmit = async (data: FormData) => {
    setError("");
    if (!data.body && !solutionFile) {
      setError("Add text or a file");
      return;
    }
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: rawProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("auth_user_id", user.id)
      .single();
    const profile = rawProfile as unknown as { id: string } | null;
    if (!profile) return;

    let fileUrl: string | null = null;
    if (solutionFile) {
      const ext = solutionFile.name.split(".").pop();
      const fileId = crypto.randomUUID();
      const filePath = `${fileId}.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from("solutions")
        .upload(filePath, solutionFile);
      if (uploadErr) {
        setError("File upload failed");
        return;
      }
      fileUrl = `solutions/${filePath}`;
    }

    const { error: insertError } = await supabase.from("solutions").insert({
      question_id: questionId,
      submitted_by: profile.id,
      body: data.body || null,
      file_url: fileUrl,
      status: "published",
    } as never);

    if (insertError) {
      setError("Failed to submit solution.");
      return;
    }

    reset();
    setSolutionFile(null);
    setOpen(false);
    router.refresh();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > MAX_FILE_SIZE) {
      setError("File must be under 10MB");
      return;
    }
    if (!VALID_TYPES.includes(f.type)) {
      setError("Only PDF, JPG, or PNG files");
      return;
    }
    setError("");
    setSolutionFile(f);
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        Add a solution
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 rounded-lg border border-gray-200 bg-white p-4">
      <textarea
        {...register("body")}
        rows={4}
        placeholder="Write your solution (or attach a file below)..."
        className="block w-full rounded-md border border-gray-300 px-3.5 py-2.5 text-base focus:border-primary-600 focus:ring-2 focus:ring-primary-100"
      />
      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={handleFileChange}
          className="hidden"
        />
        {solutionFile ? (
          <div className="flex items-center gap-2 rounded-md border border-success-200 bg-success-50 px-3 py-2">
            <svg className="h-4 w-4 shrink-0 text-success-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
            <span className="truncate text-sm text-gray-700">{solutionFile.name}</span>
            <button
              type="button"
              onClick={() => { setSolutionFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
              className="ml-auto text-xs font-medium text-danger-600 hover:text-danger-800"
            >
              Remove
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            Attach image or PDF
          </button>
        )}
      </div>
      {error && <p className="text-sm text-danger-600">{error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
        >
          {isSubmitting ? "Submitting..." : "Submit"}
        </button>
        <button
          type="button"
          onClick={() => { setOpen(false); setSolutionFile(null); }}
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
