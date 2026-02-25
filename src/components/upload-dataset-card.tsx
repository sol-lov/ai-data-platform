"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function UploadDatasetCard() {
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      if (name) formData.append("name", name);

      const res = await fetch("/api/datasets/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.datasetId) {
        router.push(`/datasets/${data.datasetId}`);
      } else {
        alert(data?.error ?? "Failed to upload file.");
      }
    } catch {
      alert("Unexpected error during upload.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border bg-card p-5 shadow-sm">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm font-medium">Upload CSV / Excel</p>
          <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
            New
          </span>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2 text-xs text-muted-foreground">
            <input
              type="file"
              accept=".csv, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              onChange={(e) => {
                const f = e.target.files?.[0] || null;
                setFile(f);
                if (f && !name) {
                  setName(f.name);
                }
              }}
              className="block w-full cursor-pointer rounded-md border border-dashed border-muted-foreground/50 bg-background px-3 py-6 text-xs file:mr-4 file:rounded-md file:border-0 file:bg-primary/10 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-primary hover:border-muted-foreground/80"
            />
            <p>Supported: CSV, .xls, .xlsx up to 20MB.</p>
          </div>
          <div className="space-y-1 text-xs">
            <label className="text-xs font-medium text-muted-foreground">
              Dataset name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Sales report Q1 2026"
              className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[2px]"
            />
          </div>
          <Button type="submit" size="sm" disabled={loading || !file}>
            {loading ? "Uploading…" : "Upload and parse"}
          </Button>
        </form>
      </div>
    </div>
  );
}

