"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../../lib/supabaseClient";
import { clearLocalDevSession } from "../../lib/localSession";
const DEFAULT_AUTH_HOME = "/dashboard";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setStatus("Opening your private space...");
    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
        setStatus("");
        return;
      }

      if (!data.session) {
        setError("We could not open a session yet. Confirm your email, then try again.");
        setStatus("");
        return;
      }

      clearLocalDevSession();
      setStatus("Signed in. Opening today.");
      await router.push(DEFAULT_AUTH_HOME);
    } catch (error) {
      console.error("Login request failed", error);
      setError(error instanceof Error ? error.message : "Sign in could not be completed.");
      setStatus("");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-violet-900 flex items-center justify-center text-white px-4">
      <form className="bg-zinc-900 p-8 rounded-xl shadow-xl w-full max-w-md" onSubmit={handleLogin}>
        <h2 className="text-2xl font-bold mb-4 text-yellow-300">Sign in</h2>
        <input
          type="email"
          placeholder="Email"
          className="w-full px-4 py-2 mb-4 bg-black border border-zinc-700 rounded"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          className="w-full px-4 py-2 mb-6 bg-black border border-zinc-700 rounded"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
        {status && <p className="text-cyan-200 text-sm mb-4">{status}</p>}
        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-yellow-300 text-black py-2 rounded font-semibold shadow disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Signing in..." : "Open Today"}
        </button>
        <p className="mt-4 text-sm text-center">
          New to SoulScope?{" "}
          <Link href="/auth/signup" className="text-yellow-300 underline">
            Sign up
          </Link>
        </p>
      </form>
    </div>
  );
}
