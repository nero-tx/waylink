"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  ShieldAlert,
  Briefcase,
  UserCheck,
  UserCog,
  CheckCircle2,
  Layers,
  Sparkles,
  MessageSquare,
  ArrowUpRight,
  ShieldCheck,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { faqs, mainPillars, quickLinks } from "./data";

interface RoleProblem {
  role: string;
  badge: string;
  icon: React.ElementType;
  problems: {
    issue: string;
    resolution: string;
  }[];
}

const roleTroubleshooting: RoleProblem[] = [
  {
    role: "Clients & Customers",
    badge: "Customer Operations",
    icon: UserCheck,
    problems: [
      {
        issue: "Pending booking confirmation or payment hold",
        resolution:
          "Escrow funds remain safe until provider acknowledgment. Check your live timeline or request an automated re-route after the confirmation window.",
      },
      {
        issue: "Service rescheduling or last-minute cancellation",
        resolution:
          "Self-serve cancellation is available in your booking console up to 2 hours prior to execution with automatic refund triggers.",
      },
    ],
  },
  {
    role: "Service Providers",
    badge: "Verified Partners",
    icon: Briefcase,
    problems: [
      {
        issue: "Payout settlement timing and bank verification",
        resolution:
          "Ensure your Stripe/KYC documents are completely verified. Enterprise settlements disburse bi-weekly directly to registered accounts.",
      },
      {
        issue: "Calendar integration & double-booking conflicts",
        resolution:
          "Re-sync Google/Outlook endpoints under Provider Preferences to reactivate bidirectional buffer protection.",
      },
    ],
  },
  {
    role: "Field Staff & Operations",
    badge: "Logistics Squad",
    icon: Layers,
    problems: [
      {
        issue: "On-demand re-dispatching & territory shifts",
        resolution:
          "Staff leads can apply administrative overrides from the dispatch terminal to re-allocate unassigned jobs instantaneously.",
      },
      {
        issue: "Offline telemetry and GPS route synchronization",
        resolution:
          "The mobile app maintains local cache logs and will auto-reconcile completed waypoint timestamps upon network reconnect.",
      },
    ],
  },
  {
    role: "Managers & Administrators",
    badge: "Governance & SLA",
    icon: UserCog,
    problems: [
      {
        issue: "SLA priority breaches & incident escalation",
        resolution:
          "System threshold alarms send instant webhooks to supervisory dashboards, permitting one-click escalation to Tier-2 senior dispatchers.",
      },
      {
        issue: "Role-Based Access Control (RBAC) privilege audits",
        resolution:
          "Admins can instantly revoke or calibrate API scopes and agent permissions from the global compliance console.",
      },
    ],
  },
];

export default function SupportPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (idx: number) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  return (
    <div className="min-h-screen bg-waylink-fade pt-24 pb-15">
      {/* --- AMBIENT linear BACKGROUND (BLUE & ORANGE) --- */}
      <div>
        <motion.div
          className="absolute -top-40 left-1/4 w-125 h-125 rounded-full pointer-events-none bg-radial from-orange-3/15 to-transparent blur-3xl"
          animate={{ scale: [1, 1.1, 1], x: [0, 20, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -bottom-20 right-1/4 w-96 h-96 rounded-full pointer-events-none bg-radial from-purple-500/12 to-transparent blur-[80px]"
          animate={{ scale: [1, 1.15, 1], x: [0, -15, 0] }}
          transition={{
            duration: 11,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 3,
          }}
        />
        <motion.div
          className="absolute top-1/2 -left-10 w-64 h-64 rounded-full pointer-events-none bg-radial from-green-1/10 to-transparent blur-[60px]"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{
            duration: 9,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1.5,
          }}
        />

        <svg className="absolute inset-0 w-full h-full opacity-[0.06] pointer-events-none">
          <defs>
            <pattern
              id="dots"
              x="0"
              y="0"
              width="24"
              height="24"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="2" cy="2" r="1.2" fill="currentColor" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dots)" />
        </svg>
      </div>

      {/* Hero section */}
      <div className="px-4 sm:px-6 lg:px-8 container mx-auto space-y-20 relative">
        <section className="relative">
          <div className="space-y-10">
            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-orange-500/30 bg-orange-500/10 text-orange-600 dark:text-orange-400 text-xs font-semibold uppercase tracking-wider font-sans"
              >
                <Sparkles className="w-3.5 h-3.5 text-orange-500" />
                Unified Support &amp; Resource Hub
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.15]"
              >
                Support for everyone on{" "}
                <span className="bg-linear-to-r from-blue-600 via-sky-500 to-orange-500 bg-clip-text text-transparent">
                  Waylink
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl"
              >
                Waylink bridges clients, verified service providers, operational
                field teams, and administrative managers. Get rapid dispute
                resolution, browse curated guides, or open an enterprise
                priority ticket.
              </motion.p>

              {/* Quick Action Navigation Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="pt-2 flex flex-wrap items-center gap-2"
              >
                {quickLinks.map(
                  ({ label, href, icon: Icon, className, iconClassName }) => (
                    <Link
                      key={href}
                      href={href}
                      className={cn(
                        "inline-flex items-center gap-2 px-5 py-3 rounded-md font-medium transition-all duration-200",
                        className,
                      )}
                    >
                      <Icon className={iconClassName} />
                      {label}
                    </Link>
                  ),
                )}
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <div className="relative max-w-none rounded-3xl p-1 md:p-2 bg-linear-to-b from-blue-500/20 via-orange-500/20 to-transparent border border-border">
                <div className="relative h-95 md:h-120 w-full rounded-2xl overflow-hidden bg-muted">
                  <Image
                    src="/main-sup.jpeg"
                    alt="Waylink Enterprise Customer Support Hub"
                    fill
                    priority
                    className="object-cover"
                  />
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* three core pillars section */}
        <section className="border-t pt-20">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-semibold uppercase tracking-wider text-orange-600 dark:text-orange-400">
              Assistance Channels
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mt-2">
              Connect, Resolve, and Learn
            </h2>
            <p className="mt-3 text-muted-foreground">
              Multiple avenues tailored to how you prefer to engage with the
              Waylink platform.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {mainPillars.map((pillar, i) => {
              const Icon = pillar.icon;

              return (
                <motion.div
                  key={pillar.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.45, delay: i * 0.1 }}
                  className="relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
                >
                  <div className="relative h-48 overflow-hidden bg-muted">
                    <Image
                      src={pillar.image}
                      alt={pillar.title}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                      className="object-cover"
                    />

                    <div className="absolute inset-0  bg-linear-to-t from-black/50 via-black/10 to-transparent" />
                    <span className="absolute right-4 top-4 rounded-lg border border-white/20 bg-black/30 px-2.5 py-1 font-mono text-xs text-white backdrop-blur-md">
                      0{i + 1}
                    </span>
                  </div>

                  <div className="flex flex-1 flex-col p-6">
                    <div className="flex items-center gap-1 mb-4">
                      <div className="flex size-10 items-center justify-center rounded-xl border border-border/50">
                        <Icon className={cn("size-5", pillar.accentColor)} />
                      </div>
                      <span
                        className={cn(
                          "w-fit items-center rounded-md border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em]",
                          pillar.badgeBg,
                        )}
                      >
                        {pillar.tagline}
                      </span>
                    </div>
                    <h3 className="mb-3 text-xl font-bold tracking-tight text-card-foreground">
                      {pillar.title}
                    </h3>
                    <p className="text-sm leading-7 text-muted-foreground">
                      {pillar.description}
                    </p>

                    <div className="mt-6 flex items-center gap-2">
                      <div
                        className={cn(
                          "h-1 w-8 rounded-full",
                          pillar.accentSolid,
                        )}
                      />
                      <div className="h-px flex-1 bg-border" />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* role trobleshooting */}
        <section className="border-t pt-20">
          <div className="max-w-3xl mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-semibold mb-3 border border-blue-500/20">
              <ShieldCheck className="size-3.5" />
              Reliability &amp; Incident Playbooks
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
              Potential Bottlenecks &amp; How Waylink Resolves Them
            </h2>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              Every platform role has explicit paths to resolve issues without
              waiting days for administrative intervention.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {roleTroubleshooting.map((group, idx) => {
              const RoleIcon = group.icon;
              return (
                <motion.div
                  key={group.role}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: idx * 0.1 }}
                  className="rounded-2xl bg-card border border-border p-6 shadow-sm flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between pb-4 border-b border-border mb-5">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-400">
                          <RoleIcon className="w-5 h-5" />
                        </div>
                        <h3 className="text-lg font-bold text-card-foreground">
                          {group.role}
                        </h3>
                      </div>
                      <span className="text-xs font-mono px-2.5 py-1 rounded-md bg-secondary text-secondary-foreground border border-border">
                        {group.badge}
                      </span>
                    </div>

                    <div className="space-y-4">
                      {group.problems.map((prob, pIdx) => (
                        <div key={pIdx} className="space-y-1.5">
                          <div className="flex items-start gap-2">
                            <ShieldAlert className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                            <p className="text-sm font-semibold text-foreground">
                              {prob.issue}
                            </p>
                          </div>
                          <div className="flex items-start gap-2 pl-6">
                            <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              {prob.resolution}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* ticket sys showcase */}
        <section className="border-t py-20">
          <div className="rounded-3xl bg-linear-to-br from-blue-900/10 via-card to-orange-900/10 border border-border p-8 sm:p-12 shadow-sm relative overflow-hidden">
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              <div className="lg:col-span-7 space-y-4">
                <span className="text-xs font-mono uppercase text-orange-600 dark:text-orange-400 tracking-wider">
                  Full-Lifecycle Incident Management
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground">
                  How Waylink&apos;s Ticket Architecture Works
                </h2>
                <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">
                  When you initiate a case at{" "}
                  <code className="text-blue-600 dark:text-blue-400 bg-secondary px-1.5 py-0.5 rounded font-mono text-xs">
                    /account/support
                  </code>
                  , your ticket isn&apos;t just sent to an inbox—it enters an
                  enterprise dispatch pipeline.
                </p>

                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
                    <span className="text-sm text-foreground">
                      Persistent bidirectional chat thread between you and
                      assigned technical teams.
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-orange-500 shrink-0" />
                    <span className="text-sm text-foreground">
                      Direct access to billing audits, order adjustments, and
                      mutual escrow dispute holds.
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
                    <span className="text-sm text-foreground">
                      Strict SLA guarantee: First response in under 15 minutes
                      for verified accounts.
                    </span>
                  </div>
                </div>

                <div className="pt-4 flex flex-wrap gap-4">
                  <Link
                    href="/account/support"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium transition-all duration-200"
                  >
                    <MessageSquare className="size-4" />
                    Start A New Ticket
                  </Link>
                  <Link
                    href="/become-provider"
                    className="group inline-flex items-center gap-2 rounded-xl border border-border bg-secondary px-5 py-3 text-sm font-medium text-secondary-foreground transition-colors duration-200 hover:bg-secondary/80"
                  >
                    Join As a Provider
                    <span className="relative flex size-4 overflow-hidden">
                      <ArrowUpRight className="absolute inset-0 size-4 text-orange-500 transition-transform duration-300 ease-out group-hover:-translate-y-full" />

                      <ArrowUpRight className="absolute inset-0 size-4 translate-y-full text-orange-500        transition-transform duration-300 ease-out group-hover:translate-y-0" />
                    </span>
                  </Link>
                </div>
              </div>

              {/* Visual Simulated Ticket Card */}
              <div className="lg:col-span-5 flex justify-center">
                <div className="w-full max-w-sm rounded-2xl bg-card border border-border p-6 shadow-xl relative space-y-4 select-none">
                  <div className="flex items-center justify-between pb-3 border-b border-border">
                    <span className="text-xs font-mono text-blue-600 dark:text-blue-400 font-semibold">
                      WL-TICKET #8491
                    </span>
                    <span className="text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Live Active
                    </span>
                  </div>
                  <div className="space-y-3">
                    <div className="p-3 rounded-xl bg-muted/60 border border-border">
                      <p className="text-[11px] font-semibold text-muted-foreground uppercase">
                        User Inquiry
                      </p>
                      <p className="text-xs text-foreground mt-1">
                        Need schedule realignment for emergency facility
                        servicing.
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                      <p className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 uppercase">
                        Waylink Support Dispatch
                      </p>
                      <p className="text-xs text-foreground mt-1">
                        Provider slot unlocked and confirmation voucher
                        re-issued to calendar.
                      </p>
                    </div>
                  </div>
                  <div className="pt-2 flex justify-between items-center text-xs text-muted-foreground border-t border-border">
                    <span>Assigned Agent: Sarah M.</span>
                    <span className="text-orange-500 font-medium">
                      Priority 1
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FQA section */}
        <section className="border-t py-20">
          <div className="text-center mb-14">
            <span className="text-xs font-semibold text-orange-600 dark:text-orange-400 uppercase tracking-widest">
              Answers &amp; Clarity
            </span>
            <h2 className="text-3xl font-bold text-foreground mt-1">
              Frequently Asked Questions
            </h2>
            <p className="text-muted-foreground text-sm mt-2">
              Clear guidelines on ticket escalation, community guidelines, and
              provider verification.
            </p>
          </div>

          <Faq />
        </section>
      </div>
    </div>
  );
}

function Faq() {
  return (
    <div className=" w-full px-4 sm:px-6">
      <motion.div
        className="last:border-b-0"
        initial={{ opacity: 0, y: 22 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.55 }}
      >
        <Accordion
          type="single"
          collapsible
          className="rounded-xl border bg-card px-5"
        >
          {faqs.map((f, i) => (
            <AccordionItem
              key={f.q}
              value={`faq-${i}`}
              className="last:border-b-0"
            >
              <AccordionTrigger className="text-left text-base">
                {f.q}
              </AccordionTrigger>
              <AccordionContent className="leading-relaxed text-muted-foreground">
                {f.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </motion.div>
    </div>
  );
}
