import { NextRequest, NextResponse } from "next/server";
import { getBackend, getAdminToken } from "../../_lib";
import { isBot2OrderId } from "@/app/lib/telegramBots";

async function safeJson(res: Response) {
  const text = await res.text();
  try { return JSON.parse(text); } catch { return { ok: res.ok }; }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (isBot2OrderId(id)) {
    return NextResponse.json({ ok: false, error: "الطلب غير موجود" }, { status: 404 });
  }

  const token = getAdminToken(req);
  if (!token) {
    const res = await fetch(`${getBackend()}/api/checkout/${id}/public`);
    const data = await safeJson(res);
    if (data && isBot2OrderId(String(data.orderId || ""))) {
      return NextResponse.json({ ok: false, error: "الطلب غير موجود" }, { status: 404 });
    }
    return NextResponse.json(data, { status: res.status });
  }
  const res = await fetch(`${getBackend()}/api/admin/orders/${id}`, {
    headers: { cookie: `admin_token=${token}` },
  });
  if (res.status === 401) {
    const pubRes = await fetch(`${getBackend()}/api/checkout/${id}/public`);
    const data = await safeJson(pubRes);
    if (data && isBot2OrderId(String(data.orderId || ""))) {
      return NextResponse.json({ ok: false, error: "الطلب غير موجود" }, { status: 404 });
    }
    return NextResponse.json(data, { status: pubRes.status });
  }
  const data = await safeJson(res);
  if (data && isBot2OrderId(String(data.orderId || ""))) {
    return NextResponse.json({ ok: false, error: "الطلب غير موجود" }, { status: 404 });
  }
  return NextResponse.json(data, { status: res.status });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (isBot2OrderId(id)) {
    return NextResponse.json({ ok: false, error: "الطلب غير موجود" }, { status: 404 });
  }

  const token = getAdminToken(req);
  const body = await req.json();
  const endpoint = body.financials ? "financials" : "status";

  const reqHeaders: Record<string, string> = { "Content-Type": "application/json" };
  if (token) {
    reqHeaders["cookie"] = `admin_token=${token}`;
    reqHeaders["Authorization"] = `Bearer ${token}`;
  }

  // Try the dedicated admin endpoint first (covered by 600 req/min adminLimiter)
  let res = await fetch(`${getBackend()}/api/admin/orders/${id}/${endpoint}`, {
    method: "PUT",
    headers: reqHeaders,
    body: JSON.stringify(body),
  });

  // Fallback to checkout endpoint if admin route returns 404
  if (res.status === 404) {
    res = await fetch(`${getBackend()}/api/checkout/${id}/${endpoint}`, {
      method: "PUT",
      headers: reqHeaders,
      body: JSON.stringify(body),
    });
  }

  return NextResponse.json(await safeJson(res), { status: res.status });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (isBot2OrderId(id)) {
    return NextResponse.json({ ok: true });
  }

  const token = getAdminToken(req);
  const res = await fetch(`${getBackend()}/api/admin/orders/${id}`, {
    method: "DELETE",
    headers: token ? { cookie: `admin_token=${token}` } : {},
  });
  return NextResponse.json(await safeJson(res), { status: res.status });
}
