import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) return new NextResponse("missing url", { status: 400 });

  // منع SSRF — يسمح فقط بـ Cloudinary
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return new NextResponse("invalid url", { status: 400 });
  }

  const isAllowedHost =
    parsed.hostname === "res.cloudinary.com" ||
    parsed.hostname.endsWith(".cloudinary.com");

  if (!isAllowedHost) {
    return new NextResponse("forbidden", { status: 403 });
  }

  // تحويل مسار الـ upload إلى raw إن وُجد والتخلص من أي fl_attachment
  const rawUrl = url
    .replace("/image/upload/", "/raw/upload/")
    .replace(/\/fl_attachment:[^/]+\//, "/");

  let res = await fetch(rawUrl);
  if (!res.ok && rawUrl !== url) {
    const fallback = await fetch(url);
    if (fallback.ok) {
      res = fallback;
    }
  }

  if (!res.ok) return new NextResponse("failed", { status: res.status });

  const body = await res.arrayBuffer();
  const buffer = Buffer.from(body);

  let contentType = "application/pdf";
  let filename = "document.pdf";

  // الكشف عن نوع الملف عبر الـ Magic Bytes
  if (
    buffer.length >= 4 &&
    buffer[0] === 0x25 && // %
    buffer[1] === 0x50 && // P
    buffer[2] === 0x44 && // D
    buffer[3] === 0x46    // F
  ) {
    contentType = "application/pdf";
    filename = "document.pdf";
  } else if (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    contentType = "image/jpeg";
    filename = "image.jpg";
  } else if (
    buffer.length >= 4 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    contentType = "image/png";
    filename = "image.png";
  } else if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    contentType = "image/webp";
    filename = "image.webp";
  } else {
    const upstreamType = res.headers.get("content-type");
    if (upstreamType && upstreamType !== "application/octet-stream") {
      contentType = upstreamType;
    } else {
      contentType = "application/pdf";
      filename = "document.pdf";
    }
  }

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `inline; filename="${filename}"`,
      "Content-Length": String(buffer.length),
      "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
