"use client";

import { useEffect } from "react";
import { useRouter } from "next/router";

export default function ResultsIndexPage() {
  const router = useRouter();

  useEffect(() => {
    void router.replace("/history");
  }, [router]);

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", color: "white" }}>
      Opening history...
    </div>
  );
}
