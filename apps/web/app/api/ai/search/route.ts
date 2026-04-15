import { NextResponse } from "next/server";
import { AuthorizationError, requireApiPermission } from "../../../../lib/auth";

export async function POST(request: Request) {
  try {
    await requireApiPermission("ai.search");

    const body = (await request.json()) as { query?: string };

    return NextResponse.json({
      mode: "search",
      query: body.query ?? "",
      items: [],
      message: "AI search placeholder guarded by RBAC"
    });
  } catch (error) {
    const status = error instanceof AuthorizationError ? error.status : 500;
    const message =
      error instanceof Error ? error.message : "ai search request failed";

    return NextResponse.json({ message }, { status });
  }
}
