"use client";

import { useMemo, useState, useEffect, useTransition } from "react";
import { Loader2, Plus, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ServiceListItem } from "@/lib/all-types";
import { toast } from "sonner";
import { displayMedia, initials } from "@/lib/helpers";
import Image from "next/image";
import { useWishlistStore } from "@/stores/wishlist.store";
import { cn, generateColor } from "@/lib/utils";
import { useDebounce } from "@/hooks/useDebounce";
import { Skeleton } from "@/components/ui/skeleton";
import { addWishlistItem } from "@/actions/list.action";
import { useWishlists } from "@/hooks/useWishlist";

const MAX_SELECTION = 30;
const baseURL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

export function AddServicesDialog({ listName }: { listName?: string }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [services, setServices] = useState<ServiceListItem[]>([]);

  const [isPending, startTransition] = useTransition();
  const activeListId = useWishlistStore((state) => state.activeWishlistId);
  const items = useWishlistStore((state) => state.items);

  const savedItemIds = items.map((i) => i.itemId);
  const saved = useMemo(() => new Set(savedItemIds), [savedItemIds]);
  const { refresh } = useWishlists();

  const debounce = useDebounce(query);
  const fetchUrl = useMemo(() => {
    const url = new URL(`${baseURL}/api/user/wish-list/list`);
    url.searchParams.set("search", debounce);
    url.searchParams.set("limit", MAX_SELECTION.toString());
    return url;
  }, [debounce]);

  useEffect(() => {
    if (!open) return;
    const abort = new AbortController();

    const fetchServices = async () => {
      setError(null);
      setIsLoading(true);
      try {
        const res = await fetch(fetchUrl.toString(), {
          signal: abort.signal,
        });
        if (!res.ok) {
          setError("Something went wrong. Please try again.");
          return;
        }

        const json = await res.json();
        console.log("Fetched services:", json);
        if (json.status === "success") {
          setServices(json.data);
        } else if (json.status === "empty") {
          setServices([]);
        } else {
          throw new Error(json.message || "Failed to load services.");
        }
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }

        setError(
          error instanceof Error ? error.message : "Failed to load services.",
        );
      } finally {
        if (!abort.signal.aborted) {
          setIsLoading(false);
          setError(
            (prev) => prev || "Failed to load services. Please try again.",
          );
        }
      }
    };

    fetchServices();
    return () => abort.abort();
  }, [open, debounce]);

  function toggle(id: string) {
    setError(null);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else if (next.size < MAX_SELECTION) {
        next.add(id);
      } else {
        setError(`You can add up to ${MAX_SELECTION} items at once`);
      }
      return next;
    });
  }

  function reset() {
    setSelected(new Set());
    setQuery("");
    setError(null);
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) reset();
  }

  async function handleAdd() {
    if (selected.size === 0) return;

    startTransition(async () => {
      if (!activeListId) {
        toast.info("Please select a list to add items to.");
        return;
      }

      setError(null);

      try {
        const itemsKeys = [...selected.keys()];
        const { message, state } = await addWishlistItem({
          wishlistId: activeListId,
          items: itemsKeys,
        });

        if (state === "error") {
          toast.error(message);
          return;
        }

        toast.success(message ?? "Items added successfully");
        setOpen(false);
        refresh();
      } catch {
        setError("Something went wrong. Please try again.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4" />
          Add to list
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            Add services to{" "}
            {listName ? (
              <span
                className="text-orange-500 font-semibold underline"
                style={{ color: generateColor(listName).base }}
              >
                {listName}
              </span>
            ) : (
              "your list"
            )}
          </DialogTitle>
          <DialogDescription>
            Select one or more services to add to this list.
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search services"
            className="pl-9"
          />
        </div>

        <ScrollArea className="max-h-80 rounded-md border">
          {isLoading ? (
            <div className="space-y-1 divide-y">
              {Array.from({ length: 4 }).map((_, i) => (
                <div className="flex items-center gap-3 p-3" key={i}>
                  <Skeleton className="size-4 shrink-0 rounded-sm" />

                  <Skeleton className="size-10 shrink-0 rounded-md" />

                  <div className="min-w-0 flex-1 space-y-2">
                    <Skeleton className="h-4 w-2/5" />

                    <div className="flex items-center gap-2">
                      <Skeleton className="h-3 w-12" />
                      <Skeleton className="size-1 rounded-full" />
                      <Skeleton className="h-3 w-14" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : services.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 p-8 text-center">
              <svg
                viewBox="0 0 80 80"
                fill="none"
                className="size-16 text-muted-foreground/50"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect
                  x="15"
                  y="12"
                  width="42"
                  height="56"
                  rx="6"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <path
                  d="M25 27H47M25 37H43M25 47H38"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <circle
                  cx="55"
                  cy="53"
                  r="10"
                  fill="currentColor"
                  fillOpacity=".12"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <path
                  d="M62 60L69 67"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>

              <div className="space-y-0.5">
                <p className="text-base font-semibold">No services found</p>
                <p className="text-sm text-muted-foreground">
                  Try adjusting your search or filters.
                </p>
              </div>
            </div>
          ) : (
            <ul className="divide-y">
              {services.map((service) => {
                const isSaved = saved.has(service.id);
                const isChecked = selected.has(service.id);
                const { cover } = displayMedia(service.media ?? []);
                const co = generateColor(service.title);

                return (
                  <li key={service.id}>
                    <label
                      className={cn(
                        "group flex items-center gap-3 p-3 transition-colors",
                        isSaved
                          ? "cursor-not-allowed opacity-50"
                          : "cursor-pointer hover:bg-muted/50",
                        isChecked && "bg-emerald-500/10 hover:bg-emerald-500/15",
                      )}
                    >
                      <Checkbox
                        checked={isSaved || isChecked}
                        disabled={isSaved || isPending}
                        onCheckedChange={() => toggle(service.id)}
                        aria-label={`Select ${service.title}`}
                      />

                      {cover ? (
                        <Image
                          width={40}
                          height={40}
                          src={cover}
                          alt="thumbnail"
                          className="h-10 w-10 shrink-0 rounded-md object-cover"
                        />
                      ) : (
                        <div
                          className="h-10 w-10 shrink-0 rounded-md bg-muted grid place-items-center"
                          style={{
                            backgroundColor: co.alpha(0.2),
                            color: co.base,
                          }}
                        >
                          {initials(service.title)}
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-base font-medium">
                          {service.title}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="capitalize">{service.type}</span>

                          <span className="size-1 rounded-full bg-muted-foreground/40" />

                          <span className="capitalize text-foreground font-medium">
                            {service.status}
                          </span>
                        </div>
                      </div>

                      {isSaved && <Badge variant="secondary">Saved</Badge>}
                    </label>
                  </li>
                );
              })}
            </ul>
          )}
        </ScrollArea>

        <div className="p-2 rounded-md bg-destructive/10">
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter className="flex-row items-center justify-between sm:justify-between">
          <span className="text-sm text-muted-foreground">
            {selected.size} selected{" "}
          </span>
          <div className="flex gap-2">
            {selected.size !== 0 && (
              <Button
                variant="outline"
                disabled={selected.size === 0 || isPending}
                onClick={() => setSelected(new Set())}
              >
                <X className="size-4" />
                Cancel
              </Button>
            )}
            <Button
              onClick={handleAdd}
              disabled={selected.size === 0 || isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="size-4" />
                  Add to list
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
