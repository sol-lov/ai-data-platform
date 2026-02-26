import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { verifyJwt } from "@/lib/auth";
import { db } from "@/lib/db";
import { DatasetTable } from "@/components/dataset-table";
import { DatasetChat } from "@/components/dataset-chat";
import { Button } from "@/components/ui/button";
import Link from "next/link";

type Params = {
  params: {
    id: string;
  };
};

export default async function DatasetPage({ params }: Params) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  const user = token ? verifyJwt(token) : null;

  if (!user) {
    redirect(`/login?redirect=/datasets/${params.id}`);
  }

  const dataset = await db.dataset.findFirst({
    where: {
      id: params.id,
      OR: [{ userId: user.id }, { user: { role: "ADMIN" } }],
    },
  });

  if (!dataset) {
    notFound();
  }

  const pageSize = 50;
  const initialRecords = await db.record.findMany({
    where: { datasetId: dataset.id },
    orderBy: { index: "asc" },
    take: pageSize,
  });

  const initialRows = initialRecords.map((r:any) => ({
    id: r.id,
    index: r.index,
    data: r.data as Record<string, unknown>,
  }));

  const totalCount = await db.record.count({
    where: { datasetId: dataset.id },
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 pb-10 pt-6">
        <header className="flex items-center justify-between gap-4 border-b pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Link href="/dashboard" className="hover:underline">
                Datasets
              </Link>
              <span>/</span>
              <span>{dataset.name}</span>
            </div>
            <h1 className="text-xl font-semibold tracking-tight">
              {dataset.name}
            </h1>
            <p className="text-xs text-muted-foreground">
              {dataset.rowCount} rows · Uploaded{" "}
              {new Date(dataset.createdAt).toLocaleString()}
            </p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard">Back to dashboard</Link>
          </Button>
        </header>

        <section className="mt-6 grid flex-1 gap-6 md:grid-cols-[minmax(0,3fr),minmax(0,2.4fr)]">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold tracking-tight">
                Data table
              </h2>
              <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
                Rows preview
              </span>
            </div>
            <DatasetTable
              datasetId={dataset.id}
              initialRows={initialRows}
              totalCount={totalCount}
            />
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold tracking-tight">
                Chat with data
              </h2>
              <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
                AI assistant
              </span>
            </div>
            <DatasetChat datasetId={dataset.id} />
          </div>
        </section>
      </main>
    </div>
  );
}

