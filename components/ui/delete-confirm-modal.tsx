"use client";

import * as Dialog from "@radix-ui/react-dialog";

interface DeleteConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description: React.ReactNode;
  onConfirm: () => void;
  isDeleting?: boolean;
}

export function DeleteConfirmModal({
  open,
  onOpenChange,
  title = "Confirm Delete",
  description,
  onConfirm,
  isDeleting = false,
}: DeleteConfirmModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[100] bg-[#131b2e]/40 backdrop-blur-sm" />
        <Dialog.Content className="fixed inset-0 z-[101] flex items-center justify-center p-6 sm:p-12">
          <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-outline-variant/20 bg-surface-container-lowest shadow-2xl">
            <div className="flex flex-col items-center px-8 pb-2 pt-10">
              <div className="flex size-14 items-center justify-center rounded-full bg-error-container/40">
                <span className="material-symbols-outlined text-[28px] leading-none text-error">
                  delete_forever
                </span>
              </div>
              <Dialog.Title className="mt-4 text-xl font-extrabold tracking-tight text-on-background">
                {title}
              </Dialog.Title>
              <Dialog.Description asChild>
                <p className="mt-2 text-center text-sm text-on-surface-variant">
                  {description}
                </p>
              </Dialog.Description>
            </div>

            <div className="flex items-center justify-center gap-3 px-8 py-8">
              <Dialog.Close asChild>
                <button
                  type="button"
                  disabled={isDeleting}
                  className="rounded-xl px-6 py-3 text-sm font-semibold text-secondary transition-all hover:bg-surface-container-low disabled:opacity-50"
                >
                  Cancel
                </button>
              </Dialog.Close>
              <button
                type="button"
                onClick={onConfirm}
                disabled={isDeleting}
                className="flex items-center gap-2 rounded-xl bg-error px-6 py-3 text-sm font-bold text-white shadow-lg shadow-error/20 transition-all hover:scale-[1.02] active:scale-95 disabled:cursor-not-allowed disabled:scale-100 disabled:opacity-60"
              >
                <span className="material-symbols-outlined text-[16px] leading-none">delete</span>
                {isDeleting ? "Deleting…" : "Yes, Delete"}
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
