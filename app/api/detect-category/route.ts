import { NextResponse } from "next/server";

import { defaultLocale, locales, type Locale } from "@/i18n.config";
import { categoryLabel } from "@/lib/try-on/category-labels";
import { detectGarmentCategory } from "@/lib/try-on/detect-garment";

export const runtime = "nodejs";

const MAX_BYTES = 12 * 1024 * 1024;

const allowedMime = new Set(["image/jpeg", "image/png", "image/webp"]);

function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("garment");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Expected garment file field." }, { status: 400 });
    }

    if (!allowedMime.has(file.type)) {
      return NextResponse.json(
        { error: "Unsupported image type. Use JPEG, PNG, or WebP." },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    if (buffer.byteLength > MAX_BYTES) {
      return NextResponse.json({ error: "Image too large (max 12MB)." }, { status: 400 });
    }

    const { category, source } = await detectGarmentCategory({
      garmentBytes: buffer,
      mimeType: file.type,
    });

    const localeRaw = form.get("locale");
    const locale: Locale =
      typeof localeRaw === "string" && isLocale(localeRaw) ? localeRaw : defaultLocale;

    return NextResponse.json({
      category,
      label: categoryLabel(category, locale),
      source,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Detection failed";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
