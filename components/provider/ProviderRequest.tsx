"use client";

import { useEffect, useState, type ElementType, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { cn, fmtDate, generateColor } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CheckCircle2,
  Clock,
  XCircle,
  PauseCircle,
  PowerOff,
  BadgeCheck,
  ArrowRight,
  RefreshCcw,
  Mail,
  Building2,
  Phone,
  MapPin,
  Briefcase,
  CalendarDays,
  AlertTriangle,
  LifeBuoy,
} from "lucide-react";
import {
  BusinessType,
  Provider,
  ProviderStatus,
  ProviderStatusLog,
  ServiceType,
} from "@/lib/all-types";
import Link from "next/link";
import Image from "next/image";
import { initials } from "@/lib/helpers";

type ProviderWithLog = Provider & { logs: ProviderStatusLog[] | null };

type FetchState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; provider: ProviderWithLog | null };

const STATUS_CONFIG: Record<
  ProviderStatus,
  { label: string; className: string; dotClassName: string }
> = {
  pending: {
    label: "Pending review",
    className:
      "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800",
    dotClassName: "bg-amber-500",
  },
  approved: {
    label: "Approved",
    className:
      "bg-green-50 text-green-800 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800",
    dotClassName: "bg-green-500",
  },
  suspended: {
    label: "Suspended",
    className:
      "bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700",
    dotClassName: "bg-zinc-400",
  },
  inactive: {
    label: "Inactive",
    className:
      "bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700",
    dotClassName: "bg-zinc-400",
  },
  rejected: {
    label: "Rejected",
    className:
      "bg-red-100 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900",
    dotClassName: "bg-red-500",
  },
};

const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
  transport: "Transport",
  experience: "Experience",
};

const BUSINESS_TYPE_LABELS: Record<BusinessType, string> = {
  individual: "Individual",
  company: "Company",
  agency: "Agency",
};

const DECISION_DATE_LABEL: Partial<Record<ProviderStatus, string>> = {
  approved: "Approved on",
  rejected: "Reviewed on",
  suspended: "Suspended on",
  inactive: "Deactivated on",
};

function SupportButton() {
  return (
    <Button
      variant="outline"
      asChild
      className="w-full gap-2 sm:w-auto sm:self-start"
    >
      <Link href="/support">
        <LifeBuoy className="size-3.5" />
        Contact support
      </Link>
    </Button>
  );
}

function StatusLayout({
  alert,
  left,
  right,
}: {
  alert: ReactNode;
  left: ReactNode;
  right: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3">
      {alert}
      <div className="grid items-start gap-3 md:grid-cols-2">
        {left}
        <div className="flex flex-col gap-3">{right}</div>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div
      className="flex flex-col gap-3"
      aria-busy="true"
      aria-label="Loading provider"
    >
      <Skeleton className="h-12 w-full rounded-lg" />

      <div className="grid items-start gap-3 md:grid-cols-2">
        {/* Provider card */}
        <Card>
          <CardHeader className="pb-0">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <Skeleton className="size-10 rounded-md" />
                <div className="flex flex-col gap-2">
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <Skeleton className="h-5 w-24 rounded-full" />
            </div>
            <Skeleton className="mt-4 h-3.5 w-full" />
            <Skeleton className="mt-1.5 h-3.5 w-3/4" />
            <Separator className="mt-4" />
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid grid-cols-2 gap-x-6 gap-y-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex flex-col gap-1.5">
                  <Skeleton className="h-2.5 w-16" />
                  <Skeleton className="h-4 w-28" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Status log + support */}
        <div className="flex flex-col gap-3">
          <Card>
            <CardContent className="flex flex-col gap-5 pt-6">
              <div className="flex flex-col gap-2.5">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-14 w-full rounded-md" />
              </div>
              <div className="flex flex-col gap-2.5">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-14 w-full rounded-md" />
              </div>
              <Skeleton className="h-3 w-24" />
            </CardContent>
          </Card>
          <Skeleton className="h-9 w-full rounded-md sm:w-36" />
        </div>
      </div>
    </div>
  );
}

function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center gap-3 py-12 text-center">
        <div className="flex size-12 items-center justify-center rounded-lg border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
          <AlertTriangle className="size-5 text-red-500" />
        </div>
        <div>
          <p className="text-[15px] font-semibold">Something went wrong</p>
          <p className="mt-1 max-w-xs text-sm leading-relaxed text-muted-foreground">
            {message}
          </p>
        </div>
        <Button variant="outline" onClick={onRetry} className="mt-1 gap-2">
          <RefreshCcw className="size-3.5" />
          Try again
        </Button>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: ProviderStatus }) {
  const config = STATUS_CONFIG[status];
  return (
    <Badge
      variant="outline"
      className={cn("gap-1.5 text-xs font-medium", config.className)}
    >
      <span className={cn("size-1.5 rounded-full", config.dotClassName)} />
      {config.label}
    </Badge>
  );
}

function ProviderAvatar({
  pName,
  logo,
}: {
  pName: string;
  logo: string | null;
}) {
  const color = generateColor(pName);

  return logo ? (
    <Image
      src={logo}
      alt={pName}
      width={50}
      height={50}
      className="size-10 shrink-0 rounded-md border border-border object-cover"
    />
  ) : (
    <div
      className="flex size-10 shrink-0 items-center justify-center rounded-md border text-sm font-semibold"
      style={{
        background: color.alpha(0.2),
        color: color.base,
        borderColor: color.base,
      }}
    >
      {initials(pName)}
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: ElementType;
  label: string;
  value: string | null | undefined;
}) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
        <span className="truncate text-sm font-medium text-foreground">
          {value}
        </span>
      </div>
    </div>
  );
}

function ProviderCard({
  provider,
  dimmed = false,
  footer,
}: {
  provider: Provider;
  dimmed?: boolean;
  footer?: ReactNode;
}) {
  const decisionLabel = DECISION_DATE_LABEL[provider.status];

  return (
    <Card className={cn("transition-opacity", dimmed && "opacity-60")}>
      {provider.cover && (
        <div className="h-24 w-full overflow-hidden rounded-t-lg">
          <img
            src={provider.cover}
            alt="cover"
            className="h-full w-full object-cover"
          />
        </div>
      )}
      <CardHeader className="pb-0">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <ProviderAvatar pName={provider.name} logo={provider.logo} />
            <div>
              <p className="text-[15px] font-semibold leading-tight">
                {provider.name}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {provider.slug} · {SERVICE_TYPE_LABELS[provider.serviceType]}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1.5">
            <StatusBadge status={provider.status} />
            {provider.isVerified && (
              <Badge
                variant="outline"
                className="gap-1 border-blue-200 bg-blue-50 text-[11px] text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300"
              >
                <BadgeCheck className="size-3" />
                Verified
              </Badge>
            )}
          </div>
        </div>
        {provider.description && (
          <p className="pb-1 pt-3 text-sm leading-relaxed text-muted-foreground">
            {provider.description}
          </p>
        )}
        <Separator className="mt-3" />
      </CardHeader>

      <CardContent className="pt-4">
        <div className="grid grid-cols-2 gap-x-6 gap-y-4">
          <InfoRow
            icon={Building2}
            label="Business type"
            value={BUSINESS_TYPE_LABELS[provider.businessType]}
          />
          <InfoRow
            icon={Briefcase}
            label="Service type"
            value={SERVICE_TYPE_LABELS[provider.serviceType]}
          />
          <InfoRow icon={Mail} label="Email" value={provider.businessEmail} />
          <InfoRow icon={Phone} label="Phone" value={provider.businessPhone} />
          {provider.address && (
            <div className="col-span-2">
              <InfoRow icon={MapPin} label="Address" value={provider.address} />
            </div>
          )}
          <InfoRow
            icon={CalendarDays}
            label="Submitted"
            value={fmtDate(provider.createdAt)}
          />
          {decisionLabel && (
            <InfoRow
              icon={CalendarDays}
              label={decisionLabel}
              value={fmtDate(provider.updatedAt)}
            />
          )}
        </div>

        {footer && (
          <>
            <Separator className="my-4" />
            {footer}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function StatusLogPanel({
  log,
  quiet = false,
}: {
  log: ProviderStatusLog | null;
  quiet?: boolean;
}) {
  const hasContent = !!(log?.notes || log?.suggestedSolution);

  if (!hasContent) {
    if (quiet) return null;
    return (
      <Card>
        <CardContent className="pt-6 text-sm leading-relaxed text-muted-foreground">
          No extra details were added to this decision. If you need help
          understanding it, contact support.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-5 pt-6">
        {log?.notes && (
          <section className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <XCircle className="size-4 text-red-600 dark:text-red-400" />
              <h3 className="text-sm font-semibold">What happened</h3>
            </div>
            <div className="rounded-r-md border-l-2 border-red-500/30 bg-red-500/10 py-2 pl-3 pr-2">
              <p className="whitespace-pre-wrap text-sm leading-relaxed">
                {log.notes}
              </p>
            </div>
          </section>
        )}

        {log?.suggestedSolution && (
          <section className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="size-4 text-green-600 dark:text-green-400" />
              <h3 className="text-sm font-semibold">How to fix it</h3>
            </div>
            <div className="rounded-r-md border-l-2 border-green-500/30 bg-green-500/10 py-2 pl-3 pr-2">
              <p className="whitespace-pre-wrap text-sm leading-relaxed">
                {log.suggestedSolution}
              </p>
            </div>
          </section>
        )}

        {log?.updatedAt && (
          <p className="text-xs text-muted-foreground">
            Updated {fmtDate(log.updatedAt)}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function RequestTimeline({ provider }: { provider: Provider }) {
  const steps = [
    {
      label: "Request submitted",
      time: fmtDate(provider.createdAt),
      state: "done",
    },
    { label: "Under admin review", time: "In progress", state: "active" },
    { label: "Decision", time: "Awaiting", state: "idle" },
  ] as const;

  return (
    <>
      <p className="mb-3 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        Request timeline
      </p>
      <div className="flex flex-col">
        {steps.map((step, i) => (
          <div key={step.label} className="flex gap-3">
            <div className="flex w-4 shrink-0 flex-col items-center">
              <div
                className={cn("mt-1.5 size-2 shrink-0 rounded-full", {
                  "bg-green-500": step.state === "done",
                  "bg-amber-500 ring-2 ring-amber-200 dark:ring-amber-900":
                    step.state === "active",
                  "bg-border": step.state === "idle",
                })}
              />
              {i < steps.length - 1 && (
                <div className="mb-1 mt-1 min-h-4 w-px flex-1 bg-border" />
              )}
            </div>
            <div className="pb-4">
              <p
                className={cn("text-sm font-medium", {
                  "text-foreground": step.state !== "idle",
                  "font-normal text-muted-foreground": step.state === "idle",
                })}
              >
                {step.label}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {step.time}
              </p>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function EmptyState({ onRequest }: { onRequest: () => void }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <div className="flex size-12 items-center justify-center rounded-lg border border-border bg-muted">
          <Briefcase className="size-5 text-muted-foreground" />
        </div>
        <div>
          <p className="text-[15px] font-semibold">No provider request yet</p>
          <p className="mt-1 max-w-xs text-sm leading-relaxed text-muted-foreground">
            You haven't applied to become a provider. Start the process to offer
            your services on the platform.
          </p>
        </div>
        <Button onClick={onRequest} className="mt-1 gap-2">
          Become a provider
          <ArrowRight className="size-3.5" />
        </Button>
      </CardContent>
    </Card>
  );
}

function ProviderStatusView({ provider }: { provider: ProviderWithLog }) {
  const router = useRouter();
  const log = provider.logs?.[0] ?? null;

  switch (provider.status) {
    case "pending":
      return (
        <StatusLayout
          alert={
            <Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
              <Clock className="size-4 text-amber-600 dark:text-amber-400" />
              <AlertDescription className="text-sm text-amber-800 dark:text-amber-300">
                Your request is under review. We typically respond within 2–3
                business days. You'll be notified by email once a decision is
                made.
              </AlertDescription>
            </Alert>
          }
          left={<ProviderCard provider={provider} />}
          right={
            <>
              <Card>
                <CardContent className="pt-6">
                  <RequestTimeline provider={provider} />
                </CardContent>
              </Card>
              {/* Only shows if an admin left a note. */}
              <StatusLogPanel log={log} quiet />
              <SupportButton />
            </>
          }
        />
      );

    case "approved":
      // Nothing to explain, so no second column.
      return (
        <div className="flex flex-col gap-3">
          <Alert className="flex flex-row items-center justify-between gap-3 border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
            <div className="flex flex-1 items-start gap-2">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-green-600 dark:text-green-400" />
              <AlertDescription className="text-sm text-green-800 dark:text-green-300">
                <span className="font-semibold">
                  Your provider account is approved!
                </span>{" "}
                You can now access your provider dashboard and start managing
                your services.
              </AlertDescription>
            </div>
            <Button
              onClick={() => router.push("/provider")}
              size="sm"
              className="shrink-0 cursor-pointer gap-1.5 bg-green-600 text-white hover:bg-green-700"
            >
              Start your business
              <ArrowRight className="size-3.5" />
            </Button>
          </Alert>
          <ProviderCard provider={provider} />
        </div>
      );

    case "rejected":
      return (
        <StatusLayout
          alert={
            <Alert className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950">
              <XCircle className="size-4 text-red-600 dark:text-red-400" />
              <AlertDescription className="text-sm text-red-800 dark:text-red-300">
                <span className="font-semibold">
                  Your request was not approved.
                </span>{" "}
                Read the details, fix the issue, and submit a new request.
              </AlertDescription>
            </Alert>
          }
          left={<ProviderCard provider={provider} />}
          right={
            <>
              <StatusLogPanel log={log} />
              <SupportButton />
            </>
          }
        />
      );

    case "suspended":
      return (
        <StatusLayout
          alert={
            <Alert className="border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900">
              <PauseCircle className="size-4 text-zinc-500" />
              <AlertDescription className="text-sm text-zinc-700 dark:text-zinc-300">
                <span className="font-semibold">Account suspended.</span> Access
                to your provider dashboard is temporarily restricted. Contact
                support if you believe this is a mistake.
              </AlertDescription>
            </Alert>
          }
          left={<ProviderCard provider={provider} dimmed />}
          right={
            <>
              <StatusLogPanel log={log} />
              <SupportButton />
            </>
          }
        />
      );

    case "inactive":
      return (
        <StatusLayout
          alert={
            <Alert className="border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900">
              <PowerOff className="size-4 text-zinc-500" />
              <AlertDescription className="text-sm text-zinc-700 dark:text-zinc-300">
                <span className="font-semibold">
                  Your provider account is inactive.
                </span>{" "}
                Your profile is no longer visible to customers. Reactivate to
                resume your services.
              </AlertDescription>
            </Alert>
          }
          left={<ProviderCard provider={provider} dimmed />}
          right={
            <>
              <StatusLogPanel log={log} />
              <SupportButton />
            </>
          }
        />
      );

    default:
      return null;
  }
}

export function ProviderRequest() {
  const router = useRouter();
  const [retryKey, setRetryKey] = useState(0);
  const [state, setState] = useState<FetchState>({ status: "loading" });

  useEffect(() => {
    const controller = new AbortController();
    setState({ status: "loading" });

    fetch("/api/user/provider", {
      signal: controller.signal,
      cache: "no-store",
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to fetch provider");
        const json = await res.json();
        setState({
          status: "success",
          provider:
            json.status === "empty" ? null : (json.data as ProviderWithLog),
        });
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError")
          return;
        setState({
          status: "error",
          message:
            error instanceof Error
              ? error.message
              : "An unknown error occurred",
        });
      });

    return () => controller.abort();
  }, [retryKey]);

  if (state.status === "loading") return <LoadingSkeleton />;

  if (state.status === "error") {
    return (
      <ErrorState
        message={state.message}
        onRetry={() => setRetryKey((k) => k + 1)}
      />
    );
  }

  if (!state.provider) {
    return <EmptyState onRequest={() => router.push("/become-provider")} />;
  }

  return <ProviderStatusView provider={state.provider} />;
}
