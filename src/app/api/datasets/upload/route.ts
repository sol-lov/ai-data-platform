import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { db } from "@/lib/db";
import { verifyJwt } from "@/lib/auth";

const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20MB

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get("token")?.value;
    const user = token ? verifyJwt(token) : null;

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file");
    const name = formData.get("name");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: "File too large. Max 20MB." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const workbook = XLSX.read(buffer, { type: "buffer" });

    const allRows: {
      datasetId: string;
      index: number;
      data: Record<string, unknown>;
    }[] = [];

    let globalIndex = 0;

    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      if (!sheet) continue;

      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
        defval: null,
      });

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        allRows.push({
          datasetId: "", // fill after dataset is created
          index: globalIndex,
          data: {
            __sheet: sheetName,
            __rowIndex: i,
            ...row,
          },
        });
        globalIndex += 1;
      }
    }

    if (allRows.length === 0) {
      return NextResponse.json(
        { error: "No data rows found in file." },
        { status: 400 }
      );
    }

    const dataset = await db.dataset.create({
      data: {
        name:
          (typeof name === "string" && name.trim().length > 0
            ? name
            : file.name) ?? "Untitled dataset",
        filename: file.name,
        sizeBytes: file.size,
        mimeType: file.type || "application/octet-stream",
        rowCount: allRows.length,
        userId: user.id,
      },
    });

    const rowsToInsert = allRows.map((r) => ({
      ...r,
      datasetId: dataset.id,
    }));

    // Chunked insert to avoid exceeding parameter limits.
    const chunkSize = 1000;
    for (let i = 0; i < rowsToInsert.length; i += chunkSize) {
      const chunk = rowsToInsert.slice(i, i + chunkSize);
      await db.record.createMany({
        // Cast to any to satisfy strict JSON typing while still
        // storing structured row data in Postgres JSONB.
        data: chunk as any,
      });
    }

    return NextResponse.json(
      {
        datasetId: dataset.id,
        dataset,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Upload dataset error", error);
    return NextResponse.json(
      { error: "Failed to process file" },
      { status: 500 }
    );
  }
}

