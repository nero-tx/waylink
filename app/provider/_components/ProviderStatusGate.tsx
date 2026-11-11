"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  CircleCheck,
  CircleSlash,
  Clock,
  Loader2,
  PauseCircle,
  ShieldAlert,
  XCircle,
} from "lucide-react";
import { cn, fmtDate, generateColor } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Provider, ProviderStatusLog } from "@/lib/all-types";
import Image from "next/image";
import { initials } from "@/lib/helpers";
import Link from "next/link";

type BlockedStatus = "pending" | "inactive" | "suspended" | "rejected";

const COPY: Record<
  BlockedStatus,
  {
    title: string;
    summary: string;
    icon: typeof Clock;
    tone: string;
  }
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

export const mockProviderStatusLog: ProviderStatusLog = {
  id: "log-001",
  createdAt: new Date("2026-11-10T10:30:00"),
  updatedAt: new Date("2026-11-10T10:30:00"),
  providerId: "provider-001",
  fromStatus: "pending",
  toStatus: "rejected",
  notes: "The provider's submitted documents are incomplete.",
  suggestedSolution:
    "Please upload valid business registration documents and verify your contact information.",
  actorId: "user-admin-001",
  resolvedAt: null,
  resolvedBy: null,
  actor: {
    id: "user-admin-001",
    name: "Admin User",
    email: "admin@waylink.com",
    image: null,
  },
};

interface ProviderStatusGateProps {
  provider: Provider;
  statusLog?: ProviderStatusLog | null;
  isOwner?: boolean;
  supportHref?: string;
}

export function ProviderStatusGate({
  provider,
  statusLog = mockProviderStatusLog,
  isOwner = false,
  supportHref = "/support",
}: ProviderStatusGateProps) {
  const router = useRouter();
  const [checking, startCheck] = useTransition();

  if (provider.status === "approved") return null;

  const status = provider.status as BlockedStatus;
  const copy = COPY[status];

  if (!copy) return null;

  const Icon = copy.icon;

  const reason = statusLog?.notes;
  const suggestedSolution = statusLog?.suggestedSolution;
  const decidedAt = statusLog?.updatedAt;
  const color = generateColor(provider.name);

  return (
    <div className="flex h-full items-center justify-center px-4 md:px-6 py-6">
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

        {(reason || suggestedSolution) && (
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

        {!isOwner && status !== "pending" && (
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
            onClick={() => startCheck(() => router.refresh())}
            disabled={checking}
            className="sm:min-w-40"
          >
            {checking && <Loader2 className="size-4 animate-spin" />}
            {checking ? "Checking..." : "Check status again"}
          </Button>

          <Button variant="outline" asChild>
            <a href={supportHref}>Contact support</a>
          </Button>
        </div>
      </div>
    </div>
  );
}
