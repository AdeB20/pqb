import { z } from "zod";

export const registerSchema = z.object({
  fullName: z.string().min(2).max(100),
  email: z.string().email(),
  matricNumber: z.string().min(6).max(20),
  facultyId: z.string().uuid(),
  departmentId: z.string().uuid(),
  currentLevel: z.preprocess(
    (v) => (v ? Number(v) : v),
    z.number().int().min(100).max(600),
  ),
});

export const setPasswordSchema = z.object({
  password: z.string().min(8),
  confirmPassword: z.string().min(8),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const uploadSchema = z.object({
  courseId: z.string().uuid(),
  year: z.preprocess(
    (v) => (v ? Number(v) : v),
    z.number().int().min(1990).max(new Date().getFullYear()),
  ),
  semester: z.enum(["first", "second"]),
  examType: z.enum(["mid_semester", "examination"]).default("examination"),
});

export const solutionSchema = z.object({
  body: z.string().min(1, "Solution text is required"),
});
