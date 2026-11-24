import { getAuthSession } from "@/lib/auth-server";
import { safeNext } from "@/lib/utils";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import React from "react";
import { AuthForm } from "../_components/AuthForm";

export const metadata: Metadata = {
  title: "Create account",
  robots: { index: false, follow: false },
};

type Props = { searchParams: Promise<{ next?: string }> };

export default async function SignUpPage({ searchParams }: Props) {
  const next = safeNext((await searchParams).next);

  if (await getAuthSession()) redirect(next);

  return <AuthForm mode="signup" next={next} />;
}
