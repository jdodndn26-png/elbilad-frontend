import { NextRequest, NextResponse } from "next/server";
import { getBackend, getAdminToken } from "../../_lib";

async function safeJson(res: Response) {
  const text = await res.text();
  try { return JSON.parse(text); } catch { return { ok: res.ok }; }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = getAdminToken(req);
  if (!token) {
    const res = await fetch(`${getBackend()}/api/checkout/${id}/public`);
    return NextResponse.json(await safeJson(res), { status: res.status });
  }
  const res = await fetch(`${getBackend()}/api/admin/orders/${id}`, {
    headers: { cookie: `admin_token=${token}` },
  });
  if (res.status === 401) {
    const pubRes = await fetch(`${getBackend()}/api/checkout/${id}/public`);
    return NextResponse.json(await safeJson(pubRes), { status: pubRes.status });
  }
  return NextResponse.json(await safeJson(res), { status: res.status });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
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
  const token = getAdminToken(req);
  const res = await fetch(`${getBackend()}/api/admin/orders/${id}`, {
    method: "DELETE",
    headers: { cookie: `admin_token=${token}` },
  });
  return NextResponse.json(await safeJson(res), { status: res.status });
}
