import { NextResponse } from "next/server";
import type { AiSearchMode } from "@lcc-blog/db/ai-search";
import { auth } from "../../../../auth";
import { executeAiSearch } from "../../../../lib/ai-search";
import { AuthorizationError } from "../../../../lib/auth";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      query?: string;
      mode?: AiSearchMode;
      topK?: number;
    };
    const mode: AiSearchMode =
      body.mode === "ask" || body.mode === "summarize" ? body.mode : "search";
    const session = await auth();

    const result = await executeAiSearch({
      session,
      query: body.query ?? "",
      mode,
      topK: typeof body.topK === "number" ? body.topK : undefined
    });

    return NextResponse.json(result);
  } catch (error) {
    const status =
      error instanceof AuthorizationError
        ? error.status
        : error instanceof Error
          ? 400
          : 500;
    const message =
      error instanceof Error ? error.message : "ai search request failed";

    return NextResponse.json({ message }, { status });
  }
}
