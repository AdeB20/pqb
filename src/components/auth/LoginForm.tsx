"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { loginSchema } from "@/lib/validations";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type FormData = z.infer<typeof loginSchema>;

export function LoginForm() {
  const supabase = createClient();
  const [error, setError] = useState("");
  const [shakeKey, setShakeKey] = useState(0);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: FormData) => {
    setError("");
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (signInError) {
      setError(signInError.message);
      setShakeKey((k) => k + 1);
      return;
    }

    window.location.href = "/dashboard";
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" key={shakeKey}>
      <div className="w-full animate-fade-in-up stagger-1">
        <label htmlFor="email" className="mb-2 block text-sm font-semibold text-gray-700">
          Email
        </label>
        <Input
          id="email"
          type="email"
          placeholder="you@university.edu.ng"
          className="h-12 rounded-xl focus-visible:ring-[#7A1030]"
          {...register("email")}
        />
        {errors.email && (
          <p className="mt-1 text-xs text-danger-600 animate-fade-in">{errors.email.message}</p>
        )}
      </div>

      <div className="w-full animate-fade-in-up stagger-2">
        <label htmlFor="password" className="mb-2 block text-sm font-semibold text-gray-700">
          Password
        </label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            {...register("password")}
            className="h-12 rounded-xl pr-12 focus-visible:ring-[#7A1030]"
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute inset-y-0 right-0 flex items-center px-4 text-gray-400 transition-colors hover:text-secondary"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.password && (
          <p className="mt-1 text-xs text-danger-600 animate-fade-in">{errors.password.message}</p>
        )}
        <div className="mt-2 text-right">
          <a
            href="mailto:help@unipastq.com?subject=UniPastQ%20Password%20Help"
            className="text-xs font-medium text-[#D4750A] hover:underline"
          >
            Forgot password?
          </a>
        </div>
      </div>

      {error && (
        <p className={cn("text-sm text-danger-600 animate-fade-in", shakeKey > 0 && "animate-shake")}>
          {error}
        </p>
      )}

      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-xl py-5 text-md font-semibold"
      >
        {isSubmitting ? (
          <span className="inline-flex items-center gap-2">
            <svg className="h-4 w-4 animate-spinner" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Logging in...
          </span>
        ) : "Log In"}
      </Button>
    </form>
  );
}
