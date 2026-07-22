"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../../lib/supabaseClient";
import { clearLocalDevSession, setLocalDevSession } from "../../lib/localSession";
import { normalizeProfileName, upsertOwnProfileName } from "../../lib/data/v2/profileRepository";
import styles from "../Auth.module.css";

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
    <main className={styles.page}>
      <section className={styles.card}>
        <p className={styles.brand}>SoulScope</p>
        <h1 className={styles.title}>Create your private SoulScope.</h1>
        <p className={styles.lead}>
          Your account keeps your Resonance Signatures, Reflections, and history connected over time.
        </p>

        <form className={styles.form} onSubmit={handleSignup}>
          <label className={styles.field}>
            <span className={styles.label}>Preferred name</span>
            <input
              type="text"
              className={styles.input}
              value={preferredName}
              maxLength={50}
              onChange={(event) => setPreferredName(event.target.value)}
              required
            />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>Email</span>
            <input
              type="email"
              className={styles.input}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>Password</span>
            <input
              type="password"
              className={styles.input}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>
          {error ? <p className={styles.error}>{error}</p> : null}
          <button type="submit" className={styles.button}>Create Account</button>
        </form>

        <p className={styles.secondary}>
          Already have an account? <Link href={loginHref} className={styles.link}>Sign In</Link>
        </p>
      </section>
    </main>
  );
}
