import { NextResponse } from "next/server";
import { addBranches, deleteBranch, findBranchUsage, renameBranch } from "@/lib/db";
import { parseManyNames } from "@/lib/text";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const body = await request.json();
    await addBranches(parseManyNames(body.names || body.name || ""));
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Không thêm được chi nhánh." }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    if (!body.oldName || !body.name) {
      return NextResponse.json({ error: "Thiếu tên chi nhánh cần sửa." }, { status: 400 });
    }
    const branch = await renameBranch(body.oldName, body.name);
    return NextResponse.json({ ok: true, branch });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Không lưu được chi nhánh." }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get("name");
    if (!name) return NextResponse.json({ error: "Missing branch name" }, { status: 400 });
    const usedCount = await findBranchUsage(name);
    await deleteBranch(name);
    return NextResponse.json({ ok: true, usedCount });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Không xóa được chi nhánh." }, { status: 500 });
  }
}
