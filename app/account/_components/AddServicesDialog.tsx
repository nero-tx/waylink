"use client";

import { useMemo, useState } from "react";
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

const MAX_SELECTION = 30;

const dummy: ServiceListItem[] = [
  {
    id: "3f9c1a2e-5b7d-4e8f-9a1b-0c2d3e4f5a61",
    type: "experience",
    title: "Sunset Desert Safari in Siwa",
    slug: "siwa-sunset-desert-safari",
    status: "active",
  },
  {
    id: "3f9c1a2e-5b7d-4e8f-9a1b-0c2d3e4f5a62",
    type: "experience",
    title: "Cave Swimming at Cleopatra's Pool",
    slug: "siwa-cleopatra-pool",
    status: "active",
  },
  {
    id: "3f9c1a2e-5b7d-4e8f-9a1b-0c2d3e4f5a63",
    type: "transport",
    title: "Private Transfer: Cairo to Siwa",
    slug: "cairo-siwa-private-transfer",
    status: "active",
  },
  {
    id: "3f9c1a2e-5b7d-4e8f-9a1b-0c2d3e4f5a64",
    type: "transport",
    title: "4x4 Jeep Rental (Full Day)",
    slug: "jeep-rental-full-day",
    status: "active",
  },
  {
    id: "3f9c1a2e-5b7d-4e8f-9a1b-0c2d3e4f5a65",
    type: "experience",
    title: "Eco Lodge with Mud-Brick Rooms",
    slug: "siwa-eco-lodge",
    status: "active",
  },
  {
    id: "3f9c1a2e-5b7d-4e8f-9a1b-0c2d3e4f5a66",
    type: "transport",
    title: "Luxury Oasis Resort",
    slug: "siwa-oasis-resort",
    status: "active",
  },
  {
    id: "3f9c1a2e-5b7d-4e8f-9a1b-0c2d3e4f5a67",
    type: "experience",
    title: "Old Town Walking Tour (Coming Soon)",
    slug: "siwa-old-town-tour",
    status: "draft", // hidden in the dialog
  },
  {
    id: "3f9c1a2e-5b7d-4e8f-9a1b-0c2d3e4f5a68",
    type: "transport",
    title: "Airport Shuttle (Paused)",
    slug: "airport-shuttle",
    status: "paused", // hidden in the dialog
  },
];

export function AddServicesDialog({
  listName,
}: {
  listName?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [services, setServices] = useState<ServiceListItem[]>(dummy);

  const activeListId = useWishlistStore((state) => state.activeWishlistId);
  const items = useWishlistStore((state) => state.items);

  const savedItemIds = items.map((i) => i.id);
  const saved = useMemo(() => new Set(savedItemIds), [savedItemIds]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return services.filter(
      (s) =>
        s.status === "active" &&
        (q === "" || s.title.toLowerCase().includes(q)),
    );
  }, [services, query]);

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

    setIsPending(true);
    setError(null);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Items added successfully");
      setOpen(false);
      reset();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsPending(false);
    }
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
          {visible.length === 0 ? (
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
              {visible.map((service) => {
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
                          ? "cursor-not-allowed opacity-60"
                          : "cursor-pointer hover:bg-muted/50",
                        isChecked && "bg-primary/5",
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

        {error && <p className="text-sm text-destructive">{error}</p>}

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
