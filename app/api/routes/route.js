import { NextResponse } from "next/server";
import { deleteRoute, getRoutes, saveRoute } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date") || new Date().toISOString().slice(0, 10);
  return NextResponse.json(await getRoutes(date));
}

export async function POST(request) {
  const body = await request.json();
  return NextResponse.json(await saveRoute(body));
}

export async function DELETE(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing route id" }, { status: 400 });
  await deleteRoute(id);
  return NextResponse.json({ ok: true });
}
