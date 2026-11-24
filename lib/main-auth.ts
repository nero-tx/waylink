import { toast } from "sonner";
import { authClient } from "./auth-client";
import {
  SignInData,
  signInSchema,
  SignUpData,
  signUpSchema,
} from "@/validations";
import { getReturnPath } from "./utils";

const errorMessage = (error: unknown) =>
  error instanceof Error
    ? error.message
    : "Something went wrong. Please try again.";

export async function handleSocialAuth(
  provider: "github" | "google",
  returnTo: string = getReturnPath(),
) {
  try {
    const res = await authClient.signIn.social({
      provider,
      callbackURL: returnTo,
      errorCallbackURL: returnTo,
    });

    if (res?.error) {
      toast.error(res.error.message || `Failed to sign in with ${provider}`);
      return;
    }

    toast.success("Loged in successfully ,Welcome back!");
  } catch (error) {
    toast.error(errorMessage(error));
  }
}

export async function signIn(signData: SignInData) {
  const validation = signInSchema.safeParse(signData);
  if (!validation.success) {
    const firstError = validation.error.issues[0];
    throw new Error(firstError.message);
  }
  const { email, password } = validation.data;

  try {
    const res = await authClient.signIn.email({
      email,
      password,
      callbackURL: "/account",
      rememberMe: true,
    });
    if (res?.error)
      throw new Error(
        res.error.message || "Failed to sign in. Please try again.",
      );

    toast.success("Signed in successfully!");
    return { success: true };
  } catch (error) {
    toast.error(errorMessage(error));
    return { success: false };
  }
}

export async function signUp(signUp: SignUpData) {
  try {
    const validation = signUpSchema.safeParse(signUp);
    if (!validation.success) {
      const firstError = validation.error.issues[0];
      throw new Error(firstError.message);
    }

    const { email, password, name } = validation.data;

    const res = await authClient.signUp.email({
      email,
      name,
      password,
      callbackURL: "/account",
    });
    if (res?.error)
      throw new Error(
        res.error.message || "Failed to create account. Please try again.",
      );

    toast.success("Account created successfully! Welcome aboard!");

    return { success: true };
  } catch (error) {
    toast.error(errorMessage(error));
    return { success: false };
  }
}
