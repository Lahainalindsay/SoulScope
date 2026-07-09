import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabaseClient";
import { getLocalDevSession } from "../../lib/localSession";

type DebugState = {
  loading: boolean;
  sessionEmail: string | null;
  userEmail: string | null;
  userId: string | null;
  localDevEmail: string | null;
  error: string | null;
};

export default function AuthDebugPage() {
  const [state, setState] = useState<DebugState>({
    loading: true,
    sessionEmail: null,
    userEmail: null,
    userId: null,
    localDevEmail: null,
    error: null,
  });

  useEffect(() => {
    const load = async () => {
      try {
        const [{ data: sessionData }, { data: userData, error: userError }] = await Promise.all([
          supabase.auth.getSession(),
          supabase.auth.getUser(),
        ]);
        const localDevSession = getLocalDevSession();

        setState({
          loading: false,
          sessionEmail: sessionData.session?.user.email ?? null,
          userEmail: userData.user?.email ?? null,
          userId: userData.user?.id ?? null,
          localDevEmail: localDevSession?.email ?? null,
          error: userError?.message ?? null,
        });
      } catch (error) {
        setState((current) => ({
          ...current,
          loading: false,
          error: error instanceof Error ? error.message : "Failed to load auth debug state.",
        }));
      }
    };

    void load();
  }, []);

  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-16 text-white">
      <section className="mx-auto max-w-xl rounded-lg border border-white/10 bg-white/5 p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-cyan-200">Supabase Auth Debug</p>
        <h1 className="mt-3 text-2xl font-semibold">Current browser session</h1>

        {state.loading ? (
          <p className="mt-6 text-zinc-300">Checking session...</p>
        ) : (
          <dl className="mt-6 space-y-3 text-sm">
            <div>
              <dt className="text-zinc-400">Supabase session email</dt>
              <dd className="font-mono">{state.sessionEmail ?? "none"}</dd>
            </div>
            <div>
              <dt className="text-zinc-400">Supabase user email</dt>
              <dd className="font-mono">{state.userEmail ?? "none"}</dd>
            </div>
            <div>
              <dt className="text-zinc-400">Supabase user id</dt>
              <dd className="break-all font-mono">{state.userId ?? "none"}</dd>
            </div>
            <div>
              <dt className="text-zinc-400">Local dev email</dt>
              <dd className="font-mono">{state.localDevEmail ?? "none"}</dd>
            </div>
            <div>
              <dt className="text-zinc-400">Auth error</dt>
              <dd className="font-mono">{state.error ?? "none"}</dd>
            </div>
          </dl>
        )}

        <div className="mt-8 flex gap-3">
          <Link href="/auth/login" className="rounded bg-cyan-300 px-4 py-2 text-sm font-semibold text-black">
            Log In
          </Link>
          <Link href="/scan" className="rounded border border-white/20 px-4 py-2 text-sm text-white">
            New Scan
          </Link>
        </div>
      </section>
    </main>
  );
}
