"use client";

import { useState } from "react";
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

export function SolutionForm({ questionId }: SolutionFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");

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

    const { error: insertError } = await supabase.from("solutions").insert({
      question_id: questionId,
      submitted_by: profile.id,
      body: data.body,
      status: "published",
    } as never);

    if (insertError) {
      setError("Failed to submit solution.");
      return;
    }

    reset();
    setOpen(false);
    router.refresh();
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
        placeholder="Write your solution..."
        className="block w-full rounded-md border border-gray-300 px-3.5 py-2.5 text-base focus:border-primary-600 focus:ring-2 focus:ring-primary-100"
      />
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
          onClick={() => setOpen(false)}
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
