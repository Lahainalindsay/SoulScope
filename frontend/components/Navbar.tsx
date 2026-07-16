"use client";

import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useUser } from "@supabase/auth-helpers-react";
import { supabase } from "../lib/supabaseClient";
import { clearLocalDevSession, getLocalDevSession } from "../lib/localSession";
import styles from "./Navbar.module.css";

const BASE_NAV_ITEMS = [
  { href: "/dashboard", label: "Today" },
  { href: "/history", label: "Pattern History" },
  { href: "/how-it-works", label: "How It Works" },
];

export default function Navbar() {
  const user = useUser();
  const [email, setEmail] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
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

  useEffect(() => {
    setMenuOpen(false);
  }, [router.asPath]);

  useEffect(() => {
    if (!menuOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [menuOpen]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    clearLocalDevSession();
    setEmail(null);
    setMenuOpen(false);
    void router.push("/auth/login");
  };

  const isActive = (href: string) => {
    if (href === "/dashboard") return router.pathname === "/dashboard";
    if (href === "/history") return router.pathname === "/history";
    return router.pathname === href || router.pathname.startsWith(`${href}/`);
  };

  const scanLabel = email ? "Start New Scan" : "Start Scan";
  const desktopItems = [BASE_NAV_ITEMS[0], { href: "/scan", label: scanLabel }, ...BASE_NAV_ITEMS.slice(1)];
  const mobileItems = [...desktopItems, { href: "/profile", label: "Profile" }];

  return (
    <nav className={styles.nav} aria-label="Main navigation">
      <div className={styles.inner}>
        <Link href="/" className={styles.brand} aria-label="SoulScope home">
          <div className={styles.mark} aria-hidden="true">S</div>
          <p className={styles.brandTitle}>SoulScope™</p>
        </Link>

        <div className={styles.links}>
          {desktopItems.map((item) => (
            <Link key={item.href} href={item.href} className={`${styles.link} ${isActive(item.href) ? styles.linkActive : ""}`}>
              {item.label}
            </Link>
          ))}
        </div>

        <div className={styles.actions}>
          {email ? <div className={styles.email}>{email}</div> : null}
          {email ? (
            <button onClick={handleSignOut} className={styles.button}>Sign out</button>
          ) : (
            <Link href="/auth/login" className={styles.button}>Sign in</Link>
          )}
        </div>

        <button
          type="button"
          className={`${styles.menuButton} ${menuOpen ? styles.menuButtonOpen : ""}`}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          aria-controls="mobile-navigation"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span />
          <span />
          <span />
        </button>
      </div>

      {menuOpen ? (
        <div className={styles.mobileLayer}>
          <button type="button" className={styles.backdrop} aria-label="Close menu" onClick={() => setMenuOpen(false)} />
          <div id="mobile-navigation" className={styles.drawer} role="dialog" aria-modal="true" aria-label="Navigation menu">
            <div className={styles.drawerHeader}>
              <span>Menu</span>
              <button type="button" className={styles.closeButton} onClick={() => setMenuOpen(false)} aria-label="Close menu">×</button>
            </div>
            <div className={styles.mobileLinks}>
              {mobileItems.map((item) => (
                <Link key={item.href} href={item.href} className={`${styles.mobileLink} ${isActive(item.href) ? styles.mobileLinkActive : ""}`}>
                  {item.label}
                </Link>
              ))}
              {email ? (
                <button type="button" onClick={handleSignOut} className={styles.mobileSignOut}>Sign Out</button>
              ) : (
                <Link href="/auth/login" className={styles.mobileLink}>Sign In</Link>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </nav>
  );
}
