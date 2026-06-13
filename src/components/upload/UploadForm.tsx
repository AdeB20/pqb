"use client";

import { useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { uploadSchema } from "@/lib/validations";
import { FileDropzone } from "./FileDropzone";

type UploadData = z.infer<typeof uploadSchema>;

interface Course {
  id: string;
  code: string;
  title: string;
  level: number;
}

type UploadState = "idle" | "uploading" | "reviewing" | "rejected";

export function UploadForm({ courses }: { courses: Course[] }) {
  const searchParams = useSearchParams();
  const supabase = createClient();
  const preSelectedCourseId = searchParams.get("courseId");

  const [file, setFile] = useState<File | null>(null);
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [rejectionReason, setRejectionReason] = useState("");
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<UploadData>({
    resolver: zodResolver(uploadSchema) as any,
    defaultValues: {
      courseId: preSelectedCourseId || "",
      year: new Date().getFullYear(),
      semester: "first",
      examType: "examination",
    },
  });

  const onSubmit = useCallback(
    async (data: UploadData) => {
      if (!file) {
        setError("Please select a file");
        return;
      }
      setError("");
      setUploadState("uploading");

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: rawProfile, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("auth_user_id", user.id)
        .single();
      if (profileError) {
        setError("Profile error: " + profileError.message);
        setUploadState("idle");
        return;
      }
      const profile = rawProfile as unknown as { id: string } | null;
      if (!profile) {
        setError("Profile not found");
        setUploadState("idle");
        return;
      }

      const fileExt = file.name.split(".").pop();
      const fileId = crypto.randomUUID();
      const filePath = `pending/${fileId}.${fileExt}`;
      const course = courses.find((c) => c.id === data.courseId);
      if (!course) return;

      const { error: uploadError } = await supabase.storage
        .from("pending")
        .upload(filePath, file);

      if (uploadError) {
        setError("Upload failed. Please try again.");
        setUploadState("idle");
        return;
      }

      const questionId = crypto.randomUUID();

      const { error: insertError } = await supabase
        .from("past_questions")
        .insert({
          id: questionId,
          course_id: data.courseId,
          uploaded_by: profile.id,
          level: course.level,
          file_url: filePath,
          file_type: file.type === "application/pdf" ? "pdf" : "image",
          year: data.year,
          semester: data.semester,
          exam_type: data.examType,
          status: "pending_review",
        } as never);

      if (insertError) {
        setError(insertError.message || "Failed to create question record.");
        setUploadState("idle");
        return;
      }

      setUploadState("reviewing");

      const response = await fetch("/api/moderate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId,
          courseCode: course.code,
          courseName: course.title,
        }),
      });

      const result = await response.json();

      if (result.pass) {
        window.location.href = `/question/${questionId}`;
      } else {
        setRejectionReason(result.reason || "Upload rejected");
        setUploadState("rejected");
      }
    },
    [file, supabase, courses],
  );

  if (uploadState === "rejected") {
    return (
      <div className="rounded-lg border border-danger-200 bg-danger-50 p-8 text-center">
        <p className="text-sm font-medium text-danger-600">
          Upload rejected{rejectionReason ? ` — ${rejectionReason}` : ""}
        </p>
        <button
          type="button"
          onClick={() => {
            setUploadState("idle");
            setRejectionReason("");
            setFile(null);
          }}
          className="mt-4 rounded-md bg-danger-600 px-4 py-2 text-sm font-medium text-white hover:bg-danger-700"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <FileDropzone file={file} onFileSelect={setFile} />

      <div>
        <label htmlFor="courseId" className="block text-sm font-medium text-gray-700">
          Course
        </label>
        <select
          id="courseId"
          {...register("courseId")}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3.5 py-2.5 text-base focus:border-primary-600 focus:ring-2 focus:ring-primary-100"
        >
          <option value="">Select course</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.code} — {c.title}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="year" className="block text-sm font-medium text-gray-700">
            Year
          </label>
          <input
            id="year"
            type="number"
            {...register("year")}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3.5 py-2.5 text-base focus:border-primary-600 focus:ring-2 focus:ring-primary-100"
          />
        </div>
        <div>
          <label htmlFor="semester" className="block text-sm font-medium text-gray-700">
            Semester
          </label>
          <select
            id="semester"
            {...register("semester")}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3.5 py-2.5 text-base focus:border-primary-600 focus:ring-2 focus:ring-primary-100"
          >
            <option value="first">First</option>
            <option value="second">Second</option>
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="examType" className="block text-sm font-medium text-gray-700">
          Exam Type
        </label>
        <select
          id="examType"
          {...register("examType")}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3.5 py-2.5 text-base focus:border-primary-600 focus:ring-2 focus:ring-primary-100"
        >
          <option value="examination">Examination</option>
          <option value="mid_semester">Mid Semester</option>
        </select>
      </div>

      {error && <p className="text-sm text-danger-600">{error}</p>}

      <button
        type="submit"
        disabled={isSubmitting || uploadState === "uploading" || uploadState === "reviewing"}
        className="w-full rounded-md bg-primary-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {uploadState === "uploading"
          ? "Uploading file..."
          : uploadState === "reviewing"
            ? "AI is reviewing your upload..."
            : "Upload past question"}
      </button>
    </form>
  );
}
