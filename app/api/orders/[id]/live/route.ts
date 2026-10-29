import { NextRequest } from "next/server";
import { getBackend } from "../../../admin/_lib";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const res = await fetch(`${getBackend()}/api/checkout/${id}/live`, {
      headers: { Accept: "text/event-stream" },
      cache: "no-store",
    });

    return new Response(res.body, {
      status: res.status,
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch {
    return new Response("Internal Server Error", { status: 500 });
  }
}
