import { NextRequest, NextResponse } from "next/server";
import { getBackend, getAdminToken } from "../../../_lib";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = getAdminToken(req);
  if (!token) {
    const res = await fetch(`${getBackend()}/api/checkout/${id}/invoice`);
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  }
  const [orderRes, companyRes] = await Promise.all([
    fetch(`${getBackend()}/api/admin/orders/${id}`, { headers: { cookie: `admin_token=${token}` } }),
    fetch(`${getBackend()}/api/admin/company`),
  ]);
  if (orderRes.status === 401) {
    const res = await fetch(`${getBackend()}/api/checkout/${id}/invoice`);
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  }
  const order = await orderRes.json();
  const company = await companyRes.json();
  return NextResponse.json({ order, company });
}
