import { NextResponse } from "next/server";

import { generateTryOnImage } from "@/lib/try-on/tryon-generate";
import type { GarmentCategory } from "@/lib/try-on/types";

export const runtime = "nodejs";
export const maxDuration = 120;

/** Per-file cap keeps two-image FormData under typical serverless body limits (~4.5MB incl. multipart). */
const MAX_BYTES = 2 * 1024 * 1024;

const allowedMime = new Set(["image/jpeg", "image/png", "image/webp"]);

function isGarmentCategory(value: string): value is GarmentCategory {
  return value === "upper_body" || value === "lower_body" || value === "dresses";
}

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const person = form.get("person");
    const garment = form.get("garment");
    const categoryRaw = form.get("category");

    if (!(person instanceof File) || !(garment instanceof File)) {
      return NextResponse.json(
        { error: "Expected person and garment file fields." },
        { status: 400 },
      );
    }

    if (typeof categoryRaw !== "string" || !isGarmentCategory(categoryRaw)) {
      return NextResponse.json(
        { error: "Invalid or missing category." },
        { status: 400 },
      );
    }

    if (!allowedMime.has(person.type) || !allowedMime.has(garment.type)) {
      return NextResponse.json(
        { error: "Unsupported image type. Use JPEG, PNG, or WebP." },
        { status: 400 },
      );
    }

    const personBytes = Buffer.from(await person.arrayBuffer());
    const garmentBytes = Buffer.from(await garment.arrayBuffer());

    if (personBytes.byteLength > MAX_BYTES || garmentBytes.byteLength > MAX_BYTES) {
      return NextResponse.json(
        { error: "Image too large after upload (max 2MB each on this host). Use smaller originals or rely on browser compression." },
        { status: 400 },
      );
    }

    const result = await generateTryOnImage({
      personBytes,
      personMime: person.type,
      garmentBytes,
      garmentMime: garment.type,
      category: categoryRaw,
    });

    return NextResponse.json({
      imageBase64: result.imageBase64,
      mimeType: result.mimeType,
      mode: result.mode,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Try-on failed";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
