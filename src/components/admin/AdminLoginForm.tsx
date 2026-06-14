"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function AdminLoginForm({ secret }: { secret: string }) {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [processingToken, setProcessingToken] = useState(true);

  useEffect(() => {
    const hash = window.location.hash;
    if (!hash || !hash.includes("access_token")) {
      setProcessingToken(false);
      return;
    }

    const params = new URLSearchParams(hash.replace("#", ""));
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");
    const type = params.get("type");

    if (!accessToken || !refreshToken) {
      setProcessingToken(false);
      return;
    }

    (async () => {
      const { error: sessionErr } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      if (sessionErr) {
        setError(sessionErr.message);
        setProcessingToken(false);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError("Could not verify identity");
        setProcessingToken(false);
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
        setProcessingToken(false);
        return;
      }

      window.location.href = `/admin/${secret}/dashboard`;
    })();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
      {processingToken ? (
        <p className="text-center text-sm text-gray-500">Processing recovery link...</p>
      ) : (
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-primary-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>
      )}
    </form>
  );
}
