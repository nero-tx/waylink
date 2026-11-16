"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  CircleCheck,
  CircleSlash,
  Clock,
  Loader2,
  PauseCircle,
  RefreshCw,
  ShieldAlert,
  TriangleAlert,
  XCircle,
} from "lucide-react";
import { cn, fmtDate, generateColor } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Provider, ProviderStatusLog } from "@/lib/all-types";
import Image from "next/image";
import { initials } from "@/lib/helpers";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

type BlockedStatus = "pending" | "inactive" | "suspended" | "rejected";
type Role = "owner" | "manager" | "staff" | null;

const baseURL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

type LogState =
  | { phase: "loading" }
  | { phase: "error"; message: string }
  | { phase: "ready"; log: ProviderStatusLog | null };

const COPY: Record<
  BlockedStatus,
  { title: string; summary: string; icon: typeof Clock; tone: string }
> = {
  pending: {
    title: "Your account is under review",
    summary:
      "We are checking your details. You will get access as soon as the review is done, usually within a couple of days.",
    icon: Clock,
    tone: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  rejected: {
    title: "Your application was not approved",
    summary:
      "Your dashboard is locked until the issue below is fixed and your account is reviewed again.",
    icon: XCircle,
    tone: "bg-red-500/10 text-red-600 dark:text-red-400",
  },
  suspended: {
    title: "Your account is suspended",
    summary:
      "You can't manage listings or bookings while your account is suspended.",
    icon: PauseCircle,
    tone: "bg-slate-500/10 text-slate-600 dark:text-slate-300",
  },
  inactive: {
    title: "Your account is inactive",
    summary:
      "Your account is currently inactive. Reactivate it to resume managing your listings and bookings.",
    icon: CircleSlash,
    tone: "bg-gray-500/10 text-gray-600 dark:text-gray-400",
  },
};

export function ProviderStatusGate({
  provider,
  role = null,
}: {
  provider: Provider;
  role: Role;
}) {
  const router = useRouter();
  const [checking, startCheck] = useTransition();
  const [logState, setLogState] = useState<LogState>({ phase: "loading" });
  const [attempt, setAttempt] = useState(0);

  const isBlocked = provider.status !== "approved";

  useEffect(() => {
    if (!isBlocked) return;

    const controller = new AbortController();
    setLogState({ phase: "loading" });

    fetch(`${baseURL}/api/provider/${provider.id}/status-log`, {
      signal: controller.signal,
      cache: "no-store",
    })
      .then(async (res) => {
        if (!res.ok) {
          setLogState({
            phase: "error",
            message:
              "We couldn't load the details of this issue. Please try again later.",
          });
          return;
        }
        const json = await res.json();
        console.log(json);
        if (json.status === "success") {
          setLogState({
            phase: "ready",
            log: json.data as ProviderStatusLog | null,
          });
          return;
        }
        setLogState({
          phase: "error",
          message: "No unresolved status logs found.",
        });
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setLogState({
          phase: "error",
          message:
            "Something went wrong while processing your request. Please try again.",
        });
      });

    return () => controller.abort();
  }, [provider.id, provider.status, isBlocked, attempt]);

  if (!isBlocked) return null;

  const status = provider.status as BlockedStatus;
  const copy = COPY[status];
  if (!copy) return null;

  const Icon = copy.icon;
  const color = generateColor(provider.name);
  const canManage = role === "owner" || role === "manager";

  const log = logState.phase === "ready" ? logState.log : null;
  const reason = log?.notes;
  const suggestedSolution = log?.suggestedSolution;
  const decidedAt = log?.updatedAt;

  const retry = () => setAttempt((a) => a + 1);

  return (
    <div className="flex h-full items-center justify-center px-4 py-6 md:px-6">
      <div className="w-full max-w-3xl space-y-6">
        <div className="space-y-6">
          <div className="flex items-start gap-4">
            {provider.logo ? (
              <Image
                src={provider.logo}
                alt={`${provider.name} logo`}
                className="size-16 rounded-xl border object-cover"
                width={70}
                height={70}
              />
            ) : (
              <div
                className="flex size-16 shrink-0 items-center justify-center rounded-2xl border bg-muted text-xl font-semibold"
                style={{
                  background: color.alpha(0.2),
                  color: color.base,
                  borderColor: color.base,
                }}
              >
                {initials(provider.name)}
              </div>
            )}

            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-semibold">{provider.name}</h2>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs capitalize text-muted-foreground">
                  {provider.businessType}
                </span>
                {provider.isVerified && (
                  <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-xs text-blue-600 dark:text-blue-400">
                    Verified
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">@{provider.slug}</p>
              {provider.description && (
                <p className="line-clamp-2 text-sm text-muted-foreground">
                  {provider.description}
                </p>
              )}
            </div>
          </div>

          {/* Account status */}
          <div className="flex items-start gap-4">
            <span
              className={cn(
                "flex size-12 shrink-0 items-center justify-center rounded-full",
                copy.tone,
              )}
              aria-hidden
            >
              <Icon className="size-7" />
            </span>
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold tracking-tight text-balance">
                {copy.title}
              </h1>
              <p className="text-muted-foreground">{copy.summary}</p>
            </div>
          </div>

          {/* Business details */}
          <div className="grid gap-3 rounded-lg border p-4 sm:grid-cols-2">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Business type</p>
              <p className="text-sm font-medium capitalize">
                {provider.businessType}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Service category</p>
              <p className="text-sm font-medium capitalize">
                {String(provider.serviceType).replaceAll("_", " ")}
              </p>
            </div>
            {provider.businessEmail && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Business email</p>
                <Link
                  href={`mailto:${provider.businessEmail}`}
                  className="break-all text-sm font-medium hover:underline"
                >
                  {provider.businessEmail}
                </Link>
              </div>
            )}
            {provider.businessPhone && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Business phone</p>
                <Link
                  href={`tel:${provider.businessPhone}`}
                  className="text-sm font-medium hover:underline"
                >
                  {provider.businessPhone}
                </Link>
              </div>
            )}
            {provider.address && (
              <div className="space-y-1 sm:col-span-2">
                <p className="text-xs text-muted-foreground">
                  Business address
                </p>
                <p className="text-sm font-medium">{provider.address}</p>
              </div>
            )}
          </div>
        </div>

        {/* Status log: loading / error / ready */}
        {logState.phase === "loading" && <StatusLogSkeleton />}

        {logState.phase === "error" && (
          <StatusLogError message={logState.message} onRetry={retry} />
        )}

        {logState.phase === "ready" && (reason || suggestedSolution) && (
          <div className="space-y-5 rounded-lg border p-5">
            {reason && (
              <section className="space-y-2">
                <div className="flex items-center gap-2">
                  <XCircle className="size-4 text-destructive" />
                  <h2 className="text-base font-semibold">What happened</h2>
                </div>
                <div className="border-l-2 border-destructive/20 bg-destructive/15 p-2 pl-3">
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">
                    {reason}
                  </p>
                </div>
              </section>
            )}

            {suggestedSolution && (
              <section className="space-y-2">
                <div className="flex items-center gap-2">
                  <CircleCheck className="size-4 text-emerald-500" />
                  <h2 className="text-base font-semibold">How to fix it</h2>
                </div>
                <div className="border-l-2 border-emerald-500/20 bg-emerald-500/15 p-2 pl-3">
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">
                    {suggestedSolution}
                  </p>
                </div>
              </section>
            )}

            {decidedAt && (
              <p className="text-xs text-muted-foreground">
                Updated {fmtDate(decidedAt)}
              </p>
            )}
          </div>
        )}

        {!canManage && status !== "pending" && (
          <div className="flex items-start gap-3 rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-amber-700 dark:text-amber-400">
            <ShieldAlert className="mt-1 size-4.5 shrink-0" />
            <p className="text-sm leading-relaxed">
              Only the account owner or a manager can resolve this issue. Please
              ask one of them to sign in and follow the steps above.
            </p>
          </div>
        )}

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            onClick={() =>
              startCheck(() => {
                router.refresh();
                retry();
              })
            }
            disabled={checking}
            className="sm:min-w-40"
          >
            {checking && <Loader2 className="size-4 animate-spin" />}
            {checking ? "Checking..." : "Check status again"}
          </Button>

          <Button variant="outline" asChild>
            <Link href="/support">Contact support</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

function StatusLogSkeleton() {
  return (
    <div
      className="space-y-5 rounded-lg border p-5"
      aria-busy="true"
      aria-label="Loading issue details"
    >
      <div className="space-y-3">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-16 w-full rounded-md" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-16 w-full rounded-md" />
      </div>
      <Skeleton className="h-3 w-28" />
    </div>
  );
}

function StatusLogError({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div
      role="alert"
      className="flex flex-col gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex items-start gap-3">
        <TriangleAlert className="mt-0.5 size-4.5 shrink-0 text-destructive" />
        <p className="text-sm leading-relaxed">{message}</p>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={onRetry}
        className="shrink-0"
      >
        <RefreshCw className="size-4" />
        Try again
      </Button>
    </div>
  );
}

export function ProviderStatusGateSkeleton() {
  return (
    <div className="flex h-full items-center justify-center px-4 py-6 md:px-6">
      <div className="w-full max-w-3xl space-y-6">
        <div className="flex items-start gap-4">
          <Skeleton className="size-16 shrink-0 rounded-xl" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-full max-w-lg" />
          </div>
        </div>

        <div className="flex items-start gap-4">
          <Skeleton className="size-12 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-7 w-64 max-w-full" />
            <Skeleton className="h-4 w-full max-w-xl" />
            <Skeleton className="h-4 w-3/4 max-w-md" />
          </div>
        </div>

        <div className="grid gap-4 rounded-lg border p-4 sm:grid-cols-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className={cn("space-y-2", index === 4 && "sm:col-span-2")}
            >
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-4 w-40 max-w-full" />
            </div>
          ))}
        </div>

        <StatusLogSkeleton />

        <div className="flex flex-col gap-2 sm:flex-row">
          <Skeleton className="h-10 w-full sm:w-40" />
          <Skeleton className="h-10 w-full sm:w-36" />
        </div>
      </div>
    </div>
  );
}
