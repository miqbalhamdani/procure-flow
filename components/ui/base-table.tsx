"use client";

import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useRouter, usePathname } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn-ui/table";
import type { PaginationMeta } from "@/lib/pagination";
import { TablePagination } from "@/components/ui/table-pagination";

type BaseTableProps<TData> = {
  title: string;
  columns: ColumnDef<TData>[];
  data: TData[];
  emptyMessage?: string;
  emptyDescription?: string;
  pagination: PaginationMeta | null;
};

export function BaseTable<TData>({
  title,
  columns,
  data,
  emptyMessage = "No data available.",
  emptyDescription,
  pagination,
}: BaseTableProps<TData>) {
  const router = useRouter();
  const pathname = usePathname();

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: pagination?.last_page ?? 0,
  });

  const pageIndex = (pagination?.current_page ?? 1) - 1;
  const pageCount = pagination?.last_page ?? 0;
  const canPreviousPage = (pagination?.current_page ?? 1) > 1;
  const canNextPage = (pagination?.current_page ?? 1) < (pagination?.last_page ?? 0);

  const handlePreviousPage = () => router.push(`${pathname}?page=${(pagination?.current_page ?? 1) - 1}`);
  const handleNextPage = () => router.push(`${pathname}?page=${(pagination?.current_page ?? 1) + 1}`);
  const handlePageClick = (page: number) => router.push(`${pathname}?page=${page + 1}`);

  return (
    <div className="overflow-hidden rounded-3xl border border-outline-variant/5 bg-surface-container-lowest shadow-sm">
      {/* Card header */}
      <div className="flex items-center justify-between border-b border-outline-variant/5 px-8 py-6">
        <h3 className="font-headline text-lg font-bold text-on-background">{title}</h3>
      </div>

      {/* Table */}
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow
              key={headerGroup.id}
              className="bg-surface-container-low/50 hover:bg-surface-container-low/50 border-0"
            >
              {headerGroup.headers.map((header, i) => (
                <TableHead
                  key={header.id}
                  className={`py-4 text-[11px] font-bold uppercase tracking-widest text-on-surface-variant h-auto ${
                    i === 0 ? "px-8" : i === 1 ? "px-6" : "px-8 text-right"
                  }`}
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length === 0 ? (
            <TableRow className="hover:bg-transparent border-0">
              <TableCell
                colSpan={columns.length}
                className="px-8 py-12 text-sm text-on-surface-variant"
              >
                <div className="flex flex-col items-center justify-center gap-2 text-center">
                  <span className="material-symbols-outlined text-4xl text-outline-variant">
                    domain_disabled
                  </span>
                  <p className="font-medium">{emptyMessage}</p>
                  {emptyDescription && (
                    <p className="text-xs text-outline">{emptyDescription}</p>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ) : (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                className="border-outline-variant/5 hover:bg-surface/50 transition-colors"
              >
                {row.getVisibleCells().map((cell, i) => (
                  <TableCell
                    key={cell.id}
                    className={`py-5 ${
                      i === 0 ? "px-8" : i === 1 ? "px-6" : "px-8 text-right"
                    }`}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Pagination footer */}
      {pagination.total > 0 && (
        <TablePagination
          from={pagination.from}
          to={pagination.to}
          total={pagination.total}
          pageIndex={pageIndex}
          pageCount={pageCount}
          canPreviousPage={canPreviousPage}
          canNextPage={canNextPage}
          onPreviousPage={handlePreviousPage}
          onNextPage={handleNextPage}
          onPageClick={handlePageClick}
        />
      )}
    </div>
  );
}

