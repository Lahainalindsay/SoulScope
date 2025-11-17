"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../../lib/supabaseClient";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string>("");

  const handleSignup = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setError(error.message);
      return;
    }
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-violet-950 flex items-center justify-center text-white px-4">
      <form className="bg-zinc-900 p-8 rounded-xl shadow-xl w-full max-w-md" onSubmit={handleSignup}>
        <h2 className="text-2xl font-bold mb-4 text-yellow-300">Create Account</h2>
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
        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
        <button type="submit" className="w-full bg-yellow-300 text-black py-2 rounded font-semibold shadow">
          Sign Up
        </button>
        <p className="mt-4 text-sm text-center">
          Already have an account?{" "}
          <a href="/auth/login" className="text-yellow-300 underline">
            Log in
          </a>
        </p>
      </form>
    </div>
  );
}
