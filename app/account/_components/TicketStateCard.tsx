"use client";

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
    title: "Ticket Not Found",
    description:
      "This ticket doesn’t exist, or you don’t have access to it. Check the link or go back to your tickets.",
    status: "Status: 404",
    dot: "bg-amber-500",
  },
  error: {
    icon: TriangleAlert,
    title: "Couldn't Load Ticket Data",
    description:
      "Something went wrong while loading this conversation. Please try again.",
    status: "Status: Load Failed",
    dot: "bg-red-500",
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
  const { icon: Icon, title, description, status, dot } = VARIANTS[variant];

  const isError = variant === "error";

  return (
    <div
      role="status"
      className="relative flex h-full w-full items-center justify-center overflow-hidden px-6 py-16"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 text-border"
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
          "pointer-events-none absolute left-1/2 top-1/2 size-96 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-15 blur-3xl",
          dot,
        )}
      />

      <div className="relative flex w-full max-w-lg flex-col items-center text-center">
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 backdrop-blur">
          <span className="relative flex size-2">
            <span
              className={cn(
                "absolute inline-flex size-full rounded-full opacity-60 motion-safe:animate-ping",
                dot,
              )}
            />
            <span
              className={cn("relative inline-flex size-2 rounded-full", dot)}
            />
          </span>
          <span className="text-xs tracking-wider text-muted-foreground">
            {status}
          </span>
        </div>

        <div className="mb-6 flex size-20 items-center justify-center rounded-3xl border border-border bg-card shadow-sm">
          <Icon className="size-9 text-muted-foreground" strokeWidth={1.5} />
        </div>

        <h1 className="text-xl font-semibold tracking-tight sm:text-4xl">
          {title}
        </h1>

        <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
          {error ?? description}
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Button
            disabled={isPending}
            onClick={() => startTransition(() => router.refresh())}
          >
            {isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <RefreshCw className="size-4" />
            )}
            Try again
          </Button>

          <Button
            variant={isError ? "outline" : "default"}
            disabled={isPending}
            onClick={() => router.push("/account/support")}
          >
            <ArrowLeft className="size-4" />
            Back to tickets
          </Button>
        </div>
      </div>
    </div>
  );
}
