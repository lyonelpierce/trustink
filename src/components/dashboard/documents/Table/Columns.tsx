"use client";

import Link from "next/link";
import { PencilIcon } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import { Database } from "../../../../../database.types";
import { buttonVariants } from "@/components/ui/button";
import DeleteDocumentAlert from "../DeleteDocumentAlert";
// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.

export const columns: ColumnDef<
  Database["public"]["Tables"]["documents"]["Row"]
>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => {
      return (
        <div className="w-2/6">
          <Link href={`/documents/${row.original.id}`}>
            {row.original.name}
          </Link>
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
    header: "Created At",
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
    accessorKey: "updated_at",
    header: "Updated At",
    cell: ({ row }) => {
      const date = new Date(row.original.updated_at);
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
            href={`/documents/${row.original.id}`}
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
