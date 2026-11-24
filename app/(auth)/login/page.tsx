import { getAuthSession } from "@/lib/auth-server";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthForm } from "../_components/AuthForm";
import { safeNext } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

type Props = { searchParams: Promise<{ next?: string }> };

export default async function LoginPage({ searchParams }: Props) {
  const next = safeNext((await searchParams).next);

  // Already signed in → no reason to see this page.
  if (await getAuthSession()) redirect(next);

  return <AuthForm mode="login" next={next} />;
}
