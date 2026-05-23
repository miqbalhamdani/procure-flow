"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import {
  approvePurchaseOrder,
  rejectPurchaseOrder,
} from "@/features/purchase-orders/services/po-action";
import type { PurchaseOrderDetail } from "@/features/purchase-orders/types";

interface PoApprovalActionsProps {
  po: PurchaseOrderDetail;
  canApprove: boolean;
}

export function PoApprovalActions({ po, canApprove }: PoApprovalActionsProps) {
  const router = useRouter();
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [approvalNote, setApprovalNote] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!canApprove || po.status !== "submitted") return null;

  const handleApprove = async () => {
    setIsLoading(true);
    setError(null);
    const result = await approvePurchaseOrder({ id: po.id, approvalNote });
    setIsLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setApproveOpen(false);
    toast.success("Purchase order approved.");
    router.refresh();
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      setError("Rejection reason is required.");
      return;
    }
    setIsLoading(true);
    setError(null);
    const result = await rejectPurchaseOrder({ id: po.id, rejectionReason });
    setIsLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setRejectOpen(false);
    toast.success("Purchase order rejected.");
    router.refresh();
  };

  const textareaClass =
    "w-full rounded-xl bg-surface-container-low px-4 py-3 text-sm text-on-background placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none";

  return (
    <>
      <div className="flex items-center gap-3">
        {/* Reject */}
        <Dialog.Root
          open={rejectOpen}
          onOpenChange={(open) => {
            setRejectOpen(open);
            if (!open) {
              setRejectionReason("");
              setError(null);
            }
          }}
        >
          <Dialog.Trigger asChild>
            <button
              type="button"
              className="flex items-center gap-2 rounded-xl border border-error/30 bg-error-container/20 px-4 py-2.5 text-sm font-bold text-error transition-all hover:bg-error-container/40 active:scale-95"
            >
              <span className="material-symbols-outlined text-[16px] leading-none">
                thumb_down
              </span>
              Reject
            </button>
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-[100] bg-[#131b2e]/40 backdrop-blur-sm" />
            <Dialog.Content className="fixed inset-0 z-[101] flex items-center justify-center p-6">
              <div className="w-full max-w-md overflow-hidden rounded-2xl border border-outline-variant/20 bg-surface-container-lowest shadow-2xl">
                <div className="px-8 pb-4 pt-8">
                  <Dialog.Title className="text-xl font-extrabold tracking-tight text-on-background">
                    Reject Purchase Order
                  </Dialog.Title>
                  <Dialog.Description className="mt-1 text-sm text-on-surface-variant">
                    Please provide a reason for rejecting{" "}
                    <span className="font-semibold">{po.po_number}</span>.
                  </Dialog.Description>
                </div>
                <div className="px-8 pt-4 pb-8">
                  {error && (
                    <div className="mb-4 rounded-xl border border-error-container bg-error-container/40 px-4 py-3 text-sm font-medium text-on-error-container">
                      {error}
                    </div>
                  )}
                  <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1.5">
                    Rejection Reason <span className="text-error">*</span>
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows={4}
                    className={textareaClass}
                    placeholder="Explain why this PO is being rejected…"
                  />
                  <div className="mt-6 flex items-center justify-end gap-3">
                    <Dialog.Close asChild>
                      <button
                        type="button"
                        className="rounded-xl px-5 py-2.5 text-sm font-semibold text-secondary hover:bg-surface-container-low transition-colors"
                      >
                        Cancel
                      </button>
                    </Dialog.Close>
                    <button
                      type="button"
                      onClick={handleReject}
                      disabled={isLoading}
                      className="flex items-center gap-2 rounded-xl bg-error px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-error/20 transition-all hover:scale-[1.02] active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isLoading ? "Rejecting…" : "Confirm Reject"}
                    </button>
                  </div>
                </div>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>

        {/* Approve */}
        <Dialog.Root
          open={approveOpen}
          onOpenChange={(open) => {
            setApproveOpen(open);
            if (!open) {
              setApprovalNote("");
              setError(null);
            }
          }}
        >
          <Dialog.Trigger asChild>
            <button
              type="button"
              className="flex items-center gap-2 rounded-xl bg-gradient-to-br from-primary to-primary-container px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95"
            >
              <span className="material-symbols-outlined text-[16px] leading-none">
                thumb_up
              </span>
              Approve
            </button>
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-[100] bg-[#131b2e]/40 backdrop-blur-sm" />
            <Dialog.Content className="fixed inset-0 z-[101] flex items-center justify-center p-6">
              <div className="w-full max-w-md overflow-hidden rounded-2xl border border-outline-variant/20 bg-surface-container-lowest shadow-2xl">
                <div className="px-8 pb-4 pt-8">
                  <Dialog.Title className="text-xl font-extrabold tracking-tight text-on-background">
                    Approve Purchase Order
                  </Dialog.Title>
                  <Dialog.Description className="mt-1 text-sm text-on-surface-variant">
                    Approving <span className="font-semibold">{po.po_number}</span> will move it to
                    In Progress.
                  </Dialog.Description>
                </div>
                <div className="px-8 pt-4 pb-8">
                  {error && (
                    <div className="mb-4 rounded-xl border border-error-container bg-error-container/40 px-4 py-3 text-sm font-medium text-on-error-container">
                      {error}
                    </div>
                  )}
                  <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1.5">
                    Approval Note{" "}
                    <span className="font-normal normal-case text-on-surface-variant/50">
                      (optional)
                    </span>
                  </label>
                  <textarea
                    value={approvalNote}
                    onChange={(e) => setApprovalNote(e.target.value)}
                    rows={3}
                    className={textareaClass}
                    placeholder="Add an optional note…"
                  />
                  <div className="mt-6 flex items-center justify-end gap-3">
                    <Dialog.Close asChild>
                      <button
                        type="button"
                        className="rounded-xl px-5 py-2.5 text-sm font-semibold text-secondary hover:bg-surface-container-low transition-colors"
                      >
                        Cancel
                      </button>
                    </Dialog.Close>
                    <button
                      type="button"
                      onClick={handleApprove}
                      disabled={isLoading}
                      className="flex items-center gap-2 rounded-xl bg-gradient-to-br from-primary to-primary-container px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <span className="material-symbols-outlined text-[16px] leading-none">
                        check
                      </span>
                      {isLoading ? "Approving…" : "Confirm Approve"}
                    </button>
                  </div>
                </div>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>
    </>
  );
}
