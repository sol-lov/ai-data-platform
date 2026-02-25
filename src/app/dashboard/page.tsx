import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyJwt } from "@/lib/auth";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { UploadDatasetCard } from "@/components/upload-dataset-card";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  const user = token ? verifyJwt(token) : null;

  if (!user) {
    redirect("/login?redirect=/dashboard");
  }

  const datasets = await db.dataset.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 pb-10 pt-6">
        <header className="flex items-center justify-between gap-4 border-b pb-4">
          <div className="flex items-center gap-2">
            <span className="h-7 w-7 rounded-xl bg-gradient-to-br from-purple-500 via-sky-500 to-emerald-400" />
            <div>
              <p className="text-sm font-semibold tracking-tight">
                AI Data Platform
              </p>
              <p className="text-xs text-muted-foreground">
                Workspace · {user.email}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <form action="/api/auth/logout" method="post">
              <Button size="sm" variant="outline" type="submit">
                Log out
              </Button>
            </form>
          </div>
        </header>

        <section className="mt-8 grid flex-1 gap-8 md:grid-cols-[minmax(0,2fr),minmax(0,3fr)]">
          <div className="space-y-6">
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold tracking-tight">
                Upload a dataset
              </h1>
              <p className="text-sm text-muted-foreground">
                Ingest a CSV or Excel file. We&apos;ll parse it into Postgres so
                you can explore it in a table and chat with it using AI.
              </p>
            </div>
            <UploadDatasetCard />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold tracking-tight">
                Recent datasets
              </h2>
              <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
                Overview
              </span>
            </div>
            {datasets.length === 0 ? (
              <div className="rounded-2xl border border-dashed bg-card/50 p-6 text-sm text-muted-foreground">
                No datasets yet. Upload your first CSV or Excel file to see it
                here and unlock table and chat views.
              </div>
            ) : (
              <div className="space-y-2 rounded-2xl border bg-card/70 p-4 text-sm">
                <ul className="space-y-2">
                  {datasets.map((d) => (
                    <li
                      key={d.id}
                      className="flex items-center justify-between gap-3"
                    >
                      <div>
                        <p className="font-medium">{d.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {d.rowCount} rows ·{" "}
                          {new Date(d.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <Link href={`/datasets/${d.id}`}>
                        <Button size="sm" variant="outline">
                          Open
                        </Button>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

