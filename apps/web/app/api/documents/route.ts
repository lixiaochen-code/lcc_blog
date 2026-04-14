import { documentsRepository } from "@lcc-blog/db/documents";
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ items: documentsRepository.listDocuments() });
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    slug: string;
    title: string;
    summary: string;
    content: string;
    createdBy?: string;
  };

  const created = documentsRepository.createDocument({
    slug: body.slug,
    title: body.title,
    summary: body.summary,
    content: body.content,
    createdBy: body.createdBy ?? "admin"
  });

  return NextResponse.json(created, { status: 201 });
}
