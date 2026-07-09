"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../../lib/supabaseClient";
import { clearLocalDevSession } from "../../lib/localSession";
import styles from "../Auth.module.css";
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
    <main className={styles.page}>
      <section className={styles.card}>
        <p className={styles.brand}>SoulScope</p>
        <h1 className={styles.title}>Sign in</h1>
        <p className={styles.lead}>Return to your private pattern space.</p>

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
            {isSubmitting ? "Signing in..." : "Open Today"}
          </button>
        </form>

        <p className={styles.secondary}>
          New to SoulScope? <Link href="/auth/signup" className={styles.link}>Create an account</Link>
        </p>
      </section>
    </main>
  );
}
