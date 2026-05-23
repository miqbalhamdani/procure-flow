"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { DeleteConfirmModal } from "@/components/ui/delete-confirm-modal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/shadcn-ui/dropdown-menu";

type DialogControlProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type ActionPresentation = {
  label?: string;
  icon?: string;
};

type EditLinkAction = ActionPresentation & {
  type: "link";
  href: string;
};

type EditModalAction = ActionPresentation & {
  type: "modal";
  render: (props: DialogControlProps) => ReactNode;
};

type EditAction = EditLinkAction | EditModalAction;

type DeleteResult = { error?: string } | void;

type DeleteAction = {
  resourceName: string;
  itemName: string;
  warning?: string;
  successMessage?: string;
  onConfirm: () => Promise<DeleteResult>;
};

interface ActionsCellProps {
  editAction?: EditAction;
  deleteAction?: DeleteAction;
}

export function ActionsCell({ editAction, deleteAction }: ActionsCellProps) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!editAction && !deleteAction) {
    return null;
  }

  const handleDelete = async () => {
    if (!deleteAction) return;

    setIsDeleting(true);
    const result = await deleteAction.onConfirm();
    setIsDeleting(false);

    if (result?.error) {
      toast.error(result.error);
      return;
    }

    setDeleteOpen(false);
    toast.success(deleteAction.successMessage ?? `${deleteAction.resourceName} deleted.`);
    router.refresh();
  };

  const editLabel = editAction?.label ?? "Edit";
  const editIcon = editAction?.icon ?? "edit";

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
          {editAction ? (
            editAction.type === "link" ? (
              <DropdownMenuItem asChild>
                <Link href={editAction.href} className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] leading-none">
                    {editIcon}
                  </span>
                  {editLabel}
                </Link>
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault();
                  setEditOpen(true);
                }}
              >
                <span className="material-symbols-outlined text-[16px] leading-none">
                  {editIcon}
                </span>
                {editLabel}
              </DropdownMenuItem>
            )
          ) : null}
          {editAction && deleteAction ? <DropdownMenuSeparator /> : null}
          {deleteAction ? (
            <DropdownMenuItem
              variant="destructive"
              onSelect={(e) => {
                e.preventDefault();
                setDeleteOpen(true);
              }}
            >
              <span className="material-symbols-outlined text-[16px] leading-none">
               delete
              </span>
              Delete
            </DropdownMenuItem>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>

      {editAction?.type === "modal" && editOpen
        ? editAction.render({ open: editOpen, onOpenChange: setEditOpen })
        : null}

      {deleteAction ? (
        <DeleteConfirmModal
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          title={`Delete ${deleteAction.resourceName}`}
          description={
            <>
              Are you sure you want to delete{" "}
              <span className="font-semibold text-on-background">{deleteAction.itemName}</span>?{" "}
              {deleteAction.warning ?? "This action cannot be undone."}
            </>
          }
          onConfirm={handleDelete}
          isDeleting={isDeleting}
        />
      ) : null}
    </>
  );
}
