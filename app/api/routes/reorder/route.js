import { NextResponse } from "next/server";
import { reorderRouteBranches, reorderRoutes } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(request) {
  const body = await request.json();
  if (body.type === "branches") {
    return NextResponse.json(await reorderRouteBranches(body.routeId, body.branches));
  }
  await reorderRoutes(body.date, body.orderedIds || []);
  return NextResponse.json({ ok: true });
}
