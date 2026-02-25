"use client";

import { useEffect, useMemo, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Row = {
  id: string;
  index: number;
  data: Record<string, unknown>;
};

type DatasetTableProps = {
  datasetId: string;
  initialRows: Row[];
  totalCount: number;
};

const PAGE_SIZE = 50;

export function DatasetTable({ datasetId, initialRows, totalCount }: DatasetTableProps) {
  const [rows, setRows] = useState<Row[]>(initialRows);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const columns = useMemo(() => {
    const keys = new Set<string>();
    for (const row of rows) {
      Object.keys(row.data || {}).forEach((key) => {
        if (!key.startsWith("__")) {
          keys.add(key);
        }
      });
    }
    return Array.from(keys).sort();
  }, [rows]);

  async function loadPage(nextPage: number) {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/datasets/${datasetId}/rows?page=${nextPage}&pageSize=${PAGE_SIZE}`,
        { method: "GET" }
      );
      if (!res.ok) return;
      const data = (await res.json()) as {
        rows: Row[];
      };
      setRows(data.rows);
      setPage(nextPage);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setRows(initialRows);
    setPage(1);
  }, [datasetId, initialRows]);

  const filteredRows = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter((row) =>
      columns.some((col) => {
        const value = row.data?.[col];
        if (value == null) return false;
        return String(value).toLowerCase().includes(q);
      })
    );
  }, [rows, search, columns]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Input
          placeholder="Search in visible columns…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>
            Page {page} of {totalPages}
          </span>
          <Button
            size="sm"
            variant="outline"
            disabled={loading || page <= 1}
            onClick={() => loadPage(page - 1)}
          >
            Previous
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={loading || page >= totalPages}
            onClick={() => loadPage(page + 1)}
          >
            Next
          </Button>
        </div>
      </div>
      <div className="rounded-2xl border bg-card/70">
        <div className="max-h-[460px] overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16 text-xs text-muted-foreground">
                  #
                </TableHead>
                {columns.map((col) => (
                  <TableHead key={col} className="text-xs">
                    {col}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={1 + columns.length}
                    className="py-10 text-center text-xs text-muted-foreground"
                  >
                    No rows match your search on this page.
                  </TableCell>
                </TableRow>
              ) : (
                filteredRows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="text-xs text-muted-foreground">
                      {row.index + 1}
                    </TableCell>
                    {columns.map((col) => (
                      <TableCell key={col} className="text-xs">
                        {String(row.data?.[col] ?? "")}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

