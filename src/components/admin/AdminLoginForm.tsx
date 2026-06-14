"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function AdminLoginForm({ secret }: { secret: string }) {
  const supabase = createClient();
  const [mode, setMode] = useState<"loading" | "login" | "set-password">("loading");

  // login form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // set-password form state
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    const hash = window.location.hash;
    if (!hash || !hash.includes("access_token")) {
      setMode("login");
      return;
    }

    const params = new URLSearchParams(hash.replace("#", ""));
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");

    if (!accessToken || !refreshToken) {
      setMode("login");
      return;
    }

    (async () => {
      const { error: sessionErr } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      if (sessionErr) {
        setError(sessionErr.message);
        setMode("login");
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError("Could not verify identity");
        setMode("login");
        return;
      }

      const { data: rawProfile } = await supabase
        .from("profiles")
        .select("role")
        .eq("auth_user_id", user.id)
        .single();
      const profile = rawProfile as unknown as { role: string } | null;

      if (profile?.role !== "super_admin") {
        await supabase.auth.signOut();
        setError("Not authorized as admin");
        setMode("login");
        return;
      }

      setMode("set-password");
    })();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error: signInError } =
      await supabase.auth.signInWithPassword({ email, password });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) {
      setError("Could not verify identity");
      setLoading(false);
      return;
    }

    const { data: rawProfile } = await supabase
      .from("profiles")
      .select("role")
      .eq("auth_user_id", userId)
      .single();
    const profile = rawProfile as unknown as { role: string } | null;

    if (profile?.role !== "super_admin") {
      await supabase.auth.signOut();
      setError("Not authorized as admin");
      setLoading(false);
      return;
    }

    window.location.href = `/admin/${secret}/dashboard`;
  };

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    const { error: updateErr } = await supabase.auth.updateUser({ password: newPassword });
    if (updateErr) {
      setError(updateErr.message);
      setLoading(false);
      return;
    }

    window.location.href = `/admin/${secret}/dashboard`;
  };

  if (mode === "loading") {
    return <p className="text-center text-sm text-gray-500">Loading...</p>;
  }

  if (mode === "set-password") {
    return (
      <form onSubmit={handleSetPassword} className="space-y-4">
        <div>
          <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
            New password
          </label>
          <input
            id="newPassword"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={6}
            placeholder="At least 6 characters"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3.5 py-2.5 text-base focus:border-primary-600 focus:ring-2 focus:ring-primary-100"
          />
        </div>
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
            Confirm password
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={6}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3.5 py-2.5 text-base focus:border-primary-600 focus:ring-2 focus:ring-primary-100"
          />
        </div>
        {error && <p className="text-sm text-danger-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-primary-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
        >
          {loading ? "Setting password..." : "Set password & log in"}
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleLogin} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="mt-1 block w-full rounded-md border border-gray-300 px-3.5 py-2.5 text-base focus:border-primary-600 focus:ring-2 focus:ring-primary-100"
        />
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="mt-1 block w-full rounded-md border border-gray-300 px-3.5 py-2.5 text-base focus:border-primary-600 focus:ring-2 focus:ring-primary-100"
        />
      </div>
      {error && <p className="text-sm text-danger-600">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-md bg-primary-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
      >
        {loading ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
