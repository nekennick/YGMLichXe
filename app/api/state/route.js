import { NextResponse } from "next/server";
import { getState } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date") || new Date().toISOString().slice(0, 10);
  return NextResponse.json(await getState(date));
}
