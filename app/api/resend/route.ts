import { NextRequest, NextResponse } from "next/server";
import { getOrderBot, sendTelegramMessage } from "../../lib/telegramBots";

export async function POST(req: NextRequest) {
  const { orderId, customerName } = await req.json();

  const text = [
    `🔄 تم طلب إعادة ارسال كود`,
    `🆔 رقم الطلب: ${orderId ?? "—"}`,
    `👤 اسم العميل: ${customerName ?? "—"}`,
  ].join("\n");

  const targetBot = getOrderBot(String(orderId));
  const sent = await sendTelegramMessage(targetBot, { text });

  return NextResponse.json({ ok: sent });
}
