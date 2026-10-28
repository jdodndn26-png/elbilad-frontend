import { NextRequest, NextResponse } from "next/server";
import { getBackend } from "@/app/api/admin/_lib";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const res = await fetch(`${getBackend()}/api/checkout/${id}/public`);
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ ok: false, error: "فشل استرجاع بيانات الطلب" }, { status: 502 });
  }
}
