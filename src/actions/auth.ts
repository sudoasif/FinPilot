"use server";

import { redirect } from "next/navigation";
import {
  createSession,
  destroySession,
  validateCredentials,
} from "@/lib/session";
import type { ActionState } from "@/types";

export async function loginAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  if (!validateCredentials(email, password)) {
    return {
      ok: false,
      message: "That email or password does not match the demo account.",
    };
  }

  await createSession();
  redirect("/dashboard");
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}
