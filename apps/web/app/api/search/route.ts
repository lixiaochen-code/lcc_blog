import { NextResponse } from "next/server";
import { auth } from "../../../auth";
import { executeSearch } from "../../../lib/search";

export async function GET(request: Request) {
  const session = await auth();
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  const page = Number(searchParams.get("page") ?? "1");
  const pageSize = Number(searchParams.get("pageSize") ?? "10");

  const result = executeSearch({
    query: q,
    page: Number.isFinite(page) ? page : 1,
    pageSize: Number.isFinite(pageSize) ? pageSize : 10,
    session
  });

  return NextResponse.json(result);
}
