"use client";

import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useUser } from "@supabase/auth-helpers-react";
import { supabase } from "../lib/supabaseClient";
import { clearLocalDevSession, getLocalDevSession } from "../lib/localSession";
import styles from "./Navbar.module.css";

const PUBLIC_NAV_ITEMS = [
  { href: "/how-it-works", label: "How It Works" },
  { href: "/#privacy", label: "Privacy" },
];

const PRIVATE_NAV_ITEMS = [
  { href: "/dashboard", label: "Home" },
  { href: "/scan", label: "Scan" },
  { href: "/history", label: "History" },
  { href: "/profile", label: "Profile" },
];

const START_SCAN_LOGIN = { pathname: "/auth/login", query: { next: "/scan" } };

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
    if (href.includes("#")) return router.asPath === href;
    if (href === "/dashboard") return router.pathname === "/dashboard";
    if (href === "/history") return router.pathname === "/history";
    if (href === "/profile") return router.pathname === "/profile";
    if (href === "/settings") return router.pathname === "/settings";
    return router.pathname === href || router.pathname.startsWith(`${href}/`);
  };

  const scanLabel = email ? "Start New Scan" : "Begin Scan";
  const desktopItems = email ? PRIVATE_NAV_ITEMS : PUBLIC_NAV_ITEMS;
  const mobileItems = email ? [...PRIVATE_NAV_ITEMS, { href: "/settings", label: "Settings" }] : PUBLIC_NAV_ITEMS;

  return (
    <nav className={styles.nav} aria-label="Main navigation">
      <div className={styles.inner}>
        <Link href="/" className={styles.brand} aria-label="SoulScope home">
          <div className={styles.mark} aria-hidden="true">S</div>
          <p className={styles.brandTitle}>SOULSCOPE</p>
        </Link>

        <div className={styles.links}>
          {desktopItems.map((item) => (
            <Link key={item.href} href={item.href} className={`${styles.link} ${isActive(item.href) ? styles.linkActive : ""}`}>
              {item.label}
            </Link>
          ))}
        </div>

        <div className={styles.actions}>
          {email ? (
            <>
              <Link href="/scan" className={styles.buttonPrimary}>{scanLabel}</Link>
              <Link href="/settings" className={styles.button}>Settings</Link>
              <button onClick={handleSignOut} className={styles.button}>Sign Out</button>
            </>
          ) : (
            <>
              <Link href="/auth/login" className={styles.button}>Sign In</Link>
              <Link href={START_SCAN_LOGIN} className={styles.buttonPrimary}>Begin Scan</Link>
            </>
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
                <>
                  <Link href="/auth/login" className={styles.mobileLink}>Sign In</Link>
                  <Link href={START_SCAN_LOGIN} className={styles.mobilePrimary}>Begin Scan</Link>
                </>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </nav>
  );
}
