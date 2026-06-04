"use client";

import { useEffect } from "react";

type DashboardErrorProps = {
  error: Error & { digest?: string };
  unstable_retry: () => void;
};

export default function DashboardError({ error, unstable_retry }: DashboardErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="p-8">
      <div className="rounded-2xl bg-surface-container-lowest p-8">
        <h2 className="font-headline text-2xl font-bold text-on-surface">Unable to load dashboard</h2>
        <p className="mt-2 text-sm text-on-surface-variant">
          An unexpected error occurred while retrieving your dashboard metrics.
        </p>

        <div className="mt-6">
          <button
            type="button"
            onClick={() => unstable_retry()}
            className="rounded-lg bg-gradient-to-br from-primary to-primary-container px-4 py-2 text-sm font-bold text-white"
          >
            Try Again
          </button>
        </div>
      </div>
    </section>
  );
}
