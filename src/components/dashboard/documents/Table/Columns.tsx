"use client";

import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";
import { Database } from "../../../../../database.types";
import DeleteDocumentAlert from "../DeleteDocumentAlert";
import { PencilIcon, ChevronDownIcon } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.

export const columns: ColumnDef<
  Database["public"]["Tables"]["documents"]["Row"]
>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Name
        <ChevronDownIcon className="w-4 h-4" />
      </Button>
    ),
    cell: ({ row }) => {
      return (
        <div className="w-2/6">
          <Link href={`/editor/${row.original.id}`}>{row.original.name}</Link>
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      return (
        <div className="capitalize w-1/6 text-center">
          {row.original.status}
        </div>
      );
    },
  },
  {
    accessorKey: "created_at",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Created
        <ChevronDownIcon className="w-4 h-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const date = new Date(row.original.created_at);
      return (
        <div className="w-1/6 text-center">
          {date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "numeric",
          })}
        </div>
      );
    },
  },
  {
    accessorKey: "actions",
    header: "Actions",
    cell: ({ row }) => {
      return (
        <div className="flex items-center justify-center gap-2 w-1/6">
          <Link
            href={`/editor/${row.original.id}`}
            className={buttonVariants({ variant: "ghost", size: "icon" })}
          >
            <PencilIcon className="w-4 h-4" />
          </Link>
          <DeleteDocumentAlert document={row.original} />
        </div>
      );
    },
  },
];
