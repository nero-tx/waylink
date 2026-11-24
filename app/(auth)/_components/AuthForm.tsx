"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Eye, EyeOff, Github, Loader2 } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";

import { handleSocialAuth, signIn, signUp } from "@/lib/main-auth";

import {
  signInSchema,
  signUpSchema,
  SignInData,
  SignUpData,
} from "@/validations";

type Props = {
  mode: "login" | "signup";
  next: string;
};

export function AuthForm({ mode, next }: Props) {
  const router = useRouter();

  const isLogin = mode === "login";
  const [showPassword, setShowPassword] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isSocial, setIsSocial] = useState(false);

  const busy = isPending || isSocial;

  const switchHref = `${isLogin ? "/signup" : "/login"}${
    next !== "/" ? `?next=${encodeURIComponent(next)}` : ""
  }`;

  const signInForm = useForm<SignInData>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const signUpForm = useForm<SignUpData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  function onSignIn(data: SignInData) {
    startTransition(async () => {
      const res = await signIn(data);

      if (!res?.success) return;

      router.replace(next);
      router.refresh();
    });
  }

  function onSignUp(data: SignUpData) {
    startTransition(async () => {
      const res = await signUp(data);

      if (!res?.success) return;

      router.replace(next);
      router.refresh();
    });
  }

  async function onSocial(provider: "github" | "google") {
    setIsSocial(true);

    await handleSocialAuth(provider, next);
    setIsSocial(false);
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1 text-center">
        <h1 className="text-2xl font-bold tracking-tight">
          {isLogin ? "Welcome back" : "Create your account"}
        </h1>

        <p className="text-sm text-muted-foreground">
          {isLogin
            ? "Sign in to continue to WayLink"
            : "Join WayLink to book and save your favorites"}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Button
          type="button"
          variant="outline"
          disabled={busy}
          onClick={() => onSocial("google")}
        >
          {isSocial ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <img src="/icons/google.svg" alt="Google" className="size-5" />
          )}
          Google
        </Button>

        <Button
          type="button"
          variant="outline"
          disabled={busy}
          onClick={() => onSocial("github")}
        >
          {isSocial ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Github className="size-4" />
          )}
          GitHub
        </Button>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        or continue with email
        <span className="h-px flex-1 bg-border" />
      </div>

      {/* Login Form */}
      {isLogin && (
        <Form {...signInForm}>
          <form
            onSubmit={signInForm.handleSubmit(onSignIn)}
            className="space-y-4"
          >
            <FormField
              control={signInForm.control}
              name="email"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <Label htmlFor="email">Email</Label>

                  <FormControl>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your email"
                      autoComplete="email"
                      disabled={busy}
                      {...field}
                    />
                  </FormControl>

                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={signInForm.control}
              name="password"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <Label htmlFor="password">Password</Label>

                  <div className="relative">
                    <FormControl>
                      <Input
                        id="password"
                        placeholder="enter a password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        className="pr-10"
                        disabled={busy}
                        {...field}
                      />
                    </FormControl>

                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                      className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </button>
                  </div>

                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={busy}>
              {isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                "Sign in"
              )}
            </Button>
          </form>
        </Form>
      )}

      {/* Signup Form */}
      {!isLogin && (
        <Form {...signUpForm}>
          <form
            onSubmit={signUpForm.handleSubmit(onSignUp)}
            className="space-y-4"
          >
            {/* Name */}
            <FormField
              control={signUpForm.control}
              name="name"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <Label htmlFor="name">Name</Label>

                  <FormControl>
                    <Input
                      id="name"
                      placeholder="Enter a name"
                      autoComplete="name"
                      disabled={busy}
                      {...field}
                    />
                  </FormControl>

                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={signUpForm.control}
              name="email"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <Label htmlFor="email">Email</Label>

                  <FormControl>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your email"
                      autoComplete="email"
                      disabled={busy}
                      {...field}
                    />
                  </FormControl>

                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={signUpForm.control}
              name="password"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <Label htmlFor="password">Password</Label>

                  <div className="relative">
                    <FormControl>
                      <Input
                        id="password"
                        placeholder="enter a password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="new-password"
                        className="pr-10"
                        disabled={busy}
                        {...field}
                      />
                    </FormControl>

                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                      className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </button>
                  </div>

                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={busy}>
              {isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                "Create account"
              )}
            </Button>
          </form>
        </Form>
      )}

      <p className="text-center text-sm text-muted-foreground">
        {isLogin ? "Don’t have an account?" : "Already have an account?"}{" "}
        <Link
          href={switchHref}
          className="font-medium text-primary hover:underline"
        >
          {isLogin ? "Sign up" : "Sign in"}
        </Link>
      </p>
    </div>
  );
}
