import { NextRequest, NextResponse } from "next/server";
import { getBackend, getAdminToken } from "../../../_lib";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = getAdminToken(req);

  if (!token) {
    const res = await fetch(`${getBackend()}/api/checkout/${id}/invoice`, { cache: "no-store" });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  }

  const [orderRes, companyRes] = await Promise.all([
    fetch(`${getBackend()}/api/admin/orders/${id}`, {
      headers: { cookie: `admin_token=${token}` },
      cache: "no-store",
    }),
    fetch(`${getBackend()}/api/admin/company`, { cache: "no-store" }),
  ]);

  if (!orderRes.ok) {
    // If admin order fetch failed (401 or 404), fall back to public checkout invoice
    const fallbackRes = await fetch(`${getBackend()}/api/checkout/${id}/invoice`, { cache: "no-store" });
    if (fallbackRes.ok) {
      const data = await fallbackRes.json().catch(() => ({}));
      return NextResponse.json(data, { status: 200 });
    }
    const errData = await orderRes.json().catch(() => ({}));
    return NextResponse.json(errData, { status: orderRes.status });
  }

  const order = await orderRes.json();
  let company = await companyRes.json().catch(() => ({}));
  if (!company || company.error) company = {};

  return NextResponse.json({ order, company });
}
