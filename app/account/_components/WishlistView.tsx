"use client";

import { memo, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUpRight,
  Heart,
  MoreHorizontal,
  Pencil,
  Plane,
  Sparkles,
  Star,
  StickyNote,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { ServiceType, WishlistItem } from "@/lib/all-types";
import { displayMedia } from "@/lib/helpers";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";

const TYPE_ICON = {
  experience: Sparkles,
  transport: Plane,
} as const;

const MAX_NOTE_LENGTH = 200;

const TYPE_CONFIG: Record<ServiceType, { label: string; color: string }> = {
  experience: {
    label: "experience",
    color: "#e8734a",
  },
  transport: {
    label: "transport",
    color: "#5b8cf5",
  },
};

type ItemType = WishlistItem["itemType"];
type Filter = "all" | ItemType;

const FILTER_LABEL: Record<Filter, string> = {
  all: "All",
  experience: "Experiences",
  transport: "Transport",
};

interface WishlistListProps {
  items: WishlistItem[];
  onRemove: (id: string) => void;
  onEditNote: (id: string, note: string) => void | Promise<void>;
}

const detailsHref = (item: WishlistItem) =>
  item.itemType === "experience"
    ? `/experiences/${item.itemId}`
    : `/transport/${item.itemId}`;

export const WishlistRow = memo(function WishlistRow({
  item,
  onEdit,
  onRemove,
}: {
  item: WishlistItem;
  onEdit: (item: WishlistItem) => void;
  onRemove: (id: string) => void;
}) {
  const tc = TYPE_CONFIG[item.itemType];
  const Icon = TYPE_ICON[item.itemType];
  const { cover } = displayMedia(item.media);
  const href = detailsHref(item);

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -12, transition: { duration: 0.15 } }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="group flex items-start gap-3 rounded-2xl border border-border bg-card p-3 transition-colors hover:border-foreground/15 hover:bg-accent/20 sm:gap-4 sm:p-4"
    >
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl sm:h-20 sm:w-20">
        {cover ? (
          <Image
            src={cover}
            alt={item.title}
            width={100}
            height={100}
            className="object-cover size-full"
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center"
            style={{ backgroundColor: `${tc.color}1A` }}
          >
            <Icon className="h-6 w-6" style={{ color: tc.color }} />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <Link
          href={href}
          className="block truncate text-sm font-semibold text-foreground underline-offset-4 hover:underline sm:text-base"
        >
          {item.title}
        </Link>

        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <Badge
            variant="outline"
            className="px-1.5 py-0 text-[10px] uppercase tracking-wide"
            style={{ color: tc.color, borderColor: `${tc.color}40` }}
          >
            {tc.label}
          </Badge>
          <span className="flex items-center gap-1 sm:hidden">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            {item.avgRate.toFixed(1)}
          </span>
        </div>

        <button
          type="button"
          onClick={() => onEdit(item)}
          className={cn(
            "mt-2 flex w-full min-w-0 items-start gap-1.5 rounded-md border border-transparent p-2 text-left text-xs transition-colors cursor-pointer",
            item.notes
              ? "text-muted-foreground hover:border-border hover:text-foreground"
              : "text-muted-foreground/60 hover:text-muted-foreground",
          )}
        >
          <StickyNote className="h-3 w-3 shrink-0" />
          <span className={cn("line-clamp-2", item.notes && "italic")}>
            {item.notes || "Add a note"}
          </span>
        </button>
      </div>

      {/* Stats (desktop only) */}
      <div className="hidden shrink-0 items-center gap-6 sm:flex">
        <div className="flex flex-col items-center">
          <span className="flex items-center gap-1 text-sm font-semibold text-foreground">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            {item.avgRate.toFixed(1)}
          </span>
          <span className="text-xs text-muted-foreground">
            {item.reviews} reviews
          </span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-sm font-semibold text-foreground">
            {item.bookings}
          </span>
          <span className="text-xs text-muted-foreground">booked</span>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <Button
          asChild
          variant="outline"
          size="sm"
          className="hidden md:inline-flex"
        >
          <Link href={href}>
            View
            <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
          </Link>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full"
              aria-label="More actions"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
              {item.bookings} booked · {item.reviews} reviews ·
              <span className="text-amber-500">
                ★ {item.avgRate.toFixed(1)}
              </span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />

            <DropdownMenuItem asChild>
              <Link href={href} className="cursor-pointer">
                <ArrowUpRight className="h-4 w-4" />
                View details
              </Link>
            </DropdownMenuItem>

            <DropdownMenuItem
              onSelect={() => onEdit(item)}
              className="cursor-pointer"
            >
              <Pencil className="h-4 w-4" />
              {item.notes ? "Edit note" : "Add note"}
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onSelect={() => onRemove(item.id)}
              className="cursor-pointer text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
              Remove
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.li>
  );
});

export function WishlistView({
  items,
  onRemove,
  onEditNote,
}: WishlistListProps) {
  const [filter, setFilter] = useState<Filter>("all");
  const [editing, setEditing] = useState<WishlistItem | null>(null);

  const counts = useMemo(
    () => ({
      all: items.length,
      experience: items.filter((i) => i.itemType === "experience").length,
      transport: items.filter((i) => i.itemType === "transport").length,
    }),
    [items],
  );

  const visible = useMemo(
    () =>
      filter === "all" ? items : items.filter((i) => i.itemType === filter),
    [items, filter],
  );

  return (
    <div className="flex flex-col gap-4">
      <div
        role="group"
        aria-label="Filter wishlist items"
        className="-mx-1 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <ToggleGroup
          type="single"
          value={filter}
          onValueChange={(value) => {
            if (value) setFilter(value as Filter);
          }}
          className="w-max justify-start gap-2"
        >
          {(Object.keys(FILTER_LABEL) as Filter[]).map((key) => {
            const active = filter === key;

            return (
              <ToggleGroupItem
                key={key}
                value={key}
                aria-label={FILTER_LABEL[key]}
                className={cn(
                  "h-10 shrink-0 gap-2 rounded-full border px-4 text-sm font-medium transition-all duration-200",
                  "data-[state=on]:border-foreground data-[state=on]:bg-foreground data-[state=on]:text-background data-[state=on]:shadow-sm",
                  "data-[state=off]:border-border data-[state=off]:bg-card data-[state=off]:text-muted-foreground data-[state=off]:hover:border-foreground/30 data-[state=off]:hover:text-foreground",
                )}
              >
                {FILTER_LABEL[key]}

                <Badge
                  variant="secondary"
                  className={cn(
                    "min-w-5 justify-center rounded-full px-1.5 text-xs tabular-nums",
                    active
                      ? "bg-background/20 text-background"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {counts[key]}
                </Badge>
              </ToggleGroupItem>
            );
          })}
        </ToggleGroup>
      </div>

      {visible.length === 0 ? (
        <EmptyState filter={filter} />
      ) : (
        <motion.ul layout className="space-y-2">
          <AnimatePresence mode="popLayout">
            {visible.map((item) => (
              <WishlistRow
                key={item.id}
                item={item}
                onEdit={setEditing}
                onRemove={onRemove}
              />
            ))}
          </AnimatePresence>
        </motion.ul>
      )}

      <EditNoteDialog
        key={editing?.id ?? "closed"}
        item={editing}
        onOpenChange={(open) => !open && setEditing(null)}
        onSave={onEditNote}
      />
    </div>
  );
}

function EmptyState({ filter }: { filter: Filter }) {
  const isAll = filter === "all";

  return (
    <div className="relative flex flex-col items-center overflow-hidden rounded-2xl border border-border px-6 py-16 text-center">
      <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-primary/4 via-transparent to-transparent" />

      <div className="relative mb-5 flex size-16 items-center justify-center rounded-2xl border border-border/60 bg-linear-to-br from-primary/10 via-accent/30 to-transparent shadow-sm">
        <Heart className="size-7 text-primary/80" strokeWidth={1.5} />
        <span className="absolute -right-1 -top-1 size-3 rounded-full border-2 border-card bg-primary/60" />
      </div>

      <div className="relative max-w-sm space-y-2">
        <h3 className="text-lg font-semibold tracking-tight text-foreground">
          {isAll
            ? "Your wishlist is waiting"
            : `No ${FILTER_LABEL[filter].toLowerCase()} saved`}
        </h3>

        <p className="text-sm leading-relaxed text-muted-foreground">
          {isAll
            ? "Collect the experiences you love. Your saved services will find their home here."
            : "Nothing in this category just yet. Explore another filter to find your saved items."}
        </p>
      </div>

      <div className="relative mt-7 flex items-center gap-2">
        <span className="h-px w-8 bg-border" />
        <span className="size-1 rounded-full bg-primary/40" />
        <span className="h-px w-8 bg-border" />
      </div>
    </div>
  );
}

function EditNoteDialog({
  item,
  onOpenChange,
  onSave,
}: {
  item: WishlistItem | null;
  onOpenChange: (open: boolean) => void;
  onSave: (id: string, note: string) => void | Promise<void>;
}) {
  const [draft, setDraft] = useState(item?.notes ?? "");
  const [mode, setMode] = useState<"read" | "edit">(
    item?.notes ? "read" : "edit",
  );
  const [saving, setSaving] = useState(false);
  const [len, setlen] = useState<number>(0);

  // Reset when opening another item
  useEffect(() => {
    setDraft(item?.notes ?? "");
    setMode(item?.notes ? "read" : "edit");
  }, [item?.id]);

  useEffect(() => {
    setlen(draft.length);
  }, [draft]);

  const handleSave = async () => {
    if (!item || saving) return;

    const trimmed = draft.trim();

    if (trimmed !== (item.notes ?? "")) {
      setSaving(true);

      try {
        await onSave(item.id, trimmed);
      } catch {
        return;
      } finally {
        setSaving(false);
      }
    }

    onOpenChange(false);
  };

  const handleCancelEdit = () => {
    setDraft(item?.notes ?? "");

    if (item?.notes) {
      setMode("read");
    } else {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={!!item} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <StickyNote className="size-4 text-muted-foreground" />
            {mode === "read" ? "Note" : "Edit note"}
          </DialogTitle>

          <DialogDescription className="truncate">
            {item?.title}
          </DialogDescription>
        </DialogHeader>

        {mode === "read" ? (
          <div className="space-y-3">
            <ScrollArea className="h-30 rounded-lg border bg-muted/20">
              <div className="p-4">
                <p className="whitespace-pre-wrap wrap-break-word text-sm leading-relaxed text-foreground">
                  {item?.notes}
                </p>
              </div>
            </ScrollArea>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>

              <Button onClick={() => setMode("edit")}>
                <Pencil className="size-4" />
                Edit
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <>
            <div className="grid gap-2">
              <Label htmlFor="wishlist-note">Note</Label>

              <Textarea
                id="wishlist-note"
                autoFocus
                value={draft}
                placeholder="Write your note..."
                onChange={(e) => setDraft(e.target.value)}
                className="min-h-35 resize-y"
                maxLength={MAX_NOTE_LENGTH}
              />

              <p
                className={cn(
                  "text-sm transition-colors",
                  len >= MAX_NOTE_LENGTH
                    ? "text-destructive"
                    : len >= MAX_NOTE_LENGTH * 0.85
                      ? "text-amber-600 dark:text-amber-500"
                      : "text-muted-foreground",
                )}
              >
                {len > 0
                  ? `${len} / ${MAX_NOTE_LENGTH} characters used`
                  : "Add details, reminders, or anything you want to remember."}
              </p>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={handleCancelEdit}
                disabled={saving}
              >
                Cancel
              </Button>

              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Saving…" : "Save"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
export function ViewSkeleton() {
  return (
    <div
      className="flex flex-col gap-4"
      aria-busy="true"
      aria-label="Loading wishlist"
    >
      <div className="flex items-center gap-2 overflow-hidden pb-1">
        {["w-20", "w-28", "w-24"].map((w, i) => (
          <Skeleton key={i} className={cn("h-10 shrink-0 rounded-lg", w)} />
        ))}
      </div>

      <ul className="flex flex-col gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <li
            key={i}
            className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 sm:gap-4 sm:p-4"
          >
            <Skeleton className="h-16 w-16 shrink-0 rounded-xl sm:h-20 sm:w-20" />

            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <Skeleton className="h-4 w-3/4 sm:h-5" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-20 rounded-full" />
                <Skeleton className="h-3 w-8 sm:hidden" />
              </div>
              <Skeleton className="mt-1 h-3 w-40 max-w-full" />
            </div>

            <div className="hidden shrink-0 items-center gap-6 sm:flex">
              <div className="flex flex-col items-end gap-1.5">
                <Skeleton className="h-4 w-10" />
                <Skeleton className="h-3 w-16" />
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <Skeleton className="h-4 w-6" />
                <Skeleton className="h-3 w-10" />
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-1">
              <Skeleton className="hidden h-8 w-20 rounded-full md:block" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
