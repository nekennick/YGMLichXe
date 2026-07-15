import { NextResponse } from "next/server";
import { addBranches, deleteBranch, findBranchUsage, renameBranch } from "@/lib/db";
import { parseManyNames } from "@/lib/text";

export const runtime = "nodejs";

export async function POST(request) {
  const body = await request.json();
  addBranches(parseManyNames(body.names || body.name || ""));
  return NextResponse.json({ ok: true });
}

export async function PUT(request) {
  const body = await request.json();
  renameBranch(body.oldName, body.name);
  return NextResponse.json({ ok: true });
}

export async function DELETE(request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get("name");
  if (!name) return NextResponse.json({ error: "Missing branch name" }, { status: 400 });
  const usedCount = findBranchUsage(name);
  deleteBranch(name);
  return NextResponse.json({ ok: true, usedCount });
}
