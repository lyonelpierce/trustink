"use client";

import Link from "next/link";
import { EyeIcon } from "lucide-react";
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
        <Link href={`/dashboard/documents/${row.original.id}`}>
          {row.original.name}
        </Link>
      );
    },
  },
  {
    accessorKey: "created_at",
    header: "Created At",
    cell: ({ row }) => {
      const date = new Date(row.original.created_at);
      return (
        <div>
          {date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </div>
      );
    },
  },
  {
    accessorKey: "actions",
    header: () => (
      <div className="flex items-center justify-end gap-2">Actions</div>
    ),
    cell: ({ row }) => {
      return (
        <div className="flex items-center justify-end gap-2">
          <Link
            href={`/dashboard/documents/${row.original.id}`}
            className={buttonVariants({ variant: "ghost", size: "icon" })}
          >
            <EyeIcon className="w-4 h-4" />
          </Link>
          <DeleteDocumentAlert document={row.original} />
        </div>
      );
    },
  },
];
