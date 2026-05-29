import { NextResponse } from "next/server";
import {
  AuthRequiredError,
  createRecord,
  listRecords,
  normalizeRecordInput
} from "@/lib/records";

function authErrorResponse() {
  return NextResponse.json({ error: "请先登录。" }, { status: 401 });
}

export async function GET() {
  try {
    const records = await listRecords();
    return NextResponse.json({ records });
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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const input = normalizeRecordInput({
      workDate: body.workDate,
      styleName: body.styleName,
      quantity: body.quantity,
      unitPrice: body.unitPrice,
      note: body.note
    });
    const record = await createRecord(input);

    return NextResponse.json({ record }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthRequiredError) {
      return authErrorResponse();
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "创建失败。" },
      { status: 400 }
    );
  }
}
