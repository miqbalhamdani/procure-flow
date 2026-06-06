"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type MutableRefObject,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";

import { cn } from "@/lib/utils";

type NavigationProgressPhase = "idle" | "loading" | "finishing";

type NavigationProgressContextValue = {
  phase: NavigationProgressPhase;
  start: () => void;
};

type NavigationProgressProviderProps = {
  children: ReactNode;
};

type NavigationProgressBarProps = {
  className?: string;
  placement?: "dashboard" | "global";
};

const DASHBOARD_ROUTE_ROOTS = [
  "/companies",
  "/dashboard",
  "/purchase-orders",
  "/suppliers",
  "/users",
];

const NavigationProgressContext = createContext<NavigationProgressContextValue | null>(null);

function isDashboardRoute(pathname: string | null) {
  if (!pathname) return false;

  return DASHBOARD_ROUTE_ROOTS.some(
    (root) => pathname === root || pathname.startsWith(`${root}/`),
  );
}

function shouldStartProgressForHref(href: string) {
  if (typeof window === "undefined") return false;

  let url: URL;

  try {
    url = new URL(href, window.location.href);
  } catch {
    return false;
  }

  if (url.origin !== window.location.origin) return false;

  return url.pathname !== window.location.pathname;
}

export function NavigationProgressProvider({ children }: NavigationProgressProviderProps) {
  const pathname = usePathname();
  const [phase, setPhase] = useState<NavigationProgressPhase>("idle");
  const fallbackTimerRef = useRef<number | null>(null);
  const hideTimerRef = useRef<number | null>(null);
  const previousPathnameRef = useRef(pathname);
  const startedRef = useRef(false);
  const phaseRef = useRef<NavigationProgressPhase>("idle");
  const showTimerRef = useRef<number | null>(null);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  const clearTimer = useCallback((timerRef: MutableRefObject<number | null>) => {
    if (timerRef.current == null) return;

    window.clearTimeout(timerRef.current);
    timerRef.current = null;
  }, []);

  const finishProgress = useCallback(() => {
    clearTimer(showTimerRef);
    clearTimer(fallbackTimerRef);
    clearTimer(hideTimerRef);

    const wasVisible = phaseRef.current !== "idle";
    startedRef.current = false;

    if (!wasVisible) {
      setPhase("idle");
      return;
    }

    setPhase("finishing");
    hideTimerRef.current = window.setTimeout(() => {
      setPhase("idle");
      phaseRef.current = "idle";
      hideTimerRef.current = null;
    }, 220);
  }, [clearTimer]);

  const startProgress = useCallback(() => {
    clearTimer(showTimerRef);
    clearTimer(hideTimerRef);
    clearTimer(fallbackTimerRef);

    startedRef.current = true;

    showTimerRef.current = window.setTimeout(() => {
      if (!startedRef.current) return;

      setPhase("loading");
      phaseRef.current = "loading";
      showTimerRef.current = null;
    }, 120);

    fallbackTimerRef.current = window.setTimeout(() => {
      finishProgress();
    }, 8000);
  }, [clearTimer, finishProgress]);

  useEffect(() => {
    if (previousPathnameRef.current === pathname) return;

    previousPathnameRef.current = pathname;
    const timer = window.setTimeout(() => {
      finishProgress();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [finishProgress, pathname]);

  useEffect(() => {
    return () => {
      clearTimer(showTimerRef);
      clearTimer(fallbackTimerRef);
      clearTimer(hideTimerRef);
    };
  }, [clearTimer]);

  useEffect(() => {
    function onDocumentClick(event: MouseEvent) {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey
      ) {
        return;
      }

      const target = event.target instanceof Element ? event.target.closest("a") : null;
      if (!(target instanceof HTMLAnchorElement)) return;
      if (target.target && target.target !== "_self") return;
      if (target.hasAttribute("download")) return;

      const href = target.getAttribute("href");
      if (!href || !shouldStartProgressForHref(href)) return;

      startProgress();
    }

    document.addEventListener("click", onDocumentClick, { capture: true });

    return () => {
      document.removeEventListener("click", onDocumentClick, { capture: true });
    };
  }, [startProgress]);

  return (
    <NavigationProgressContext.Provider value={{ phase, start: startProgress }}>
      {children}
    </NavigationProgressContext.Provider>
  );
}

function useNavigationProgress() {
  const context = useContext(NavigationProgressContext);

  if (!context) {
    throw new Error("useNavigationProgress must be used inside NavigationProgressProvider.");
  }

  return context;
}

export function useProgressRouter() {
  const router = useRouter();
  const { start } = useNavigationProgress();

  return {
    back: () => router.back(),
    forward: () => router.forward(),
    prefetch: (href: string, options?: Parameters<typeof router.prefetch>[1]) =>
      router.prefetch(href, options),
    push: (href: string, options?: Parameters<typeof router.push>[1]) => {
      if (shouldStartProgressForHref(href)) {
        start();
      }

      router.push(href, options);
    },
    refresh: () => router.refresh(),
    replace: (href: string, options?: Parameters<typeof router.replace>[1]) => {
      if (shouldStartProgressForHref(href)) {
        start();
      }

      router.replace(href, options);
    },
  };
}

export function NavigationProgressBar({
  className,
  placement = "dashboard",
}: NavigationProgressBarProps) {
  const pathname = usePathname();
  const { phase } = useNavigationProgress();
  const isVisible = phase !== "idle";

  if (placement === "global" && isDashboardRoute(pathname)) {
    return null;
  }

  return (
    <div
      aria-hidden={!isVisible}
      aria-label={isVisible ? "Page loading" : undefined}
      role={isVisible ? "progressbar" : undefined}
      className={cn(
        "pointer-events-none h-1 w-full overflow-hidden bg-primary/10 transition-opacity duration-150",
        placement === "global" && "fixed inset-x-0 top-0 z-50",
        isVisible ? "opacity-100" : "opacity-0",
        className,
      )}
    >
      <div
        className={cn(
          "h-full bg-primary",
          phase === "loading" && "w-1/2 animate-navigation-progress",
          phase === "finishing" && "w-full",
          phase === "idle" && "w-0",
        )}
      />
    </div>
  );
}
