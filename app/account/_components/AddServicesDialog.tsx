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
import { displayMedia } from "@/lib/helpers";
import Image from "next/image";

const MAX_SELECTION = 50;

type Props = {
  wishlistId: string;
  services: ServiceListItem[];
  savedItemIds?: string[];
};

export function AddServicesDialog({
  wishlistId,
  services,
  savedItemIds = [],
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

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
          <DialogTitle>Add services</DialogTitle>
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

        <ScrollArea className="h-80 rounded-md border">
          {visible.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">
              No services found
            </p>
          ) : (
            <ul className="divide-y">
              {visible.map((service) => {
                const isSaved = saved.has(service.id);
                const isChecked = selected.has(service.id);
                const { cover } = displayMedia(service.media ?? []);

                return (
                  <li key={service.id}>
                    <label
                      className={`flex items-center gap-3 p-3 ${
                        isSaved
                          ? "cursor-not-allowed opacity-60"
                          : "cursor-pointer hover:bg-muted/50"
                      }`}
                    >
                      <Checkbox
                        checked={isSaved || isChecked}
                        disabled={isSaved || isPending}
                        onCheckedChange={() => toggle(service.id)}
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
                        <div className="h-10 w-10 shrink-0 rounded-md bg-muted" />
                      )}

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {service.title}
                        </p>
                        <p className="text-xs capitalize text-muted-foreground">
                          {service.type} .{" "}
                          <span className="text-foreground font-medium">
                            {service.status}
                          </span>
                        </p>
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
            <Button
              variant="outline"
              disabled={selected.size === 0 || isPending}
              onClick={() => setSelected(new Set())}
            >
              <X className="size-4" />
              Cancel
            </Button>
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
