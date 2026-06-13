"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface FlagModalProps {
  questionId: string;
}

const reasons = [
  { value: "wrong_course", label: "Wrong course" },
  { value: "poor_quality", label: "Poor quality" },
  { value: "duplicate", label: "Duplicate" },
  { value: "inappropriate", label: "Inappropriate" },
] as const;

export function FlagModal({ questionId }: FlagModalProps) {
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string>("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!selected) return;
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

    const { error: insertError } = await supabase.from("flags").insert({
      question_id: questionId,
      flagged_by: profile.id,
      reason: selected as "wrong_course" | "poor_quality" | "duplicate" | "inappropriate",
    } as never);

    if (insertError) {
      if (insertError.code === "23505") {
        setError("You've already flagged this question");
      } else {
        setError("Something went wrong. Please try again.");
      }
      return;
    }

    setMessage("Thanks for reporting");
    setTimeout(() => {
      setOpen(false);
      setMessage("");
      setSelected("");
    }, 1500);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        className="rounded-md px-3 py-1.5 text-xs font-medium text-gray-500 transition-all duration-normal hover:bg-danger-50 hover:text-danger-600"
        aria-label="Flag this question"
      >
        Flag
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report this question</DialogTitle>
        </DialogHeader>

        {message ? (
          <p className="text-sm text-success-600">{message}</p>
        ) : (
          <div className="space-y-3">
            {reasons.map((r) => (
              <label
                key={r.value}
                className="flex cursor-pointer items-center gap-3 rounded-md border border-gray-200 p-3 text-sm transition-all duration-fast hover:bg-gray-50 has-checked:border-primary-600 has-checked:bg-primary-50"
              >
                <input
                  type="radio"
                  name="reason"
                  value={r.value}
                  checked={selected === r.value}
                  onChange={(e) => setSelected(e.target.value)}
                  className="text-primary-600 transition-all"
                />
                {r.label}
              </label>
            ))}

            {error && <p className="text-sm text-danger-600">{error}</p>}

            <button
              type="button"
              disabled={!selected}
              onClick={handleSubmit}
              className="w-full rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-all duration-normal hover:bg-primary-700 hover:shadow-md active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Submit report
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
