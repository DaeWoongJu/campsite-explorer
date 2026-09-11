import { createHash } from "crypto";

export const ADMIN_COOKIE = "admin_session";

function expectedToken(): string | null {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return null;
  return createHash("sha256").update(password).digest("hex");
}

export function checkPassword(input: string): boolean {
  const expected = expectedToken();
  return expected !== null && input === process.env.ADMIN_PASSWORD;
}

export function sessionToken(): string | null {
  return expectedToken();
}

export function isValidSession(cookieValue: string | undefined): boolean {
  const expected = expectedToken();
  return expected !== null && cookieValue === expected;
}
