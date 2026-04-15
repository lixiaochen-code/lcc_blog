import { tagsRepository } from "@lcc-blog/db/tags";
import { NextResponse } from "next/server";
import { AuthorizationError, requireApiPermission } from "../../../../lib/auth";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    await requireApiPermission("tag.read");
    const tag = tagsRepository.getTagById(id);

    if (!tag) {
      return NextResponse.json({ error: "tag not found" }, { status: 404 });
    }

    return NextResponse.json(tag);
  } catch (error) {
    const status = error instanceof AuthorizationError ? error.status : 500;
    const message =
      error instanceof Error ? error.message : "tag request failed";

    return NextResponse.json({ error: message }, { status });
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    await requireApiPermission("tag.manage");
    const body = (await request.json()) as {
      slug?: string;
      name?: string;
    };

    const updated = tagsRepository.updateTag(id, body);
    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    if (error instanceof Error && error.message === "tag not found") {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof Error && error.message === "slug already exists") {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    throw error;
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    await requireApiPermission("tag.manage");
    const deleted = tagsRepository.deleteTag(id);
    return NextResponse.json(deleted);
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    if (error instanceof Error && error.message === "tag not found") {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    throw error;
  }
}
