"use client";

import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useUser } from "@supabase/auth-helpers-react";
import { supabase } from "../lib/supabaseClient";
import { clearLocalDevSession, getLocalDevSession } from "../lib/localSession";
import styles from "./Navbar.module.css";

const NAV_ITEMS = [
  { href: "/scan", label: "Resonance Scan" },
  { href: "/results", label: "Insights" },
  { href: "/history", label: "Trends" },
  { href: "/how-it-works", label: "How it works" },
];

export default function Navbar() {
  const user = useUser();
  const [email, setEmail] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (user?.email) {
      setEmail(user.email);
      return;
    }

    supabase.auth.getUser().then(({ data }) => {
      setEmail(data?.user?.email ?? getLocalDevSession()?.email ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user?.email ?? getLocalDevSession()?.email ?? null);
    });

    return () => subscription.unsubscribe();
  }, [user?.email]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    clearLocalDevSession();
    setEmail(null);
    void router.push("/auth/login");
  };

  return (
    <nav className={styles.nav}>
      <div className={styles.inner}>
        <Link href="/" className={styles.brand}>
          <div className={styles.mark}>S</div>
          <div>
            <p className={styles.brandTitle}>SoulScope™</p>
            <p className={styles.brandSub}>Whole-Self Resonance Analysis</p>
          </div>
        </Link>

        <div className={styles.links}>
          {NAV_ITEMS.map((item) => {
            const isActive = router.pathname === item.href || router.pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.link} ${isActive ? styles.linkActive : ""}`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        <div className={styles.actions}>
          {email ? <div className={styles.email}>{email}</div> : null}
          {email ? (
            <button onClick={handleSignOut} className={styles.button}>
              Sign out
            </button>
          ) : (
            <Link href="/auth/login" className={styles.button}>
              Sign in
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
