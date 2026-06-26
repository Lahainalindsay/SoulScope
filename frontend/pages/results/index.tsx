"use client";

import { useEffect } from "react";
import { useRouter } from "next/router";

export default function ResultsIndexPage() {
  const router = useRouter();

  useEffect(() => {
    void router.replace("/dashboard");
  }, [router]);

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", color: "white" }}>
      Loading pattern history...
    </div>
  );
}
