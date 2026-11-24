"use client";

import Link from "next/link";
import Image from "next/image";
import React, { useState, useEffect, useRef, useTransition } from "react";
import { motion, Variants } from "framer-motion";
import {
  Menu,
  X,
  UserPlus,
  Loader,
  LogOut,
  User,
  Bell,
  BookMarked,
  Heart,
  Headset,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./ThemeToggle";
import { useClickOutside } from "@/hooks/useClickOut";
import { useActive } from "@/hooks/useActive";
import { selectIsAuthenticated, useAuthStore } from "@/stores/auth.store";
import { useLogout } from "./providers/AuthProvider";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { initials } from "@/lib/helpers";

const navLinks = [
  { title: "Explore", href: "/", exact: true },
  { title: "Transports", href: "/transport" },
  { title: "Experiences", href: "/experiences" },
  { title: "Most Rating", href: "/most-rating" },
  { title: "Providers", href: "/providers" },
];

const dropMenu = [
  { title: "Account", icon: User, href: "/account", color: "text-blue-500" },
  {
    title: "Notifications",
    icon: Bell,
    href: "/account/notifications",
    color: "text-amber-400",
  },
  {
    title: "My Bookings",
    icon: BookMarked,
    href: "/account/bookings",
    color: "text-green-500",
  },
  {
    title: "My List",
    icon: Heart,
    href: "/account/wish-list",
    color: "text-red-500",
  },
  {
    title: "Support",
    icon: Headset,
    href: "/account/support",
    color: "text-blue-500",
  },
];

const menuVariants: Variants = {
  hidden: { opacity: 0, y: -20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { staggerChildren: 0.1, ease: [0.16, 1, 0.3, 1] },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: -10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] },
  },
};

function UserAvatar({ name, image }: { name: string; image?: string | null }) {
  return (
    <Avatar className="h-9 w-9">
      <AvatarImage src={image || undefined} alt={name} />
      <AvatarFallback className="bg-linear-to-br from-orange-500 to-purple-600 text-white text-sm font-semibold">
        {initials(name)}
      </AvatarFallback>
    </Avatar>
  );
}

function UserMenu() {
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();
  const isActive = useActive();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (!user) return null;

  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault(); // keep the dialog open (with spinner) until logout finishes
    startTransition(async () => {
      await logout();
      setConfirmOpen(false);
    });
  };

  return (
    <>
      <AlertDialog
        open={confirmOpen}
        onOpenChange={(open) => !isPending && setConfirmOpen(open)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-semibold text-destructive tracking-tight">
              Sign out of your account?
            </AlertDialogTitle>

            <AlertDialogDescription className="text-sm leading-relaxed">
              You’re about to sign out of your current session. You’ll need to
              sign in again to access your account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>
              <X className="h-4 w-4" />
              Cancel
            </AlertDialogCancel>

            <AlertDialogAction
              onClick={handleLogout}
              disabled={isPending}
              variant="destructive"
            >
              {isPending ? (
                <span className="flex items-center gap-2">
                  <Loader className="h-4 w-4 animate-spin" />
                  Logging out...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <LogOut className="h-4 w-4" />
                  Logout
                </span>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            aria-label="Open user menu"
            className="rounded-full cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <UserAvatar name={user.name} image={user.image} />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-56 rounded-xl">
          <DropdownMenuLabel className="font-normal flex items-center gap-2">
            <UserAvatar name={user.name} image={user.image} />
            <div className="flex min-w-0 flex-col">
              <p className="truncate text-sm font-medium">{user.name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {user.email}
              </p>
            </div>
          </DropdownMenuLabel>

          <DropdownMenuSeparator />

          {dropMenu.map((l) => (
            <DropdownMenuItem asChild key={l.href}>
              <Link
                href={l.href}
                className={cn(
                  "flex items-center gap-2 cursor-pointer font-medium text-muted-foreground",
                  isActive(l.href, true) && "bg-accent",
                )}
              >
                <l.icon className={cn("h-4 w-4", l.color)} />
                {l.title}
              </Link>
            </DropdownMenuItem>
          ))}

          <DropdownMenuSeparator />

          <DropdownMenuItem
            className="cursor-pointer"
            onSelect={() => setConfirmOpen(true)}
            variant="destructive"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}

// Right-side auth slot: skeleton while loading, Sign In, or the user menu.
function AuthControls() {
  const loading = useAuthStore((s) => s.loading);
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const openModal = useAuthStore((s) => s.openModal);

  // Reserves the avatar's space so the navbar doesn't jump when the session resolves.
  if (loading) {
    return (
      <div
        className="h-9 w-9 animate-pulse rounded-full bg-muted"
        aria-hidden
      />
    );
  }

  if (!isAuthenticated) {
    return (
      <Button
        onClick={openModal}
        className="hidden md:inline-flex bg-blue-600 text-white shadow-sm shadow-blue-600/20 hover:bg-blue-500 hover:shadow-md hover:shadow-blue-500/25"
      >
        <UserPlus className="h-4 w-4" />
        Sign In
      </Button>
    );
  }

  return <UserMenu />;
}

function MobileSignIn({ onDone }: { onDone: () => void }) {
  const loading = useAuthStore((s) => s.loading);
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const openModal = useAuthStore((s) => s.openModal);

  if (loading || isAuthenticated) return null;

  return (
    <div className="px-2 mt-3">
      <Button
        variant="outline"
        className="w-full"
        onClick={() => {
          onDone(); // close the mobile menu, then open the modal
          openModal();
        }}
      >
        <UserPlus className="h-4 w-4" />
        Sign In
      </Button>
    </div>
  );
}

export default function HeaderNavbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const isActive = useActive();

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 50);
    onScroll(); // correct state if the page loads already scrolled
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useClickOutside(menuRef, () => setMenuOpen(false), [toggleRef]);

  return (
    <header>
      <nav
        data-state={menuOpen ? "active" : "inactive"}
        className="fixed z-9999 w-full px-2"
      >
        <div
          className={cn(
            "mx-auto mt-2 container px-6 transition-all duration-300 lg:px-12",
            isScrolled &&
              "bg-background/50 max-w-6xl rounded-2xl border backdrop-blur-md lg:px-5",
          )}
        >
          <div className="relative flex items-center justify-between gap-6 py-3 lg:gap-0 lg:py-4">
            <Link
              href="/"
              className="flex items-center space-x-2 z-50 shrink-0 select-none"
            >
              <Image
                src="/icons/waylink.svg"
                alt="waylink"
                width={40}
                height={40}
                priority
              />
              <span className="font-bold text-xl">
                <span className="text-orange-2">Way</span>
                <span className="text-blue-10">Link</span>
              </span>
            </Link>

            <motion.ul
              className="hidden md:flex gap-2.5 text-sm font-medium items-center"
              initial="hidden"
              animate="visible"
              variants={menuVariants}
            >
              {navLinks.map((link) => {
                const active = isActive(link.href, link.exact);
                return (
                  <motion.li key={link.href} variants={itemVariants}>
                    <Link
                      href={link.href}
                      className={cn(
                        "relative px-3 py-1.5 text-sm font-medium rounded-lg transition-all",
                        "text-muted-foreground hover:text-foreground hover:bg-accent/50",
                        active && "text-primary bg-accent/80 hover:bg-accent",
                      )}
                    >
                      {link.title}
                      {active && (
                        <span className="absolute left-1/2 -bottom-0.5 h-0.5 w-5 -translate-x-1/2 rounded-full bg-primary" />
                      )}
                    </Link>
                  </motion.li>
                );
              })}
            </motion.ul>

            <div className="flex items-center gap-2 z-50">
              <ThemeToggle />
              <AuthControls />

              <Button
                variant="outline"
                size="icon"
                className="md:hidden"
                aria-label={menuOpen ? "Close menu" : "Open menu"}
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((o) => !o)}
                ref={toggleRef}
              >
                {menuOpen ? <X size={20} /> : <Menu size={20} />}
              </Button>
            </div>

            {/* Mobile Nav */}
            {menuOpen && (
              <motion.div
                ref={menuRef}
                className="md:hidden top-full border-t p-3 space-y-1.5 shadow-md rounded-lg absolute w-full left-1/2 -translate-x-1/2 border border-muted bg-background"
                initial="hidden"
                animate="visible"
                variants={menuVariants}
              >
                {navLinks.map((link) => (
                  <motion.div
                    key={link.href}
                    variants={itemVariants}
                    className="mb-2 last:mb-0"
                  >
                    <Link
                      href={link.href}
                      onClick={() => setMenuOpen(false)}
                      className={cn(
                        "block rounded-lg px-4 py-2 text-sm font-medium transition-all duration-500",
                        isActive(link.href, link.exact)
                          ? "bg-blue-10 dark:bg-blue-20 text-white"
                          : "hover:bg-accent",
                      )}
                    >
                      {link.title}
                    </Link>
                  </motion.div>
                ))}
                <MobileSignIn onDone={() => setMenuOpen(false)} />
              </motion.div>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}
