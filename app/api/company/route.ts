import { NextRequest, NextResponse } from "next/server";
import { getBackend } from "../admin/_lib";
import { isBot2UserToken, applyBotContactOverride } from "../../lib/botContact";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const res = await fetch(`${getBackend()}/api/admin/company`, {
    next: { revalidate: 2592000, tags: ["company"] },
  });
  const data = await res.json();
  const token = req.cookies.get("_b_token")?.value;
  const isBot2 = isBot2UserToken(token);
  const result = applyBotContactOverride(data, isBot2);

  return NextResponse.json(result, { status: res.status });
}
