import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyJwt } from "@/lib/auth";

const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 200;

export async function GET(req: NextRequest, context: any) {
  try {
    const token = req.cookies.get("token")?.value;
    const user = token ? verifyJwt(token) : null;

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const datasetId = context.params?.id as string;
    const searchParams = req.nextUrl.searchParams;

    const page = Math.max(
      1,
      parseInt(searchParams.get("page") || "1", 10) || 1
    );

    const rawPageSize =
      parseInt(searchParams.get("pageSize") || "", 10) || DEFAULT_PAGE_SIZE;
    const pageSize = Math.min(Math.max(rawPageSize, 1), MAX_PAGE_SIZE);

    const [dataset, totalCount] = await Promise.all([
      db.dataset.findFirst({
        where: {
          id: datasetId,
          OR: [{ userId: user.id }, { user: { role: "ADMIN" } }],
        },
      }),
      db.record.count({
        where: { datasetId },
      }),
    ]);

    if (!dataset) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const records = await db.record.findMany({
      where: { datasetId },
      orderBy: { index: "asc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return NextResponse.json(
      {
        dataset,
        rows: records.map((r) => ({
          id: r.id,
          index: r.index,
          data: r.data,
        })),
        page,
        pageSize,
        totalCount,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Fetch dataset rows error", error);
    return NextResponse.json(
      { error: "Failed to load rows" },
      { status: 500 }
    );
  }
}

