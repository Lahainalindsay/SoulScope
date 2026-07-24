"use client";

import { useEffect } from "react";
import { useRouter } from "next/router";

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    void router.replace("/profile");
  }, [router]);

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", color: "white" }}>
      Opening profile...
    </div>
  );
}
