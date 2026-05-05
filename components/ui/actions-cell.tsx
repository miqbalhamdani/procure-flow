"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import type { WorkspaceSummary } from "@/features/companies/types";
import { deleteCompany } from "@/features/companies/services/company-action";
import { CompanyModal } from "@/features/companies/components/company-modal";
import { DeleteConfirmModal } from "@/components/ui/delete-confirm-modal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/shadcn-ui/dropdown-menu";

export function ActionsCell({ workspace }: { workspace: WorkspaceSummary }) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    const result = await deleteCompany(workspace.id);
    setIsDeleting(false);
    if (result.error) {
      toast.error(result.error);
    } else {
      setDeleteOpen(false);
      toast.success("Company deleted.");
      router.refresh();
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="rounded-lg p-2 text-on-surface-variant transition-all hover:bg-surface-container"
            aria-label="More actions"
          >
            <span className="material-symbols-outlined text-[20px] leading-none">more_vert</span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
              setEditOpen(true);
            }}
          >
            <span className="material-symbols-outlined text-[16px] leading-none">edit</span>
            Edit
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onSelect={(e) => {
              e.preventDefault();
              setDeleteOpen(true);
            }}
          >
            <span className="material-symbols-outlined text-[16px] leading-none">delete</span>
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <CompanyModal workspace={workspace} open={editOpen} onOpenChange={setEditOpen} />

      <DeleteConfirmModal
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Company"
        description={
          <>
            Are you sure you want to delete{" "}
            <span className="font-semibold text-on-background">{workspace.name}</span>?{" "}
            This action cannot be undone.
          </>
        }
        onConfirm={handleDelete}
        isDeleting={isDeleting}
      />
    </>
  );
}
