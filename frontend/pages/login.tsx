"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import { useRouter } from "next/router";
import { setLocalDevSession } from "@/lib/localSession";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");

  const handleLogin = async (e: any) => {
    e.preventDefault();
    setStatus("Logging in...");

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        if (error.message.toLowerCase().includes("fetch")) {
          setLocalDevSession(email);
          setStatus("Supabase auth is unreachable. Using local dev mode.");
          router.push("/dashboard");
          return;
        }
        setStatus(error.message);
      } else {
        setStatus("Success! Redirecting...");
        router.push("/dashboard");
      }
    } catch (error) {
      console.error("Login request failed", error);
      setLocalDevSession(email);
      setStatus("Supabase auth is unreachable. Using local dev mode.");
      router.push("/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-[#0D0D0D] to-[#1c1c1c] text-white flex items-center justify-center relative">
      {/* Sacred SVG overlay */}
      <svg className="absolute top-10 left-1/2 -translate-x-1/2 opacity-5" width="400" height="400" viewBox="0 0 200 200">
        <circle cx="100" cy="100" r="90" stroke="#F5C144" strokeWidth="0.5" fill="none" />
        <path d="M100,10 Q190,100 100,190 Q10,100 100,10" stroke="#6C4D9F" strokeWidth="0.3" fill="none" />
      </svg>

      <form onSubmit={handleLogin} className="w-full max-w-md bg-black/60 backdrop-blur-md p-8 rounded-xl border border-[#333] shadow-2xl">
        <h1 className="text-3xl font-serif mb-4 text-[var(--cosmic-violet)] tracking-wide">Welcome to SoulScope</h1>
        <p className="text-sm text-gray-400 mb-6">Log in to access your energetic dashboard.</p>

        <label className="block mb-4">
          <span className="text-sm text-gray-300">Email</span>
          <input
            type="email"
            required
            className="w-full px-4 py-2 mt-1 rounded bg-[#111] border border-[#333] focus:outline-none focus:border-[var(--electric-cyan)]"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>

        <label className="block mb-6">
          <span className="text-sm text-gray-300">Password</span>
          <input
            type="password"
            required
            className="w-full px-4 py-2 mt-1 rounded bg-[#111] border border-[#333] focus:outline-none focus:border-[var(--electric-cyan)]"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>

        <button
          type="submit"
          className="w-full bg-[var(--electric-cyan)] text-black py-2 rounded font-bold transition hover:scale-[1.02]"
        >
          Enter SoulScope
        </button>

        <p className="text-sm text-center mt-4 text-gray-400">
          Don&apos;t have an account?{" "}
          <Link href="/auth/signup" className="text-[var(--gold-illumination)] hover:underline">
            Start your free trial →
          </Link>
        </p>

        {status && (
          <p className="text-sm text-center mt-4 text-[var(--rose-quartz)]">
            {status}
          </p>
        )}
      </form>
    </div>
  );
}
