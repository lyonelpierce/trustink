"use client";

import {
  FileIcon,
  InboxIcon,
  FileStackIcon,
  ClockFadingIcon,
  CircleCheckBigIcon,
} from "lucide-react";
import {
  Table,
  TableRow,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
} from "@/components/ui/table";
import {
  Select,
  SelectItem,
  SelectValue,
  SelectTrigger,
  SelectContent,
} from "@/components/ui/select";
import {
  ColumnDef,
  flexRender,
  SortingState,
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  ColumnFiltersState,
  getFilteredRowModel,
  getPaginationRowModel,
} from "@tanstack/react-table";
import { cn } from "@/lib/utils";
import { useSession } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { api } from "../../../../../convex/_generated/api";
import { Preloaded, usePreloadedQuery } from "convex/react";
import { Doc } from "../../../../../convex/_generated/dataModel";

export function DocumentsTable<
  TData extends Doc<"documents"> & {
    recipients: Doc<"recipients">[];
  },
  TValue,
>(props: {
  columns: ColumnDef<TData, TValue>[];
  data: Preloaded<typeof api.documents.getDocumentsWithRecipients>;
}) {
  const { columns, data } = props;

  const preloadedData = usePreloadedQuery(data);

  const { session } = useSession();

  const [sorting, setSorting] = useState<SortingState>([
    {
      id: "created_at",
      desc: true,
    },
  ]);
  const [filteredDocs, setFilteredDocs] = useState<TData[]>(
    preloadedData as TData[]
  );
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [filter, setFilter] = useState<
    "all" | "inbox" | "pending" | "drafts" | "completed"
  >("all");

  useEffect(() => {
    let result = [...preloadedData];

    switch (filter) {
      case "inbox":
        result = preloadedData.filter((doc) =>
          doc.recipients.some(
            (recipient) => recipient.signer_id === session?.user.id
          )
        );
        break;
      case "pending":
        result = preloadedData.filter(
          (doc) => doc.user_id === session?.user.id && doc.status === "pending"
        );
        break;
      case "drafts":
        result = preloadedData.filter(
          (doc) => doc.user_id === session?.user.id && doc.status === "draft"
        );
        break;
      case "completed":
        result = preloadedData.filter(
          (doc) =>
            doc.user_id === session?.user.id && doc.status === "completed"
        );
        break;
      default:
        result = preloadedData;
    }

    setFilteredDocs(result as TData[]);
  }, [filter, preloadedData, session?.user.id]);

  const table = useReactTable({
    data: filteredDocs,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnFiltersChange: setColumnFilters,
    onSortingChange: setSorting,
    state: {
      columnFilters,
      sorting,
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between text-xl font-semibold pb-4">
        <div className="relative flex items-center bg-[#f4f4f5] dark:bg-[#27272a] rounded-full p-1">
          <Button
            onClick={() => setFilter("all")}
            variant="ghost"
            className={cn(
              "text-black transition-all ease-in-out w-28 gap-1 hover:bg-white dark:hover:bg-black",
              filter === "all"
                ? "bg-white dark:bg-black text-black dark:text-white"
                : "bg-transparent text-muted-foreground"
            )}
          >
            <FileStackIcon className="w-4 h-4" />
            All
          </Button>
          <Button
            onClick={() => setFilter("inbox")}
            variant="ghost"
            className={cn(
              "text-black transition-all ease-in-out w-28 gap-1 hover:bg-white dark:hover:bg-black",
              filter === "inbox"
                ? "bg-white dark:bg-black text-black dark:text-white"
                : "bg-transparent text-muted-foreground"
            )}
          >
            <InboxIcon className="w-4 h-4" />
            Inbox
          </Button>
          <Button
            onClick={() => setFilter("pending")}
            variant="ghost"
            className={cn(
              "text-black transition-all ease-in-out w-28 gap-1 hover:bg-white dark:hover:bg-black",
              filter === "pending"
                ? "bg-white dark:bg-black text-black dark:text-white"
                : "bg-transparent text-muted-foreground"
            )}
          >
            <ClockFadingIcon className="w-4 h-4" />
            Pending
          </Button>
          <Button
            onClick={() => setFilter("completed")}
            variant="ghost"
            className={cn(
              "text-black transition-all ease-in-out w-28 gap-1 hover:bg-white dark:hover:bg-black",
              filter === "completed"
                ? "bg-white dark:bg-black text-black dark:text-white"
                : "bg-transparent text-muted-foreground"
            )}
          >
            <CircleCheckBigIcon className="w-4 h-4" />
            Completed
          </Button>
          <Button
            onClick={() => setFilter("drafts")}
            variant="ghost"
            className={cn(
              "text-black transition-all ease-in-out w-28 gap-1 hover:bg-white dark:hover:bg-black",
              filter === "drafts"
                ? "bg-white dark:bg-black text-black dark:text-white"
                : "bg-transparent text-muted-foreground"
            )}
          >
            <FileIcon className="w-4 h-4" />
            Drafts
          </Button>
        </div>
        <Input
          placeholder="Filter documents..."
          value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("name")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  There are no documents yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex items-center space-x-2">
          <p className="text-sm font-medium">Rows per page</p>
          <Select
            value={`${table.getState().pagination.pageSize}`}
            onValueChange={(value) => {
              table.setPageSize(Number(value));
            }}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue placeholder={table.getState().pagination.pageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              {[10, 20, 30, 40, 50].map((pageSize) => (
                <SelectItem key={pageSize} value={`${pageSize}`}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex w-[100px] items-center justify-center text-sm font-medium">
          Page {table.getState().pagination.pageIndex + 1} of{" "}
          {table.getPageCount()}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
