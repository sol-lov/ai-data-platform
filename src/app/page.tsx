import Link from "next/link";
import { Button } from "@/components/ui/button";
import { UploadCtaButton } from "@/components/upload-cta-button";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="mx-auto flex min-h-screen max-w-5xl flex-col px-6 pb-10 pt-16">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-8 w-8 rounded-xl bg-gradient-to-br from-purple-500 via-sky-500 to-emerald-400" />
            <span className="text-sm font-semibold tracking-tight">
              AI Data Platform
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Log in
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm">Get started</Button>
            </Link>
          </div>
        </header>

        <section className="mt-16 flex flex-1 flex-col gap-10 md:flex-row">
          <div className="flex-1 space-y-6">
            <h1 className="text-balance text-4xl font-semibold tracking-tight md:text-5xl">
              Upload spreadsheets.{" "}
              <span className="text-primary">Chat with your data.</span>
            </h1>
            <p className="max-w-xl text-muted-foreground">
              A production-grade workspace for CSV and Excel files. Ingest your
              data into Postgres, explore with a powerful table UI, and query it
              conversationally using AI.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <UploadCtaButton />
              <span className="text-xs text-muted-foreground">
                No demo fluff. Built for real workloads.
              </span>
            </div>
          </div>
          <div className="mt-10 flex-1 md:mt-0">
            <div className="rounded-2xl border bg-card/60 p-4 shadow-sm backdrop-blur">
              <div className="mb-3 flex items-center justify-between text-xs text-muted-foreground">
                <span>Preview</span>
                <span>Dark / Light ready</span>
              </div>
              <div className="h-64 rounded-xl border border-dashed border-muted-foreground/40 bg-gradient-to-br from-background to-muted/40 p-4 text-xs text-muted-foreground">
                Beautiful upload, table, and chat surfaces will live here.
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
