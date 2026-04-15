import { sidebarsRepository } from "@lcc-blog/db/sidebars";
import { NextResponse } from "next/server";
import { AuthorizationError, requireApiPermission } from "../../../lib/auth";

export async function GET() {
  try {
    await requireApiPermission("sidebar.read");
    return NextResponse.json({ items: sidebarsRepository.listSidebars() });
  } catch (error) {
    const status = error instanceof AuthorizationError ? error.status : 500;
    const message =
      error instanceof Error ? error.message : "sidebars request failed";

    return NextResponse.json({ message }, { status });
  }
}

export async function POST(request: Request) {
  try {
    await requireApiPermission("sidebar.update");
    const body = (await request.json()) as {
      slug: string;
      name: string;
      description?: string;
    };

    const created = sidebarsRepository.createSidebar({
      slug: body.slug,
      name: body.name,
      description: body.description
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    const status = error instanceof AuthorizationError ? error.status : 400;
    const message = error instanceof Error ? error.message : "create failed";

    return NextResponse.json({ message }, { status });
  }
}
