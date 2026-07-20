"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../../lib/supabaseClient";
import { clearLocalDevSession } from "../../lib/localSession";
import styles from "../Auth.module.css";

const DEFAULT_AUTH_HOME = "/dashboard";

function safeInternalDestination(value: string | string[] | undefined) {
  const candidate = Array.isArray(value) ? value[0] : value;
  if (!candidate || !candidate.startsWith("/") || candidate.startsWith("//")) return DEFAULT_AUTH_HOME;
  return candidate;
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const destination = useMemo(() => safeInternalDestination(router.query.next), [router.query.next]);
  const signupHref = destination === DEFAULT_AUTH_HOME
    ? "/auth/signup"
    : { pathname: "/auth/signup", query: { next: destination } };

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setStatus("Signing in...");
    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
        setStatus("");
        return;
      }

      if (!data.session) {
        setError("Confirm your email, then try again.");
        setStatus("");
        return;
      }

      clearLocalDevSession();
      setStatus(destination === "/scan" ? "Opening your scan..." : "Opening SoulScope...");
      await router.push(destination);
    } catch (error) {
      console.error("Login request failed", error);
      setError(error instanceof Error ? error.message : "We couldn't sign you in.");
      setStatus("");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <p className={styles.brand}>SoulScope</p>
        <h1 className={styles.title}>Welcome back.</h1>
        <p className={styles.lead}>{destination === "/scan" ? "Sign in to begin your Resonance Scan." : "Return to your reflections."}</p>

        <form className={styles.form} onSubmit={handleLogin}>
          <label className={styles.field}>
            <span className={styles.label}>Email</span>
            <input className={styles.input} type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>Password</span>
            <input className={styles.input} type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
          </label>
          {status ? <p className={styles.message}>{status}</p> : null}
          {error ? <p className={styles.error}>{error}</p> : null}
          <button type="submit" disabled={isSubmitting} className={styles.button}>
            {isSubmitting ? "Signing In" : "Sign In"}
          </button>
        </form>

        <p className={styles.secondary}>
          New here? <Link href={signupHref} className={styles.link}>Create Account</Link>
        </p>
      </section>
    </main>
  );
}
