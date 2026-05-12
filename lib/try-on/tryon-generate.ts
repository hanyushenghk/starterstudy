import { generateImage } from "@/lib/volcano-engine/image";

import type { GarmentCategory } from "@/lib/try-on/types";

export type TryOnGenerateInput = {
  personBytes: Buffer;
  personMime: string;
  garmentBytes: Buffer;
  garmentMime: string;
  category: GarmentCategory;
};

export type TryOnGenerateResult = {
  imageBase64: string;
  mimeType: string;
  mode: "doubao" | "placeholder";
};

const DEFAULT_TRY_ON_MODEL = "doubao-seedream-4-5-251128";

const categoryToGarmentDescription: Record<GarmentCategory, string> = {
  upper_body: "上装（含外套/衬衫/T恤等上半身衣物）",
  lower_body: "下装（裤/裙等下半身衣物）",
  dresses: "连衣裙/连体裙装",
};

function buildTryOnPrompt(category: GarmentCategory): string {
  const garment = categoryToGarmentDescription[category];
  return [
    "The `image` array has TWO elements in this exact order (same as the user’s upload order):",
    "• images[0] = FIRST user upload = CUSTOMER PORTRAIT. This is the ONLY source for face shape, facial features, skin tone, hairstyle (length/color/style/hairline), ears, jewelry, body, pose, camera, and background. The final image must still be recognizably THIS person in THIS scene.",
    "• images[1] = SECOND user upload = GARMENT / CLOTHING REFERENCE ONLY (category: 「" +
      garment +
      "」). Extract ONLY the clothing: cut, color, pattern, fabric, seams, neckline, sleeves, hem, buttons. If images[1] shows a model wearing the product, IGNORE their face, hair, skin, pose, and background — those pixels must NOT appear in the output. Never copy that model’s hairstyle onto the customer.",
    "",
    "TASK — virtual try-on: Put the garment from images[1] onto the person from images[0]. The person must visibly wear the new outfit while keeping images[0]’s head, hair, face, and jewelry unchanged (except minor occlusion by collars).",
    "",
    "HARD RULES:",
    "1) Output head (face + hair) must match images[0] only — not anyone from images[1].",
    "2) Output clothing must match the item in images[1], not the old clothes on images[0].",
    "3) Do not return images[1] as the full frame (no “catalog copy”). Do not return images[0] unchanged if images[1] shows different clothing.",
    "【对应上传】images[0]=用户第一张（本人）；images[1]=用户第二张（衣服）。结果必须是第一张的人穿上第二张的衣服，禁止输出第二张里的模特脸或发型。",
  ].join("\n");
}

async function generateWithDoubao(input: TryOnGenerateInput): Promise<TryOnGenerateResult | null> {
  const token = (
    process.env.VOLCANO_ENGINE_API_KEY || process.env.ARK_API_KEY || ""
  ).trim();

  if (!token) {
    return null;
  }

  const model =
    process.env.TRY_ON_DOUBAO_MODEL?.trim()
    || process.env.DOUBAO_MODEL?.trim()
    || DEFAULT_TRY_ON_MODEL;

  if (process.env.NODE_ENV === "development") {
    console.info("[try-on] model:", model);
    console.info("[try-on] image[] order: [0]=portrait (1st upload), [1]=garment (2nd upload)");
  }

  const personDataUrl = `data:${input.personMime};base64,${input.personBytes.toString("base64")}`;
  const garmentDataUrl = `data:${input.garmentMime};base64,${input.garmentBytes.toString("base64")}`;
  const prompt = buildTryOnPrompt(input.category);

  try {
    const json = await generateImage(prompt, {
      model,
      inputImages: [personDataUrl, garmentDataUrl],
      size: "2K",
      watermark: true,
      sequential_image_generation: "disabled",
    });

    const first = json.data?.[0];
    const url = first?.url;

    if (!url) {
      throw new Error("No image URL in Ark response");
    }

    const imageRes = await fetch(url);

    if (!imageRes.ok) {
      throw new Error(`Failed to download Ark output: ${imageRes.status}`);
    }

    const buf = Buffer.from(await imageRes.arrayBuffer());

    return {
      imageBase64: buf.toString("base64"),
      mimeType: imageRes.headers.get("content-type") ?? "image/png",
      mode: "doubao",
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown Doubao error";

    console.warn("Doubao try-on unavailable, falling back to placeholder:", message);
    return null;
  }
}

/**
 * Virtual try-on: person (first upload) wears garment (second upload).
 * Uses the same `/images/generations` path as `lib/volcano-engine/image.ts` with a Seedream-class model.
 */
export async function generateTryOnImage(
  input: TryOnGenerateInput,
): Promise<TryOnGenerateResult> {
  const doubao = await generateWithDoubao(input);

  if (doubao) {
    return doubao;
  }

  return {
    imageBase64: input.personBytes.toString("base64"),
    mimeType: input.personMime,
    mode: "placeholder",
  };
}
