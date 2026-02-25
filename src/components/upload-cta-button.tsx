"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function UploadCtaButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/me", { method: "GET" });
      if (res.ok) {
        router.push("/dashboard");
      } else {
        router.push("/register");
      }
    } catch {
      router.push("/register");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button size="lg" onClick={handleClick} disabled={loading}>
      {loading ? "Checking your workspace…" : "Upload your first file"}
    </Button>
  );
}

