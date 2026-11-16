"use client";

import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertCircle,
  Edit3,
  Eye,
  Info,
  Loader,
  Save,
  Send,
  Tag,
  CalendarCheck,
  CreditCard,
  CircleHelp,
  ArrowDown,
  Minus,
  ArrowUp,
  User,
  Store,
  LayoutList,
  Wrench,
  Flame,
  LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { SupportCategory, SupportPriority } from "@/lib/all-types";
import {
  supportTicketSchema,
  type SupportTicketFormValues,
} from "@/validations/support";
import { SUPPORT_CATEGORIES, SUPPORT_PRIORITIES } from "@/app/account/support/support-filters";

interface CreateTicketDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticket?: SupportTicketFormValues | null;
  provider?: string;
  onSubmit: (payload: SupportTicketFormValues) => void | Promise<void>;
}

interface OptionMeta {
  label: string;
  icon: LucideIcon;
  color: string;
  bg: string;
}

/* Record<...> makes TypeScript fail if a category/priority is missing here. */
const CATEGORY_META: Record<SupportCategory, OptionMeta> = {
  account: {
    label: "Account",
    icon: User,
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-500/15",
  },
  provider_status: {
    label: "Provider status",
    icon: Store,
    color: "text-violet-600 dark:text-violet-400",
    bg: "bg-violet-500/15",
  },
  booking: {
    label: "Booking",
    icon: CalendarCheck,
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-500/15",
  },
  billing: {
    label: "Billing",
    icon: CreditCard,
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-500/15",
  },
  listing: {
    label: "Listing",
    icon: LayoutList,
    color: "text-sky-600 dark:text-sky-400",
    bg: "bg-sky-500/15",
  },
  technical: {
    label: "Technical",
    icon: Wrench,
    color: "text-rose-600 dark:text-rose-400",
    bg: "bg-rose-500/15",
  },
  other: {
    label: "Other",
    icon: CircleHelp,
    color: "text-muted-foreground",
    bg: "bg-muted",
  },
};

const PRIORITY_META: Record<
  SupportPriority,
  OptionMeta & { description: string }
> = {
  low: {
    label: "Low",
    description: "Not time-sensitive",
    icon: ArrowDown,
    color: "text-muted-foreground",
    bg: "bg-muted",
  },
  normal: {
    label: "Normal (default)",
    description: "Standard response time",
    icon: Minus,
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-500/15",
  },
  high: {
    label: "High",
    description: "Affecting your work",
    icon: ArrowUp,
    color: "text-orange-600 dark:text-orange-400",
    bg: "bg-orange-500/15",
  },
  urgent: {
    label: "Urgent",
    description: "Blocking, needs help now",
    icon: Flame,
    color: "text-destructive",
    bg: "bg-destructive/15",
  },
};

const CATEGORY_OPTIONS = SUPPORT_CATEGORIES.map((value) => ({
  value,
  ...CATEGORY_META[value],
}));

const PRIORITY_OPTIONS = SUPPORT_PRIORITIES.map((value) => ({
  value,
  ...PRIORITY_META[value],
}));

const supportTicketDefaults: SupportTicketFormValues = {
  subject: "",
  body: "",
  category: "other",
  priority: "normal",
};

export function CreateTicketDialog({
  open,
  onOpenChange,
  ticket,
  provider,
  onSubmit,
}: CreateTicketDialogProps) {
  const isEdit = Boolean(ticket);
  const [tab, setTab] = useState<"write" | "preview">("write");

  const form = useForm<SupportTicketFormValues>({
    resolver: zodResolver(supportTicketSchema),
    defaultValues: ticket ?? supportTicketDefaults,
    mode: "onSubmit",
  });
  const { isSubmitting, isDirty } = form.formState;

  // Always read the latest `ticket` without re-resetting on every parent render.
  const ticketRef = useRef(ticket);
  useEffect(() => {
    ticketRef.current = ticket;
  });

  // Fresh values each time the dialog opens (blank for create, ticket for edit).
  useEffect(() => {
    if (!open) return;
    form.reset(ticketRef.current ?? supportTicketDefaults);
    setTab("write");
  }, [open, form]);

  const handleOpenChange = (next: boolean) => {
    if (!next && isSubmitting) return;
    onOpenChange(next);
  };

  const submit = async (values: SupportTicketFormValues) => {
    try {
      await onSubmit(values);
      toast.success(isEdit ? "Ticket updated." : "Created Successfully.");
      onOpenChange(false);
    } catch {
      toast.error(
        isEdit
          ? "Something went wrong while saving the ticket. Try again."
          : "Something went wrong while creating the ticket. Try again.",
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit support ticket" : "Create a new support ticket"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the details of this ticket."
              : "Open a ticket directly with our support engineering team."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(submit, (errors) => {
              if (errors.body) setTab("write");
            })}
            className="space-y-5"
            noValidate
          >
            {/* Subject */}
            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel>
                    Title / Subject <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Brief summary of the issue (e.g., Unable to confirm reservation #1234)"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Category + Priority */}
            <div className="flex items-baseline gap-2.5">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => {
                  const selected = CATEGORY_META[field.value];
                  const SelectedIcon = selected.icon;

                  return (
                    <FormItem className="w-full space-y-1">
                      <FormLabel className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Category
                        <Tag className="h-3.5 w-3.5" />
                      </FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue>
                              <span className="flex items-center gap-2">
                                <SelectedIcon
                                  className={cn("size-4", selected.color)}
                                />
                                {selected.label}
                              </span>
                            </SelectValue>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {CATEGORY_OPTIONS.map(
                            ({ value, label, icon: Icon, color, bg }) => (
                              <SelectItem key={value} value={value}>
                                <div className="flex items-center gap-2.5">
                                  <span
                                    className={cn(
                                      "flex size-7 items-center justify-center rounded-md",
                                      bg,
                                    )}
                                  >
                                    <Icon className={cn("size-4", color)} />
                                  </span>
                                  <span className="text-sm font-medium">
                                    {label}
                                  </span>
                                </div>
                              </SelectItem>
                            ),
                          )}
                        </SelectContent>
                      </Select>
                      <Badge variant="secondary" className="font-mono">
                        {field.value}
                      </Badge>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => {
                  const selected = PRIORITY_META[field.value];
                  const SelectedIcon = selected.icon;

                  return (
                    <FormItem className="w-full space-y-1">
                      <FormLabel className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Priority
                        <AlertCircle className="h-3.5 w-3.5" />
                      </FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue>
                              <span className="flex items-center gap-2">
                                <SelectedIcon
                                  className={cn("size-4", selected.color)}
                                />
                                {selected.label}
                              </span>
                            </SelectValue>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {PRIORITY_OPTIONS.map(
                            ({
                              value,
                              label,
                              description,
                              icon: Icon,
                              color,
                              bg,
                            }) => (
                              <SelectItem key={value} value={value}>
                                <div className="flex items-center gap-2.5">
                                  <span
                                    className={cn(
                                      "flex size-7 items-center justify-center rounded-md",
                                      bg,
                                    )}
                                  >
                                    <Icon className={cn("size-4", color)} />
                                  </span>
                                  <div className="flex flex-col gap-0.5">
                                    <span className="text-sm font-medium">
                                      {label}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                      {description}
                                    </span>
                                  </div>
                                </div>
                              </SelectItem>
                            ),
                          )}
                        </SelectContent>
                      </Select>
                      <Badge
                        className={cn(
                          "border-transparent font-mono",
                          selected.bg,
                          selected.color,
                        )}
                      >
                        {field.value}
                      </Badge>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
            </div>

            {/* Description (write / preview) */}
            <FormField
              control={form.control}
              name="body"
              render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel>
                    Description <span className="text-destructive">*</span>
                  </FormLabel>

                  <Tabs
                    value={tab}
                    onValueChange={(v) => setTab(v as "write" | "preview")}
                    className="gap-0 overflow-hidden rounded-md border"
                  >
                    <div className="flex items-center justify-between border-b bg-muted/40 px-2 py-1.5">
                      <TabsList className="h-8">
                        <TabsTrigger value="write" className="gap-1.5 text-xs">
                          <Edit3 className="h-3.5 w-3.5" />
                          Write
                        </TabsTrigger>
                        <TabsTrigger
                          value="preview"
                          className="gap-1.5 text-xs"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Preview
                        </TabsTrigger>
                      </TabsList>
                      <span className="hidden pr-2 text-[11px] text-muted-foreground sm:inline">
                        Compose your message — clean, professional.
                      </span>
                    </div>

                    <TabsContent value="write" className="m-0 p-3">
                      <FormControl>
                        <Textarea
                          rows={8}
                          placeholder="Describe your issue in detail. Include transaction IDs, timestamps, or steps to reproduce..."
                          className="min-h-30 resize-y"
                          {...field}
                        />
                      </FormControl>
                    </TabsContent>

                    <TabsContent value="preview" className="m-0 p-3">
                      <div className="min-h-40 whitespace-pre-wrap rounded-md border bg-background p-3 text-sm">
                        {field.value.trim() ? (
                          field.value
                        ) : (
                          <span className="italic text-muted-foreground">
                            Nothing to preview yet. Switch to Write to describe
                            your issue.
                          </span>
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Provider context alert */}
            {provider && (
              <Alert className="border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-200">
                <Info className="size-4 text-blue-600 dark:text-blue-400" />
                <AlertTitle className="text-sm font-semibold">
                  Provider Role Issue
                </AlertTitle>
                <AlertDescription className="text-xs text-blue-800 dark:text-blue-300">
                  {isEdit
                    ? "This ticket is a provider-related issue associated with your provider account."
                    : "This ticket will be submitted as a provider-related issue and associated with your provider account."}
                </AlertDescription>
              </Alert>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || (isEdit && !isDirty)}
              >
                {isSubmitting ? (
                  <>
                    <Loader className="size-4 animate-spin" />
                    {isEdit ? "Saving…" : "Submitting…"}
                  </>
                ) : isEdit ? (
                  <>
                    <Save className="size-4" />
                    Save changes
                  </>
                ) : (
                  <>
                    <Send className="size-4" />
                    Submit new ticket
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
