"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  Check,
  X,
  FileText,
  FileCheck2,
  Receipt,
  Printer,
  MessageCircle,
} from "lucide-react";

interface DocItem {
  id: number;
  title: string;
  desc: string;
  icon: typeof FileText;
  url: string;
}

// أقصى مدة لتتبع الطلب بعد إتمامه (30 دقيقة فقط لمنع أي ظهور قديم في أيام لاحقة)
const MAX_TRACKING_WINDOW_MS = 30 * 60 * 1000;

// تنظيف بيانات الطلب نهائياً من التخزين المحلي
function cleanupOrderStorage(orderDbId?: string | null) {
  try {
    if (typeof window === "undefined") return;
    if (orderDbId) {
      localStorage.setItem(`order_handled_${orderDbId}`, "true");
    }
    localStorage.removeItem("dbOrderId");
    localStorage.removeItem("orderId");
    localStorage.removeItem("orderTracking_createdAt");
  } catch {
    // ignore
  }
}

// فحص هل الطلب صالح للتتبع (حديث ولم ينته أو يعرض مسبقاً)
function isOrderEligibleForTracking(targetDbId: string): boolean {
  try {
    if (typeof window === "undefined" || !targetDbId) return false;

    // 1. إذا تم التعامل مع الطلب مسبقاً (دائم في localStorage)
    if (localStorage.getItem(`order_handled_${targetDbId}`) === "true") {
      cleanupOrderStorage(targetDbId);
      return false;
    }

    // 2. إذا تم إغلاقه في نفس الجلسة
    if (
      sessionStorage.getItem(`order_dismissed_${targetDbId}_confirmed`) ||
      sessionStorage.getItem(`order_dismissed_${targetDbId}_cancelled`)
    ) {
      cleanupOrderStorage(targetDbId);
      return false;
    }

    // 3. فحص وقت إنشاء الطلب - إذا مر أكثر من 30 دقيقة أو غير موجود (طلب قديم من أمس)
    const createdAtStr = localStorage.getItem("orderTracking_createdAt");
    if (!createdAtStr) {
      // أي طلب بدون وقت إنشاء يعتبر قديماً ومتبقياً من جلسات سابقة
      cleanupOrderStorage(targetDbId);
      return false;
    }

    const createdAt = Number(createdAtStr);
    if (isNaN(createdAt) || Date.now() - createdAt > MAX_TRACKING_WINDOW_MS) {
      cleanupOrderStorage(targetDbId);
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

// تشغيل نغمة تنبيه لطيفة وخفيفة عبر Web Audio API عند تأكيد الطلب فوراً
function playSuccessChime() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }
    const now = ctx.currentTime;

    // نغمة أولى D5 (587.33 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(587.33, now);
    gain1.gain.setValueAtTime(0.18, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);

    // نغمة ثانية A5 (880 Hz)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(880, now + 0.12);
    gain2.gain.setValueAtTime(0.22, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.6);
  } catch {
    // Audio blocked or not supported
  }
}

export default function OrderNotificationModal() {
  const pathname = usePathname();
  const [status, setStatus] = useState<"confirmed" | "cancelled" | null>(null);
  const [dbOrderId, setDbOrderId] = useState<string | null>(null);
  const [orderNumber, setOrderNumber] = useState<string>("");
  const [isOpen, setIsOpen] = useState(false);

  const activeTrackingIdRef = useRef<string | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const esRef = useRef<EventSource | null>(null);

  const handleStatusUpdate = useCallback(
    (newStatus: "confirmed" | "cancelled", targetDbId: string, orderNum?: string) => {
      // إيقاف أي تتبع نشط فوراً
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
      if (esRef.current) {
        esRef.current.close();
        esRef.current = null;
      }

      // إذا كان الطلب قد تم التعامل معه مسبقاً، لا نظهر الإشعار
      if (localStorage.getItem(`order_handled_${targetDbId}`) === "true") {
        cleanupOrderStorage(targetDbId);
        return;
      }

      // تعيين البيانات في الحالة للظهور في واجهة المستخدم
      setDbOrderId(targetDbId);
      setStatus(newStatus);
      if (orderNum) {
        setOrderNumber(orderNum);
      }

      // تسجيل الانتهاء فوراً في التخزين الدائم لحماية العميل من ظهوره غداً أو في أي وقت لاحق
      localStorage.setItem(`order_handled_${targetDbId}`, "true");
      sessionStorage.setItem(`order_dismissed_${targetDbId}_${newStatus}`, "true");
      cleanupOrderStorage(targetDbId);

      // إظهار المودال والنغمة
      setIsOpen(true);
      if (newStatus === "confirmed") {
        playSuccessChime();
      }
    },
    []
  );

  const startTracking = useCallback(
    (targetDbId: string, targetOrderNum?: string) => {
      if (!targetDbId) return;

      // التأكد أن الطلب حديث وغير مسجل كمنتهي
      if (!isOrderEligibleForTracking(targetDbId)) {
        return;
      }

      // إذا كنا نتتبع بالفعل هذا الطلب والاتصال شغال، لا داعي للتكرار
      if (
        activeTrackingIdRef.current === targetDbId &&
        (esRef.current || pollTimerRef.current)
      ) {
        return;
      }

      // تنظيف أي تتبع قديم
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      if (esRef.current) esRef.current.close();

      activeTrackingIdRef.current = targetDbId;
      setDbOrderId(targetDbId);
      if (targetOrderNum) setOrderNumber(targetOrderNum);

      let isFinished = false;
      let attempts = 0;
      const maxAttempts = 300; // 5 دقائق كحد أقصى للاتصال الحي

      const stopTracking = () => {
        isFinished = true;
        if (pollTimerRef.current) {
          clearInterval(pollTimerRef.current);
          pollTimerRef.current = null;
        }
        if (esRef.current) {
          esRef.current.close();
          esRef.current = null;
        }
      };

      // 1. الاتصال اللحظي الفوري عبر Server-Sent Events (SSE) (وصول التحديث 0ms بمجرد ضغط الأدمن)
      try {
        const es = new EventSource(`/api/orders/${targetDbId}/live`);
        esRef.current = es;

        es.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.status === "not_found") {
              cleanupOrderStorage(targetDbId);
              stopTracking();
              return;
            }
            if (data.orderId && !targetOrderNum) {
              setOrderNumber(data.orderId);
            }
            if (data.status === "confirmed" || data.status === "cancelled") {
              stopTracking();
              handleStatusUpdate(
                data.status,
                targetDbId,
                data.orderId || targetOrderNum
              );
            }
          } catch {
            // ignore parse error
          }
        };

        es.onerror = () => {
          if (esRef.current) {
            esRef.current.close();
            esRef.current = null;
          }
        };
      } catch {
        // SSE unsupported
      }

      // 2. فحص سريع احتياطي كل ثانية واحدة (Ultra-fast 1s Polling)
      const checkOrder = async () => {
        if (isFinished) return;
        if (typeof document !== "undefined" && document.hidden) return;

        // إذا أصبح الطلب غير صالح أثناء الفحص
        if (!isOrderEligibleForTracking(targetDbId)) {
          stopTracking();
          return;
        }

        attempts++;
        if (attempts > maxAttempts) {
          stopTracking();
          return;
        }

        try {
          const res = await fetch(`/api/orders/${targetDbId}/status`, {
            cache: "no-store",
          });
          if (res.status === 404) {
            cleanupOrderStorage(targetDbId);
            stopTracking();
            return;
          }
          if (res.status === 429) {
            stopTracking();
            return;
          }
          if (!res.ok) return;

          const data = await res.json();
          if (data.orderId && !targetOrderNum) {
            setOrderNumber(data.orderId);
          }
          if (data.status === "confirmed" || data.status === "cancelled") {
            stopTracking();
            handleStatusUpdate(
              data.status,
              targetDbId,
              data.orderId || targetOrderNum
            );
          }
        } catch {
          // ignore network glitch
        }
      };

      // فحص أولي سريع فوراً
      checkOrder();

      // تكرار الفحص كل ثانية واحدة فقط كـ fallback
      pollTimerRef.current = setInterval(checkOrder, 1000);
    },
    [handleStatusUpdate]
  );

  // مراقبة فورية لجميع الأحداث أثناء عملية الشراء النشطة
  useEffect(() => {
    if (typeof window === "undefined") return;

    const checkAndTrack = () => {
      const storedDbId = localStorage.getItem("dbOrderId");
      const storedOrderNum = localStorage.getItem("orderId") || "";
      if (storedDbId) {
        if (isOrderEligibleForTracking(storedDbId)) {
          startTracking(storedDbId, storedOrderNum);
        } else {
          cleanupOrderStorage(storedDbId);
        }
      }
    };

    // 1. فحص فوري عند التحميل
    checkAndTrack();

    // 2. استماع لحدث إنشاء طلب جديد "order_created" فور إرسال الطلب في الصفحة الحالية
    const onOrderCreated = (e: any) => {
      const { dbOrderId: newDbId, orderId: newOrderNum } = e.detail || {};
      if (newDbId && isOrderEligibleForTracking(newDbId)) {
        startTracking(newDbId, newOrderNum);
      }
    };
    window.addEventListener("order_created", onOrderCreated);

    // 3. استماع لحدث تحديث حالة الطلب "order_status_updated"
    const onOrderStatusUpdated = (e: any) => {
      const {
        status: newStatus,
        dbOrderId: updateDbId,
        orderId: updateOrderNum,
      } = e.detail || {};
      if (
        updateDbId &&
        isOrderEligibleForTracking(updateDbId) &&
        (newStatus === "confirmed" || newStatus === "cancelled")
      ) {
        handleStatusUpdate(newStatus, updateDbId, updateOrderNum);
      }
    };
    window.addEventListener("order_status_updated", onOrderStatusUpdated);

    // 4. استماع لتغييرات localStorage
    const onStorage = (e: StorageEvent) => {
      if (e.key === "dbOrderId" && e.newValue) {
        checkAndTrack();
      }
    };
    window.addEventListener("storage", onStorage);

    // 5. مراقب دوري خفيف (800ms) يتأكد فقط أثناء التواجد في صفحات الشراء
    const watcher = setInterval(() => {
      const storedDbId = localStorage.getItem("dbOrderId");
      if (storedDbId && activeTrackingIdRef.current !== storedDbId) {
        checkAndTrack();
      }
    }, 800);

    return () => {
      window.removeEventListener("order_created", onOrderCreated);
      window.removeEventListener("order_status_updated", onOrderStatusUpdated);
      window.removeEventListener("storage", onStorage);
      clearInterval(watcher);
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      if (esRef.current) esRef.current.close();
    };
  }, [pathname, startTracking, handleStatusUpdate]);

  const handleClose = (forceRedirectHome = false) => {
    if (dbOrderId) {
      cleanupOrderStorage(dbOrderId);
    }
    setIsOpen(false);
    if (forceRedirectHome || (pathname && pathname.includes("/checkout"))) {
      window.location.href = "/";
    }
  };

  const handleContinueShopping = () => {
    handleClose(true);
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
    <div
      dir="rtl"
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4"
    >
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => handleClose(false)}
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
          onClick={() => handleClose(false)}
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
              <div
                className="inline-block px-2.5 py-0.5 mt-1 rounded-md bg-gray-50 border border-gray-200/80 text-[11px] font-mono text-gray-600"
                dir="ltr"
              >
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

                    <IconComp
                      size={16}
                      className="text-gray-400 group-hover:text-emerald-600 shrink-0 transition-colors"
                    />

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

            {/* Simple Dismiss / Continue Shopping Button */}
            <button
              onClick={handleContinueShopping}
              className="w-full py-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold transition shadow-xs cursor-pointer"
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
              <p
                className="text-[11px] text-gray-400 font-mono mb-2"
                dir="ltr"
              >
                #{orderNumber}
              </p>
            )}

            <p className="text-xs text-gray-500 leading-relaxed mb-4">
              نأسف، تم إلغاء طلبك من قبل الإدارة. لأي استفسار، يمكنك التواصل مع
              خدمة العملاء.
            </p>

            <div className="flex gap-2">
              <a
                href={`https://wa.me/966500000000?text=${encodeURIComponent(
                  `أستفسر عن إلغاء طلبي رقم ${orderNumber}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition"
              >
                <MessageCircle size={13} />
                واتساب الدعم
              </a>
              <button
                onClick={handleContinueShopping}
                className="py-2 px-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-semibold transition cursor-pointer"
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
