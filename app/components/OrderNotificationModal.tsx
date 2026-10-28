"use client";

import { useEffect, useState, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  X,
  FileText,
  FileCheck2,
  Receipt,
  Printer,
  ChevronLeft,
  MessageCircle,
} from "lucide-react";

interface DocItem {
  id: number;
  title: string;
  desc: string;
  icon: typeof FileText;
  url: string;
}

export default function OrderNotificationModal() {
  const [status, setStatus] = useState<"confirmed" | "cancelled" | null>(null);
  const [dbOrderId, setDbOrderId] = useState<string | null>(null);
  const [orderNumber, setOrderNumber] = useState<string>("");
  const [isOpen, setIsOpen] = useState(false);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const checkOrder = async () => {
      const storedDbId = localStorage.getItem("dbOrderId");
      const storedOrderNum = localStorage.getItem("orderId") || "";
      if (!storedDbId) return;

      setDbOrderId(storedDbId);
      setOrderNumber(storedOrderNum);

      try {
        const res = await fetch(`/api/orders/${storedDbId}/status`);
        if (!res.ok) return;
        const data = await res.json();

        if (data.status === "confirmed" || data.status === "cancelled") {
          const dismissKey = `order_dismissed_${storedDbId}_${data.status}`;
          const isDismissed = sessionStorage.getItem(dismissKey);

          setStatus(data.status);
          if (!isDismissed) {
            setIsOpen(true);
          }
        }
      } catch {
        // ignore network error
      }
    };

    checkOrder();
    pollTimerRef.current = setInterval(checkOrder, 3000);

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, []);

  const handleClose = () => {
    if (dbOrderId && status) {
      sessionStorage.setItem(`order_dismissed_${dbOrderId}_${status}`, "true");
    }
    setIsOpen(false);
  };

  // يفتح صفحة الفاتورة/العقد/السند الأصلية فوراً والتي تفتح معها نافذة البرينت بريفيو تلقائياً
  const handleOpenPrintPreview = (url: string) => {
    window.open(url, "_blank");
  };

  if (!isOpen || !status || !dbOrderId) return null;

  const docs: DocItem[] = [
    {
      id: 1,
      title: "فاتورة الطلب والتقسيط",
      desc: "بيانات الأجهزة والحسابات وتفاصيل الشحن",
      icon: FileText,
      url: `/orders/${dbOrderId}/print`,
    },
    {
      id: 2,
      title: "عقد البيع والتقسيط",
      desc: "بنود الاتفاقية الرسمية والمصادقة وجدول الأقساط",
      icon: FileCheck2,
      url: `/orders/${dbOrderId}/contract`,
    },
    {
      id: 3,
      title: "سند القبض المالي",
      desc: "إيصال استلام وسداد الدفعة المعتمد",
      icon: Receipt,
      url: `/orders/${dbOrderId}/receipt`,
    },
  ];

  return (
    <div dir="rtl" className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleClose}
        className="fixed inset-0 bg-black/45 backdrop-blur-xs transition-opacity"
      />

      {/* Main Centered Modal Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 12 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="relative bg-white w-full max-w-sm rounded-2xl shadow-2xl border border-gray-100 z-10 overflow-hidden text-gray-800"
      >
        {/* Subtle Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-3 left-3 p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition z-20"
          aria-label="إغلاق"
        >
          <X size={16} />
        </button>

        {status === "confirmed" ? (
          <div className="p-5 text-center">
            {/* Centered Distinctive Green Checkmark */}
            <div className="relative inline-flex items-center justify-center mb-3">
              <span className="w-14 h-14 rounded-full bg-emerald-50 border-2 border-emerald-500/20 flex items-center justify-center shadow-xs">
                <span className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/25">
                  <Check size={22} strokeWidth={3} />
                </span>
              </span>
            </div>

            {/* Centered Title & Details */}
            <h3 className="font-extrabold text-base sm:text-lg text-gray-900 leading-tight">
              تم تأكيد طلبك بنجاح
            </h3>

            {orderNumber && (
              <div className="inline-block px-2.5 py-0.5 mt-1 rounded-md bg-gray-50 border border-gray-200/80 text-[11px] font-mono text-gray-600" dir="ltr">
                #{orderNumber}
              </div>
            )}

            <p className="text-xs text-gray-500 mt-1.5 mb-4 leading-relaxed max-w-xs mx-auto">
              اضغط على أي مستند أدناه لفتح معاينة الطباعة (Print Preview) فوراً:
            </p>

            {/* 3 Numbered Documents with Direct Print Preview */}
            <div className="space-y-2 text-right mb-4">
              {docs.map((doc) => {
                const IconComp = doc.icon;

                return (
                  <button
                    key={doc.id}
                    type="button"
                    onClick={() => handleOpenPrintPreview(doc.url)}
                    className="w-full flex items-center gap-3 p-2.5 rounded-xl border border-gray-200/90 hover:border-emerald-500/60 bg-gray-50/60 hover:bg-emerald-50/30 transition-all text-right group relative active:scale-[0.99]"
                  >
                    {/* Number Badge */}
                    <span className="w-6 h-6 rounded-full bg-white border border-gray-200 text-gray-600 font-bold text-xs flex items-center justify-center shrink-0 group-hover:border-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                      {doc.id}
                    </span>

                    <IconComp size={16} className="text-gray-400 group-hover:text-emerald-600 shrink-0 transition-colors" />

                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-xs text-gray-900 group-hover:text-emerald-900 truncate">
                        {doc.title}
                      </p>
                      <p className="text-[10px] text-gray-400 truncate">
                        {doc.desc}
                      </p>
                    </div>

                    {/* Print Preview Action Badge */}
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/60 shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                      <Printer size={12} />
                      <span>معاينة وطباعة</span>
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Simple Dismiss Button */}
            <button
              onClick={handleClose}
              className="w-full py-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold transition shadow-xs"
            >
              متابعة التسوق
            </button>
          </div>
        ) : (
          /* Cancelled View */
          <div className="p-5 text-center">
            <div className="w-12 h-12 rounded-full bg-red-50 border-2 border-red-100 text-red-600 flex items-center justify-center mx-auto mb-2.5">
              <X size={22} strokeWidth={2.5} />
            </div>

            <h3 className="font-bold text-sm text-gray-900 mb-1">
              تم إلغاء الطلب
            </h3>

            {orderNumber && (
              <p className="text-[11px] text-gray-400 font-mono mb-2" dir="ltr">
                #{orderNumber}
              </p>
            )}

            <p className="text-xs text-gray-500 leading-relaxed mb-4">
              نأسف، تم إلغاء طلبك من قبل الإدارة. لأي استفسار، يمكنك التواصل مع خدمة العملاء.
            </p>

            <div className="flex gap-2">
              <a
                href={`https://wa.me/966500000000?text=${encodeURIComponent(`أستفسر عن إلغاء طلبي رقم ${orderNumber}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition"
              >
                <MessageCircle size={13} />
                واتساب الدعم
              </a>
              <button
                onClick={handleClose}
                className="py-2 px-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-semibold transition"
              >
                إغلاق
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
