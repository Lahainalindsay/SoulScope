"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, useSessionContext } from "@supabase/auth-helpers-react";
import { useState } from "react";
import { supabase } from "../lib/supabaseClient";

const links = [
  { href: "/", label: "Home" },
  { href: "/scan", label: "Scan" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/how-it-works", label: "How It Works" },
];

export default function Navbar() {
  const session = useSession();
  const { isLoading } = useSessionContext();
  const pathname = usePathname();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  // Hide the nav on API routes only; normal pages should show it.
  if (pathname?.startsWith("/api")) {
    return null;
  }

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await supabase.auth.signOut();
      router.replace("/");
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#07060d]/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4 text-sm text-white">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-serif text-lg tracking-wide text-cyan-200">
            SoulScope
          </Link>
          <nav className="hidden gap-4 md:flex">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`transition hover:text-cyan-300 ${pathname === link.href ? "text-cyan-200" : "text-gray-300"}`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3 text-xs">
          {session && !isLoading ? (
            <>
              <span className="hidden rounded-full border border-white/15 bg-white/5 px-3 py-1 text-gray-200 md:inline-flex">
                {session.user.email}
              </span>
              <button
                type="button"
                onClick={handleSignOut}
                className="rounded-full bg-gradient-to-r from-cyan-500 to-violet-500 px-4 py-2 text-white transition hover:scale-105"
                disabled={signingOut}
              >
                {signingOut ? "Signing out…" : "Sign Out"}
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-full border border-white/20 px-4 py-2 text-gray-200 transition hover:text-cyan-300"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
