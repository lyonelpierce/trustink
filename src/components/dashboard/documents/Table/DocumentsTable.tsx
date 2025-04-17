"use client";

import {
  Table,
  TableRow,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
} from "@/components/ui/table";
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createClient } from "@supabase/supabase-js";
import { Database } from "../../../../../database.types";
import { useEffect, useState } from "react";
import {
  FileStackIcon,
  InboxIcon,
  FileIcon,
  CircleCheckBigIcon,
  ClockFadingIcon,
} from "lucide-react";
interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
}

export function DocumentsTable<
  TData extends Database["public"]["Tables"]["documents"]["Row"] & {
    recipients: {
      id: string;
      signer_id: string;
      user_id: string;
    }[];
  },
  TValue
>({ columns, data }: DataTableProps<TData, TValue>) {
  const { session } = useSession();

  const [sorting, setSorting] = useState<SortingState>([]);
  const [documents, setDocuments] = useState<TData[]>(data);
  const [filteredDocs, setFilteredDocs] = useState<TData[]>(data);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [filter, setFilter] = useState<
    "all" | "inbox" | "pending" | "drafts" | "completed"
  >("all");

  useEffect(() => {
    let result = [...documents];

    switch (filter) {
      case "inbox":
        result = documents.filter((doc) =>
          doc.recipients.some(
            (recipient) => recipient.signer_id === session?.user.id
          )
        );
        break;
      case "pending":
        result = documents.filter(
          (doc) => doc.user_id === session?.user.id && doc.status === "pending"
        );
        break;
      case "drafts":
        result = documents.filter(
          (doc) => doc.user_id === session?.user.id && doc.status === "draft"
        );
        break;
      case "completed":
        result = documents.filter(
          (doc) =>
            doc.user_id === session?.user.id && doc.status === "completed"
        );
        break;
      default:
        result = documents;
    }

    setFilteredDocs(result);
  }, [filter, documents, session?.user.id]);

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

  const createClerkSupabaseClient = () => {
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        async accessToken() {
          return session?.getToken() ?? null;
        },
      }
    );
  };

  const supabase = createClerkSupabaseClient();

  useEffect(() => {
    const channel = supabase
      .channel("documents-table")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "documents",
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setDocuments((prev) => [...prev, payload.new as TData]);
          } else if (payload.eventType === "DELETE") {
            setDocuments((prev) =>
              prev.filter(
                (doc: Database["public"]["Tables"]["documents"]["Row"]) =>
                  doc.id !== payload.old.id
              )
            );
          } else if (payload.eventType === "UPDATE") {
            setDocuments((prev) =>
              prev.map((doc) =>
                doc.id === payload.new.id ? (payload.new as TData) : doc
              )
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

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
