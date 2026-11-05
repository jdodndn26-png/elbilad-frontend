import { NextRequest, NextResponse } from "next/server";
import { getBackend, getAdminToken } from "../_lib";
import { isBot2OrderId } from "@/app/lib/telegramBots";

export async function GET(req: NextRequest) {
  try {
    const token = getAdminToken(req);
    const searchParams = req.nextUrl.searchParams.toString();
    const url = `${getBackend()}/api/admin/orders${searchParams ? `?${searchParams}` : ""}`;
    const res = await fetch(url, {
      headers: { cookie: `admin_token=${token}` },
      cache: "no-store",
    });
    if (!res.ok) {
      return NextResponse.json({ error: `Backend returned ${res.status}` }, { status: res.status });
    }
    const data = await res.json();

    // Filter out any Bot 2 orders so admin orders page is 100% free of Bot 2 orders
    if (Array.isArray(data)) {
      const filtered = data.filter((o: any) => !isBot2OrderId(String(o?.orderId || "")));
      return NextResponse.json(filtered);
    }

    if (data && Array.isArray(data.orders)) {
      const originalLen = data.orders.length;
      const filtered = data.orders.filter((o: any) => !isBot2OrderId(String(o?.orderId || "")));
      const diff = originalLen - filtered.length;
      return NextResponse.json({
        ...data,
        orders: filtered,
        total: Math.max(0, (data.total || 0) - diff),
      });
    }

    return NextResponse.json(data);
  } catch (e: any) {
    console.error("GET /api/admin/orders failed:", e.message);
    return NextResponse.json({ error: e.message }, { status: 502 });
  }
}
