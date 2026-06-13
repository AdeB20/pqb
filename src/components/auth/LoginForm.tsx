"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { loginSchema } from "@/lib/validations";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type FormData = z.infer<typeof loginSchema>;

export function LoginForm() {
  const supabase = createClient();
  const [error, setError] = useState("");
  const [shakeKey, setShakeKey] = useState(0);

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
      <div className="animate-fade-in-up stagger-1">
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email
        </label>
        <input
          id="email"
          type="email"
          {...register("email")}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3.5 py-2.5 text-base transition-all duration-normal focus:border-primary-600 focus:shadow-glow focus:outline-none"
        />
        {errors.email && (
          <p className="mt-1 text-xs text-danger-600 animate-fade-in">{errors.email.message}</p>
        )}
      </div>

      <div className="animate-fade-in-up stagger-2">
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          Password
        </label>
        <input
          id="password"
          type="password"
          {...register("password")}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3.5 py-2.5 text-base transition-all duration-normal focus:border-primary-600 focus:shadow-glow focus:outline-none"
        />
        {errors.password && (
          <p className="mt-1 text-xs text-danger-600 animate-fade-in">{errors.password.message}</p>
        )}
      </div>

      {error && (
        <p className={cn("text-sm text-danger-600 animate-fade-in", shakeKey > 0 && "animate-shake")}>
          {error}
        </p>
      )}

      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-md bg-primary-600 px-5 py-2.5 text-sm font-medium text-white transition-all duration-normal hover:bg-primary-700 hover:shadow-md active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? (
          <span className="inline-flex items-center gap-2">
            <svg className="h-4 w-4 animate-spinner" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Logging in...
          </span>
        ) : "Log in"}
      </Button>
    </form>
  );
}
