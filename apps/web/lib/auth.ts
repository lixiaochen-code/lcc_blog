import { redirect } from "next/navigation";
import type { PermissionCode } from "@lcc-blog/shared";
import { auth } from "../auth";

export class AuthorizationError extends Error {
  status: number;

  constructor(message: string, status = 403) {
    super(message);
    this.name = "AuthorizationError";
    this.status = status;
  }
}

export async function getCurrentSession() {
  return auth();
}

export async function requireAuth() {
  const session = await getCurrentSession();

  if (!session?.user?.id) {
    redirect("/login");
  }

  return session;
}

export async function requirePermission(permission: PermissionCode) {
  const session = await requireAuth();

  if (!session.user.permissions.includes(permission)) {
    throw new AuthorizationError(`missing permission: ${permission}`);
  }

  return session;
}

export async function requireApiPermission(permission: PermissionCode) {
  const session = await getCurrentSession();

  if (!session?.user?.id) {
    throw new AuthorizationError("authentication required", 401);
  }

  if (!session.user.permissions.includes(permission)) {
    throw new AuthorizationError(`missing permission: ${permission}`, 403);
  }

  return session;
}
