import { NextResponse } from "next/server";
import { getCatalog } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json(await getCatalog());
}
