import { tagsRepository } from "@lcc-blog/db/tags";
import { NextResponse } from "next/server";
import { AuthorizationError, requireApiPermission } from "../../../lib/auth";

export async function GET() {
  try {
    await requireApiPermission("tag.read");
    return NextResponse.json({ items: tagsRepository.listTags() });
  } catch (error) {
    const status = error instanceof AuthorizationError ? error.status : 500;
    const message =
      error instanceof Error ? error.message : "tags request failed";

    return NextResponse.json({ message }, { status });
  }
}

export async function POST(request: Request) {
  try {
    await requireApiPermission("tag.manage");
    const body = (await request.json()) as {
      slug: string;
      name: string;
    };

    const created = tagsRepository.createTag({
      slug: body.slug,
      name: body.name
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    const status = error instanceof AuthorizationError ? error.status : 400;
    const message = error instanceof Error ? error.message : "create failed";

    return NextResponse.json({ message }, { status });
  }
}
