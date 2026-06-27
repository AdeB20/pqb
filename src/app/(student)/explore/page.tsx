"use client";

import { useEffect, useState } from "react";

interface Faculty { id: string; name: string }
interface Department { id: string; name: string }
interface Course { id: string; code: string; title: string; level: number }

export default function ExplorePage() {
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);

  const [selectedFaculty, setSelectedFaculty] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");

  const [loadingFaculties, setLoadingFaculties] = useState(true);
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/browse/faculties")
      .then((r) => r.json())
      .then((d) => setFaculties(d.faculties ?? []))
      .catch(() => setError("Failed to load faculties"))
      .finally(() => setLoadingFaculties(false));
  }, []);

  useEffect(() => {
    if (!selectedFaculty) {
      setDepartments([]);
      setSelectedDepartment("");
      return;
    }
    setLoadingDepartments(true);
    setSelectedDepartment("");
    setCourses([]);
    setSelectedCourse("");
    fetch(`/api/browse/departments?faculty_id=${selectedFaculty}`)
      .then((r) => r.json())
      .then((d) => setDepartments(d.departments ?? []))
      .catch(() => setError("Failed to load departments"))
      .finally(() => setLoadingDepartments(false));
  }, [selectedFaculty]);

  useEffect(() => {
    if (!selectedDepartment) {
      setCourses([]);
      setSelectedCourse("");
      return;
    }
    setLoadingCourses(true);
    setSelectedCourse("");
    fetch(`/api/browse/courses?department_id=${selectedDepartment}`)
      .then((r) => r.json())
      .then((d) => setCourses(d.courses ?? []))
      .catch(() => setError("Failed to load courses"))
      .finally(() => setLoadingCourses(false));
  }, [selectedDepartment]);

  useEffect(() => {
    if (selectedCourse) {
      window.location.href = `/course/${selectedCourse}`;
    }
  }, [selectedCourse]);

  return (
    <div className="space-y-6">
      <div className="rounded-[1.75rem] border border-white/70 bg-white/70 p-5 shadow-[0_18px_45px_rgba(63,39,50,0.08)] backdrop-blur-xl">
        <h2 className="text-xl font-semibold text-primary">Other Past Questions</h2>
        <p className="mt-1 text-sm text-gray-500">
          Select a faculty, programme, and course to browse past questions
        </p>
      </div>

      {error && (
        <p className="rounded-2xl bg-danger-50 px-3 py-2 text-sm text-danger-600">{error}</p>
      )}

      <div className="grid gap-5 sm:grid-cols-3">
        <div>
          <label className="block text-sm font-medium text-gray-700">Faculty</label>
          <select
            value={selectedFaculty}
            onChange={(e) => setSelectedFaculty(e.target.value)}
            disabled={loadingFaculties}
            className="mt-1 block w-full disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">{loadingFaculties ? "Loading..." : "Select faculty"}</option>
            {faculties.map((f) => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Programme</label>
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            disabled={!selectedFaculty || loadingDepartments}
            className="mt-1 block w-full disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">{loadingDepartments ? "Loading..." : "Select programme"}</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Course</label>
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            disabled={!selectedDepartment || loadingCourses}
            className="mt-1 block w-full disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">{loadingCourses ? "Loading..." : "Select course"}</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} — {c.title} ({c.level} Level)
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
