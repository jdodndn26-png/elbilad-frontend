"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

function toArabicWords(n: number): string {
  const ones = ["", "واحد", "اثنان", "ثلاثة", "أربعة", "خمسة", "ستة", "سبعة", "ثمانية", "تسعة",
    "عشرة", "أحد عشر", "اثنا عشر", "ثلاثة عشر", "أربعة عشر", "خمسة عشر", "ستة عشر",
    "سبعة عشر", "ثمانية عشر", "تسعة عشر"];
  const tens = ["", "", "عشرون", "ثلاثون", "أربعون", "خمسون", "ستون", "سبعون", "ثمانون", "تسعون"];
  const hundreds = ["", "مائة", "مئتان", "ثلاثمائة", "أربعمائة", "خمسمائة", "ستمائة", "سبعمائة", "ثمانمائة", "تسعمائة"];
  if (n === 0) return "صفر";
  if (n < 0) return "سالب " + toArabicWords(-n);
  let result = "";
  if (n >= 1000) {
    const t = Math.floor(n / 1000);
    result += (t === 1 ? "ألف" : t === 2 ? "ألفان" : t <= 10 ? toArabicWords(t) + " آلاف" : toArabicWords(t) + " ألف") + " ";
    n %= 1000;
    if (n > 0) result += "و";
  }
  if (n >= 100) { result += hundreds[Math.floor(n / 100)] + " "; n %= 100; if (n > 0) result += "و"; }
  if (n >= 20) { result += tens[Math.floor(n / 10)] + " "; n %= 10; if (n > 0) result += "و"; }
  if (n > 0) result += ones[n] + " ";
  return result.trim();
}

interface OrderItem { name: string; }
interface ReceiptData {
  order: { orderId: string; installmentType: string; downPayment: number; total: number; customer: string; whatsapp: string; address: string; items: OrderItem[]; discountAmount?: number; };
  company: { currencyAr?: string; header?: string; footer?: string; stamp?: string; };
}

function resolveImgUrl(url?: string): string {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) {
    return url;
  }
  const backend = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
  return `${backend}${url.startsWith("/") ? "" : "/"}${url}`;
}

function preloadImages(urls: (string | undefined)[]): Promise<void> {
  const validUrls = urls
    .map((u) => resolveImgUrl(u))
    .filter((u) => Boolean(u && u.trim()));

  if (validUrls.length === 0) return Promise.resolve();

  return Promise.all(
    validUrls.map(
      (src) =>
        new Promise<void>((resolve) => {
          const img = new Image();
          img.src = src;
          if (img.complete && img.naturalWidth > 0) {
            resolve();
          } else {
            img.onload = () => resolve();
            img.onerror = () => resolve();
          }
        })
    )
  ).then(() => {});
}

export default function ReceiptPrintPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<ReceiptData | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`/api/admin/orders/${id}/invoice`).then((r) => r.json()),
    ]).then(async ([d]) => {
      setData(d);
      await preloadImages([d?.company?.header, d?.company?.footer, d?.company?.stamp]);
      setIsReady(true);
    });
  }, [id]);

  useEffect(() => {
    if (isReady && data && typeof window !== "undefined" && window.self === window.top) {
      const timer = setTimeout(() => {
        window.print();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isReady, data]);

  // إرجاع العميل للموقع بعد إتمام أو إلغاء الطباعة
  useEffect(() => {
    const handleAfterPrint = () => {
      window.close();
      setTimeout(() => {
        window.location.href = "/";
      }, 400);
    };

    window.addEventListener("afterprint", handleAfterPrint);
    return () => window.removeEventListener("afterprint", handleAfterPrint);
  }, []);

  if (!isReady || !data) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "Arial, sans-serif", direction: "rtl", gap: 14, backgroundColor: "#fff" }}>
        <div style={{ width: 44, height: 44, border: "4px solid #e5e7eb", borderTopColor: "#d97706", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        <div style={{ fontSize: 16, fontWeight: "bold", color: "#1f2937" }}>جاري تجهيز سند القبض وتحميل الصور...</div>
        <div style={{ fontSize: 13, color: "#6b7280" }}>يرجى الانتظار لحين اكتمال تجهيز الملف للطباعة</div>
      </div>
    );
  }

  const { order, company } = data;
  const currency = company.currencyAr || "ريال";
  const discount = order.discountAmount ?? 0;
  const amount = order.installmentType === "installment" ? order.downPayment : order.total;
  const amountWords = toArabicWords(amount) + " فقط لا غير";
  const aboutPrefix = `قيمة ${order.installmentType === "installment" ? "دفعة من " : ""}ثمن جهاز/أجهزة:`;
  const aboutItems = order.items.map((i: OrderItem) => i.name);

  const style = `
    * { box-sizing: border-box; margin: 0; padding: 0; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    body { font-family: Arial, sans-serif; background: #fff; direction: rtl; padding: 12px; }
    ul { list-style: disc; padding-right: 20px !important; margin-top: 4px !important; }
    li { list-style: disc; }
    .receipt-table { width: 100%; border-collapse: collapse; font-size: 15px; }
    .receipt-table td { border: 1px solid #aaa; padding: 6px 10px; word-break: break-word; }
    .receipt-label { text-align: center; background-color: #808080; color: #000; font-weight: bold; white-space: nowrap; width: 1%; }
    .receipt-value { text-align: center; }
    .receipt-header-row { display: flex; justify-content: center; margin-bottom: 4px; }
    .receipt-no { font-size: 14px; font-weight: bold; color: #990431; text-align: center; margin-top: 4px; }
    @media (max-width: 600px) {
      .receipt-table { font-size: 13px; }
      .receipt-table td { padding: 5px 7px; }
      .receipt-no { font-size: 12px; }
    }
    @media print {
      @page { size: A4; margin: 10mm; }
      .no-print { display: none !important; }
      body { padding: 0; }
      img[alt="header"], img[alt="footer"] { width: 100% !important; max-height: none !important; }
    }
  `;

  return (
    <div style={{ fontFamily: "Arial, sans-serif", padding: "12px", maxWidth: 700, width: "100%", margin: "0 auto" }} dir="rtl">
      <style>{style}</style>

      {/* Screen-only top action bar */}
      <div className="no-print" style={{ padding: "10px 16px", backgroundColor: "#f3f4f6", border: "1px solid #e5e7eb", borderRadius: 10, display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <button
          onClick={() => {
            window.close();
            setTimeout(() => { window.location.href = "/"; }, 200);
          }}
          style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", backgroundColor: "#1f2937", color: "#fff", borderRadius: 8, fontSize: 13, fontWeight: "bold", border: "none", cursor: "pointer" }}
        >
          <span>الرجوع إلى المتجر</span>
          <span>⬅</span>
        </button>
        <button
          onClick={() => window.print()}
          style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", backgroundColor: "#d97706", color: "#fff", borderRadius: 8, fontSize: 13, fontWeight: "bold", border: "none", cursor: "pointer" }}
        >
          <span>🖨️</span>
          <span>طباعة سند القبض</span>
        </button>
      </div>

{/* header image*/}
      {company.header && (
        <img src={resolveImgUrl(company.header)} alt="header" style={{ width: "100%", marginBottom: 16 }} />
      )}

      {/* receipt box */}
      <div style={{ border: "2px solid #808080", borderRadius: 8, marginBottom: 16, position: "relative" }}>
        <div className="receipt-header-row">
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ backgroundColor: "#808080", padding: "1px 50px", borderRadius: "0 0 6px 6px" }}>
              <span style={{ fontSize: 20, fontWeight: "bold", color: "#000000" }}>سند قبض</span>
            </div>
            <span className="receipt-no">No. #{order.orderId}</span>
          </div>
        </div>
        <div style={{ padding: "16px 20px" }}>
          <table className="receipt-table">
            <tbody>
              <tr>
                <td className="receipt-label">المبلغ</td>
                <td className="receipt-value">{amount}</td>
                <td className="receipt-value">{currency}</td>
              </tr>
              {discount > 0 && (
                <tr>
                  <td className="receipt-label">خصم مطبّق</td>
                  <td colSpan={2} className="receipt-value" style={{ color: "#16a34a", fontWeight: "bold" }}>- {discount} {currency}</td>
                </tr>
              )}
              <tr>
                <td className="receipt-label">استلمت من السيد</td>
                <td colSpan={2} className="receipt-value">{order.customer}</td>
              </tr>
              <tr>
                <td className="receipt-label">رقم الجوال</td>
                <td colSpan={2} className="receipt-value">{order.whatsapp}</td>
              </tr>
              <tr>
                <td className="receipt-label">العنوان</td>
                <td colSpan={2} className="receipt-value">{order.address}</td>
              </tr>
              <tr>
                <td className="receipt-label">وذلك عن</td>
                <td colSpan={2} className="receipt-value">
                  {aboutPrefix}
                  <ul style={{ margin: "4px 0 0 0", paddingRight: 20, textAlign: "right" }}>
                    {aboutItems.map((name: string, idx: number) => (
                      <li key={idx}>{name}</li>
                    ))}
                  </ul>
                </td>
              </tr>
              <tr>
                <td className="receipt-label">المبلغ بالحروف</td>
                <td colSpan={2} className="receipt-value">{amountWords}</td>
              </tr>
            </tbody>
          </table>

          <div style={{ border: "1px solid #aaa", borderRadius: 6, marginTop: 24, display: "grid", gridTemplateColumns: "1fr 1fr", minHeight: 100 }}>
            <div style={{ textAlign: "center", padding: "12px 8px", borderLeft: "1px solid #aaa", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ fontWeight: "bold" }}>توقيع المستلم</div>
              <div style={{ borderBottom: "1px solid #aaa", width: "80%" }}></div>
            </div>
            <div style={{ textAlign: "center", padding: "12px 8px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ fontWeight: "bold" }}>الختم</div>
              {company.stamp
                ? <img src={resolveImgUrl(company.stamp)} alt="ختم" style={{ maxWidth: 90, maxHeight: 70, objectFit: "contain" }} />
                : <div style={{ borderBottom: "1px solid #aaa", width: "80%" }}></div>
              }
            </div>
          </div>
        </div>
      </div>

      {/* footer image*/}
      {company.footer && (
        <img src={resolveImgUrl(company.footer)} alt="footer" style={{ width: "100%" }} />
      )}
    </div>
  );
}
