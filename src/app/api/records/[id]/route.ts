import { NextResponse } from "next/server";
import {
  AuthRequiredError,
  deleteRecord,
  getRecordById,
  normalizeRecordInput,
  updateRecord
} from "@/lib/records";

function authErrorResponse() {
  return NextResponse.json({ error: "请先登录。" }, { status: 401 });
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const record = await getRecordById(id);

    if (!record) {
      return NextResponse.json({ error: "记录不存在。" }, { status: 404 });
    }

    return NextResponse.json({ record });
  } catch (error) {
    if (error instanceof AuthRequiredError) {
      return authErrorResponse();
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "读取失败。" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const input = normalizeRecordInput({
      workDate: body.workDate,
      styleName: body.styleName,
      quantity: body.quantity,
      unitPrice: body.unitPrice,
      note: body.note
    });
    const record = await updateRecord(id, input);

    return NextResponse.json({ record });
  } catch (error) {
    if (error instanceof AuthRequiredError) {
      return authErrorResponse();
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "更新失败。" },
      { status: 400 }
    );
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await deleteRecord(id);

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof AuthRequiredError) {
      return authErrorResponse();
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "删除失败。" },
      { status: 400 }
    );
  }
}
