import { NextRequest, NextResponse } from "next/server";
import { getBackend, forwardCookies } from "../../admin/_lib";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const backend = getBackend();
  try {
    const res = await fetch(`${backend}/api/products/${encodeURIComponent(id)}?full=1`, {
      cache: "no-store",
    });
    if (!res.ok) {
      return NextResponse.json({ error: "المنتج غير موجود" }, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json(data, {
      headers: { "Cache-Control": "public, max-age=86400, s-maxage=2592000, stale-while-revalidate=86400" },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "خطأ في جلب بيانات المنتج" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const res = await fetch(`${getBackend()}/api/products/${id}`, forwardCookies(req, { method: "DELETE" }));
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
