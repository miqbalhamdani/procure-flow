"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import {
  updateInTransitTracking,
  markDelivered,
} from "@/features/shipments/services/shipment-action";
import type { ShipmentDetail } from "@/features/shipments/types";

interface ShipmentActionButtonsProps {
  shipment: ShipmentDetail;
  canTransit: boolean;
  canDeliver: boolean;
}

export function ShipmentActionButtons({
  shipment,
  canTransit,
  canDeliver,
}: ShipmentActionButtonsProps) {
  const router = useRouter();
  const [submitOpen, setSubmitOpen] = useState(false);
  const [deliverOpen, setDeliverOpen] = useState(false);
  const [location, setLocation] = useState("");
  const [note, setNote] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpdateInTransit = async () => {
    setIsLoading(true);
    setError(null);
    const result = await updateInTransitTracking({ id: shipment.id, location, note });
    setIsLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setLocation("");
    setNote("");
    setError(null);
    setSubmitOpen(false);
    toast.success("Tracking timeline updated.");
    router.refresh();
  };

  const handleMarkDelivered = async () => {
    setIsLoading(true);
    setError(null);
    const result = await markDelivered({ id: shipment.id, note });
    setIsLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setDeliverOpen(false);
    toast.success("Shipment marked as delivered.");
    router.refresh();
  };

  const textareaClass =
    "w-full rounded-xl bg-surface-container-low px-4 py-3 text-sm text-on-background placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none";
  const inputClass =
    "w-full rounded-xl bg-surface-container-low px-4 py-3 text-sm text-on-background placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30";
  const labelClass =
    "block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1.5";
  const footerNote =
    "mt-4 rounded-xl bg-surface-container-low/60 px-4 py-2.5 text-xs text-on-surface-variant";

  return (
    <div className="space-y-3">
      {/* Mark In Transit */}
      {shipment.status === "in_transit" && canTransit && (
        <Dialog.Root
          open={submitOpen}
          onOpenChange={(open) => {
            setSubmitOpen(open);
            if (!open) {
              setLocation("");
              setNote("");
              setError(null);
            }
          }}
        >
          <Dialog.Trigger asChild>
            <button
              type="button"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-primary to-primary-container px-4 py-3 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95"
            >
              <span className="material-symbols-outlined text-[18px] leading-none">
                local_shipping
              </span>
              Mark In Transit
            </button>
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-[100] bg-[#131b2e]/40 backdrop-blur-sm" />
            <Dialog.Content className="fixed inset-0 z-[101] flex items-center justify-center p-6">
              <div className="w-full max-w-md overflow-hidden rounded-2xl border border-outline-variant/20 bg-surface-container-lowest shadow-2xl">
                <div className="px-8 pb-4 pt-8">
                  <Dialog.Title className="text-xl font-extrabold tracking-tight text-on-background">
                    Mark In Transit
                  </Dialog.Title>
                  <Dialog.Description className="mt-1 text-sm text-on-surface-variant">
                    Add a tracking update for this in-transit shipment.
                  </Dialog.Description>
                </div>
                <div className="px-8 pb-8 space-y-4">
                  {error && (
                    <div className="rounded-xl border border-error-container bg-error-container/40 px-4 py-3 text-sm font-medium text-on-error-container">
                      {error}
                    </div>
                  )}
                  <div>
                    <label className={labelClass}>
                      Location{" "}
                      <span className="font-normal normal-case text-on-surface-variant/50">
                        (optional)
                      </span>
                    </label>
                    <input
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className={inputClass}
                      placeholder="e.g. Jakarta Warehouse"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>
                      Note{" "}
                      <span className="font-normal normal-case text-on-surface-variant/50">
                        (optional)
                      </span>
                    </label>
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      rows={3}
                      className={textareaClass}
                      placeholder="Any additional notes…"
                    />
                  </div>
                  <p className={footerNote}>
                    This action will update the shipment tracking timeline.
                  </p>
                  <div className="flex items-center justify-end gap-3">
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
                      onClick={handleUpdateInTransit}
                      disabled={isLoading}
                      className="flex items-center gap-2 rounded-xl bg-gradient-to-br from-primary to-primary-container px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isLoading ? "Processing…" : "Confirm"}
                    </button>
                  </div>
                </div>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      )}

      {/* Mark Delivered */}
      {shipment.status === "in_transit" && canDeliver && (
        <Dialog.Root
          open={deliverOpen}
          onOpenChange={(open) => {
            setDeliverOpen(open);
            if (!open) {
              setNote("");
              setError(null);
            }
          }}
        >
          <Dialog.Trigger asChild>
            <button
              type="button"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-on-surface px-4 py-3 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95"
            >
              <span className="material-symbols-outlined text-[18px] leading-none">
                inventory
              </span>
              Mark as Delivered
            </button>
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-[100] bg-[#131b2e]/40 backdrop-blur-sm" />
            <Dialog.Content className="fixed inset-0 z-[101] flex items-center justify-center p-6">
              <div className="w-full max-w-md overflow-hidden rounded-2xl border border-outline-variant/20 bg-surface-container-lowest shadow-2xl">
                <div className="px-8 pb-4 pt-8">
                  <Dialog.Title className="text-xl font-extrabold tracking-tight text-on-background">
                    Mark as Delivered
                  </Dialog.Title>
                  <Dialog.Description className="mt-1 text-sm text-on-surface-variant">
                    Confirm that this shipment has been successfully delivered.
                  </Dialog.Description>
                </div>
                <div className="px-8 pb-8 space-y-4">
                  {error && (
                    <div className="rounded-xl border border-error-container bg-error-container/40 px-4 py-3 text-sm font-medium text-on-error-container">
                      {error}
                    </div>
                  )}
                  <div>
                    <label className={labelClass}>
                      Delivery Note{" "}
                      <span className="font-normal normal-case text-on-surface-variant/50">
                        (optional)
                      </span>
                    </label>
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      rows={3}
                      className={textareaClass}
                      placeholder="Any delivery notes…"
                    />
                  </div>
                  <p className={footerNote}>
                    This action will update the shipment tracking timeline. If all items in the
                    purchase order are fully received, the PO will be automatically closed.
                  </p>
                  <div className="flex items-center justify-end gap-3">
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
                      onClick={handleMarkDelivered}
                      disabled={isLoading}
                      className="flex items-center gap-2 rounded-xl bg-gradient-to-br from-primary to-primary-container px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isLoading ? "Processing…" : "Confirm Delivery"}
                    </button>
                  </div>
                </div>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      )}
    </div>
  );
}
