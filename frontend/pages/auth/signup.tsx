"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../../lib/supabaseClient";
import { clearLocalDevSession, setLocalDevSession } from "../../lib/localSession";
import { normalizeProfileName, upsertOwnProfileName } from "../../lib/data/v2/profileRepository";

const DEFAULT_SIGNUP_HOME = "/profile";

function safeInternalDestination(value: string | string[] | undefined) {
  const candidate = Array.isArray(value) ? value[0] : value;
  if (!candidate || !candidate.startsWith("/") || candidate.startsWith("//")) return DEFAULT_SIGNUP_HOME;
  return candidate;
}

export default function SignupPage() {
  const router = useRouter();
  const [preferredName, setPreferredName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string>("");
  const destination = useMemo(() => safeInternalDestination(router.query.next), [router.query.next]);
  const loginHref = destination === DEFAULT_SIGNUP_HOME
    ? "/auth/login"
    : { pathname: "/auth/login", query: { next: destination } };

  const handleSignup = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    const displayName = normalizeProfileName(preferredName);
    if (!displayName) {
      setError("Tell us what SoulScope should call you.");
      return;
    }
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { display_name: displayName } },
      });
      if (error) {
        if (error.message.toLowerCase().includes("fetch")) {
          setLocalDevSession(email);
          await router.push(destination);
          return;
        }
        setError(error.message);
        return;
      }
      clearLocalDevSession();
      if (!data.session) {
        setError("Account created. Confirm your email, then sign in. SoulScope will ask for your preferred name again only if it was not saved.");
        return;
      }
      await upsertOwnProfileName(supabase, displayName);
      await router.push(destination);
    } catch (requestError) {
      console.error("Signup request failed", requestError);
      setError("Could not finish creating your account. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-violet-950 flex items-center justify-center text-white px-4">
      <form className="bg-zinc-900 p-8 rounded-xl shadow-xl w-full max-w-md" onSubmit={handleSignup}>
        <h2 className="text-2xl font-bold mb-2 text-yellow-300">Create your account</h2>
        <p className="text-sm text-zinc-300 mb-6">{destination === "/scan" ? "Create your account to begin your Resonance Scan." : "What should SoulScope call you?"}</p>
        <input type="text" placeholder="Preferred name" aria-label="Preferred name" maxLength={50} className="w-full px-4 py-2 mb-4 bg-black border border-zinc-700 rounded" value={preferredName} onChange={(event) => setPreferredName(event.target.value)} required />
        <input type="email" placeholder="Email" className="w-full px-4 py-2 mb-4 bg-black border border-zinc-700 rounded" value={email} onChange={(event) => setEmail(event.target.value)} required />
        <input type="password" placeholder="Password" className="w-full px-4 py-2 mb-6 bg-black border border-zinc-700 rounded" value={password} onChange={(event) => setPassword(event.target.value)} required />
        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
        <button type="submit" className="w-full bg-yellow-300 text-black py-2 rounded font-semibold shadow">Create Account</button>
        <p className="mt-4 text-sm text-center">Already have an account?{" "}<Link href={loginHref} className="text-yellow-300 underline">Log in</Link></p>
      </form>
    </div>
  );
}
