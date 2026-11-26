"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import {
  ArrowLeft,
  Loader2,
  RefreshCw,
  SearchX,
  TriangleAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const VARIANTS = {
  "not-found": {
    icon: SearchX,
    title: "Ticket not found",
    description:
      "This ticket doesn’t exist, or you don’t have access to it. Check the link or head back to your tickets.",
    canRetry: false,
    tone: {
      glow: "bg-amber-500",
      dot: "bg-amber-500",
      icon: "text-amber-600 dark:text-amber-400",
      ring: "ring-amber-500/25",
    },
  },
  error: {
    icon: TriangleAlert,
    title: "Couldn’t load this ticket",
    description:
      "Something went wrong while loading this conversation. Please try again.",
    canRetry: true,
    tone: {
      glow: "bg-red-500",
      dot: "bg-red-500",
      icon: "text-red-600 dark:text-red-400",
      ring: "ring-red-500/25",
    },
  },
} as const;

export function TicketStateCard({
  variant,
  error,
}: {
  variant: keyof typeof VARIANTS;
  error?: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const {
    icon: Icon,
    title,
    description,
    canRetry,
    tone,
  } = VARIANTS[variant];

  const handleRetry = () => startTransition(() => router.refresh());

  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className="relative flex h-full w-full items-center justify-center overflow-hidden px-6 py-16"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 text-border/70"
        style={{
          backgroundImage: "radial-gradient(currentColor 1px, transparent 1px)",
          backgroundSize: "24px 24px",
          WebkitMaskImage:
            "radial-gradient(ellipse at center, black 20%, transparent 70%)",
          maskImage:
            "radial-gradient(ellipse at center, black 20%, transparent 70%)",
        }}
      />

      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute left-1/2 top-1/2 size-96 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-10 blur-3xl dark:opacity-15",
          tone.glow,
        )}
      />

      <div className="relative flex w-full max-w-lg flex-col items-center text-center motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2 motion-safe:duration-500">
        <div
          className={cn(
            "mb-6 flex size-20 items-center justify-center rounded-3xl border border-border bg-card shadow-sm ring-4",
            tone.ring,
          )}
        >
          <Icon className={cn("size-9", tone.icon)} strokeWidth={1.5} />
        </div>

        <h1 className="text-balance text-2xl font-semibold tracking-tight sm:text-3xl">
          {title}
        </h1>

        <p className="mt-3 max-w-md text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
          {description}
        </p>

        {error && (
          <code
            dir="ltr"
            className="mt-4 max-w-full truncate rounded-md border border-border bg-muted/40 px-3 py-1.5 font-mono text-xs text-muted-foreground"
            title={error}
          >
            {error}
          </code>
        )}

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {canRetry && (
            <Button onClick={handleRetry} disabled={isPending}>
              {isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <RefreshCw className="size-4" />
              )}
              {isPending ? "Retrying…" : "Try again"}
            </Button>
          )}

          <Button asChild variant={canRetry ? "outline" : "default"}>
            <Link href="/account/support">
              <ArrowLeft className="size-4" />
              Back to tickets
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
