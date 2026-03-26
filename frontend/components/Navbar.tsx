"use client";

import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { clearLocalDevSession, getLocalDevSession } from "../lib/localSession";
import styles from "./Navbar.module.css";

const NAV_ITEMS = [
  { href: "/scan", label: "Scan" },
  { href: "/results", label: "Results" },
  { href: "/history", label: "History" },
  { href: "/how-it-works", label: "How it works" },
];

export default function Navbar() {
  const [email, setEmail] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getUser().then(({ data, error }) => {
      if (data?.user?.email) {
        setEmail(data.user.email);
        return;
      }
      if (error || !data?.user) {
        setEmail(getLocalDevSession()?.email ?? null);
      }
    });
  }, []);

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
            <p className={styles.brandSub}>Voice Frequency Profile</p>
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
