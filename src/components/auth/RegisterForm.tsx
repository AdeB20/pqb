"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { registerSchema } from "@/lib/validations";
import { Button } from "@/components/ui/button";

type FormData = z.infer<typeof registerSchema>;

interface Faculty {
  id: string;
  name: string;
}

interface Department {
  id: string;
  name: string;
  available_levels: number[];
}

export function RegisterForm() {
  const router = useRouter();
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [levels, setLevels] = useState<number[]>([]);
  const [error, setError] = useState("");

  const [shakeKey, setShakeKey] = useState(0);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(registerSchema) as any,
  });

  const selectedFaculty = watch("facultyId");
  const selectedDepartment = watch("departmentId");

  useEffect(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
    const headers = { apikey: anonKey };
    fetch(`${supabaseUrl}/rest/v1/faculties?select=id,name&order=name.asc`, { headers })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => { if (data.length) setFaculties(data); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedFaculty) {
      setDepartments([]);
      setLevels([]);
      return;
    }
    fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/departments?select=id,name,available_levels&faculty_id=eq.${selectedFaculty}&order=name.asc`,
      { headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! } },
    )
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        setDepartments(data);
        setLevels([]);
        (setValue as any)("departmentId", "");
      });
  }, [selectedFaculty, setValue]);

  useEffect(() => {
    if (!selectedDepartment) {
      setLevels([]);
      return;
    }
    const dept = departments.find((d) => d.id === selectedDepartment);
    if (dept) setLevels(dept.available_levels);
  }, [selectedDepartment, departments]);

  const onSubmit = async (data: FormData) => {
    setError("");

    const otpRes = await fetch("/api/auth/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: data.email,
        fullName: data.fullName,
        matricNumber: data.matricNumber,
        departmentId: data.departmentId,
        currentLevel: data.currentLevel,
      }),
    });

    if (!otpRes.ok) {
      const { error: otpErr } = await otpRes.json();
      setError(otpErr || "Failed to send OTP");
      setShakeKey((k) => k + 1);
      return;
    }

    const params = new URLSearchParams({ email: data.email });
    router.push(`/register/verify?${params}`);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" key={shakeKey}>
      <div className="animate-fade-in-up stagger-1">
        <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
          Full name
        </label>
        <input
          id="fullName"
          {...register("fullName")}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3.5 py-2.5 text-base transition-all duration-normal focus:border-primary-600 focus:shadow-glow focus:outline-none"
        />
        {errors.fullName && (
          <p className="mt-1 text-xs text-danger-600 animate-fade-in">{errors.fullName.message}</p>
        )}
      </div>

      <div className="animate-fade-in-up stagger-2">
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          University email
        </label>
        <input
          id="email"
          type="email"
          {...register("email")}
          onBlur={(e) => {
            const domain = process.env.NEXT_PUBLIC_UNIVERSITY_EMAIL_DOMAIN || "";
            if (e.target.value && !e.target.value.endsWith(domain)) {
              setError(`Only ${domain} emails are accepted`);
            } else {
              setError("");
            }
          }}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3.5 py-2.5 text-base transition-all duration-normal focus:border-primary-600 focus:shadow-glow focus:outline-none"
        />
        {errors.email && (
          <p className="mt-1 text-xs text-danger-600 animate-fade-in">{errors.email.message}</p>
        )}
      </div>

      <div className="animate-fade-in-up stagger-3">
        <label htmlFor="matricNumber" className="block text-sm font-medium text-gray-700">
          Matric number
        </label>
        <input
          id="matricNumber"
          {...register("matricNumber")}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3.5 py-2.5 text-base transition-all duration-normal focus:border-primary-600 focus:shadow-glow focus:outline-none"
        />
        {errors.matricNumber && (
          <p className="mt-1 text-xs text-danger-600 animate-fade-in">{errors.matricNumber.message}</p>
        )}
      </div>

      <div className="animate-fade-in-up stagger-4">
        <label htmlFor="facultyId" className="block text-sm font-medium text-gray-700">
          Faculty
        </label>
        <select
          id="facultyId"
          {...register("facultyId")}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3.5 py-2.5 text-base transition-all duration-normal focus:border-primary-600 focus:shadow-glow focus:outline-none"
        >
          <option value="">Select faculty</option>
          {faculties.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>
        {errors.facultyId && (
          <p className="mt-1 text-xs text-danger-600 animate-fade-in">{errors.facultyId.message}</p>
        )}
      </div>

      <div className="animate-fade-in-up stagger-5">
        <label htmlFor="departmentId" className="block text-sm font-medium text-gray-700">
          Department
        </label>
        <select
          id="departmentId"
          {...register("departmentId")}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3.5 py-2.5 text-base transition-all duration-normal focus:border-primary-600 focus:shadow-glow focus:outline-none"
        >
          <option value="">Select department</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
        {errors.departmentId && (
          <p className="mt-1 text-xs text-danger-600 animate-fade-in">{errors.departmentId.message}</p>
        )}
      </div>

      <div className="animate-fade-in-up stagger-6">
        <label htmlFor="currentLevel" className="block text-sm font-medium text-gray-700">
          Current level
        </label>
        <select
          id="currentLevel"
          {...register("currentLevel")}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3.5 py-2.5 text-base transition-all duration-normal focus:border-primary-600 focus:shadow-glow focus:outline-none"
        >
          <option value="">Select level</option>
          {levels.map((l) => (
            <option key={l} value={l}>
              {l} Level
            </option>
          ))}
        </select>
        {errors.currentLevel && (
          <p className="mt-1 text-xs text-danger-600 animate-fade-in">{errors.currentLevel.message}</p>
        )}
      </div>

      {error && (
        <p className="text-sm text-danger-600 animate-fade-in">{error}</p>
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
            Sending code...
          </span>
        ) : "Send OTP"}
      </Button>
    </form>
  );
}
