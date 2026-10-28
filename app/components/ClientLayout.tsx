"use client";
import { usePathname } from "next/navigation";
import { Toaster } from "react-hot-toast";
import { Navbar } from "./navbar";
import WhatsappButton from "./WhatsappButton";
import SplashScreen from "./SplashScreen";
import OrderNotificationModal from "./OrderNotificationModal";
import { useCompanyStore } from "../store/companyStore";

export default function ClientLayout({
  children,
  footer,
  company,
}: {
  children: React.ReactNode;
  footer: React.ReactNode;
  company?: any;
}) {
  const pathname = usePathname();
  const isDocOrAdmin =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/invoice") ||
    pathname.startsWith("/orders") ||
    pathname.includes("/print") ||
    pathname.includes("/contract") ||
    pathname.includes("/receipt");

  if (company && !useCompanyStore.getState()._fetched) {
    const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    const fullLogo = company.logo
      ? (company.logo.startsWith("http") ? company.logo : `${API}${company.logo}`)
      : "";
    useCompanyStore.setState({
      logo: fullLogo,
      nameAr: company.nameAr || "",
      nameEn: company.nameEn || "",
      phone: company.phone || "",
      whatsapp: company.whatsapp || "",
      email: company.email || "",
      website: company.website || "",
      details: company.details || "",
      addressAr: company.addressAr || "",
      taxNumber: company.taxNumber || "",
      _fetched: true,
    });
  }

  const logo = company?.logo
    ? (company.logo.startsWith("http")
        ? company.logo
        : `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}${company.logo}`)
    : undefined;

  return (
    <>
      <Toaster position="top-center" reverseOrder={false} toastOptions={{ duration: 3500 }} />
      {!isDocOrAdmin && <SplashScreen />}
      {!isDocOrAdmin && <Navbar initialLogo={logo} />}
      {children}
      {!isDocOrAdmin && footer}
      {!isDocOrAdmin && <WhatsappButton />}
      {!isDocOrAdmin && <OrderNotificationModal />}
    </>
  );
}
