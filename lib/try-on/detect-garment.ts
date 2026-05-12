import type { GarmentCategory } from "@/lib/try-on/types";

import { categoryFromBytesStable, normalizeCategoryLabel } from "@/lib/try-on/garment-category";

async function detectWithGemini(
  garmentBytes: Buffer,
  mimeType: string,
): Promise<GarmentCategory | null> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return null;
  }

  const model = process.env.GEMINI_TRYON_MODEL ?? "gemini-1.5-flash";
  const b64 = garmentBytes.toString("base64");

  const body = {
    contents: [
      {
        parts: [
          {
            inlineData: {
              mimeType,
              data: b64,
            },
          },
          {
            text: `You classify one clothing product image into exactly one label for virtual try-on.
Reply with ONLY one token, one of: upper_body, lower_body, dresses.
Definitions:
- upper_body: shirts, sweaters, coats worn on torso/arms unless full-length dress.
- lower_body: pants, skirts, shorts.
- dresses: one-piece dresses or gowns.`,
          },
        ],
      },
    ],
  };

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();

      throw new Error(`Gemini garment detect failed: ${res.status} ${text}`);
    }

    const json = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };

    const text = json.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") ?? "";

    return normalizeCategoryLabel(text);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown Gemini error";

    console.warn("Gemini detect unavailable, falling back to deterministic:", message);
    return null;
  }
}

export type DetectGarmentInput = {
  garmentBytes: Buffer;
  mimeType: string;
};

/**
 * Attempts Gemini when GEMINI_API_KEY is set; otherwise uses a deterministic hash bucket.
 */
export async function detectGarmentCategory(input: DetectGarmentInput): Promise<{
  category: GarmentCategory;
  source: "gemini" | "deterministic";
}> {
  const geminiCategory = await detectWithGemini(input.garmentBytes, input.mimeType);

  if (geminiCategory) {
    return { category: geminiCategory, source: "gemini" };
  }

  return {
    category: categoryFromBytesStable(input.garmentBytes),
    source: "deterministic",
  };
}
