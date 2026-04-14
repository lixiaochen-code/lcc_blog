import { documentsRepository } from "@lcc-blog/db/documents";
import { NextResponse } from "next/server";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  try {
    return NextResponse.json(documentsRepository.publishDocument(id, "admin"));
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "publish failed" },
      { status: 404 }
    );
  }
}
