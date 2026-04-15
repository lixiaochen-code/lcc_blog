import type { Session } from "next-auth";
import {
  runAiSearch,
  type AiSearchMode,
  type AiSearchResponse
} from "@lcc-blog/db/ai-search";
import { AuthorizationError } from "./auth";

export function resolveAiSearchPermission(mode: AiSearchMode) {
  switch (mode) {
    case "ask":
      return "ai.ask" as const;
    case "summarize":
      return "ai.summarize" as const;
    case "search":
    default:
      return "ai.search" as const;
  }
}

export function resolveAiSearchAccess(session: Session | null | undefined) {
  if (
    session?.user?.roles.includes("admin") ||
    session?.user?.roles.includes("super_admin")
  ) {
    return "admin" as const;
  }

  return "member" as const;
}

export function assertAiSearchPermission(
  session: Session | null | undefined,
  mode: AiSearchMode
) {
  if (!session?.user?.id) {
    throw new AuthorizationError("authentication required", 401);
  }

  const permission = resolveAiSearchPermission(mode);

  if (!session.user.permissions.includes(permission)) {
    throw new AuthorizationError(`missing permission: ${permission}`, 403);
  }

  return session;
}

export async function executeAiSearch(input: {
  session: Session | null | undefined;
  query: string;
  mode: AiSearchMode;
  topK?: number;
}): Promise<AiSearchResponse> {
  const session = assertAiSearchPermission(input.session, input.mode);

  return runAiSearch({
    query: input.query,
    mode: input.mode,
    topK: input.topK,
    access: resolveAiSearchAccess(session),
    userId: session.user.id
  });
}
