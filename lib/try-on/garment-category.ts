import { createHash } from "node:crypto";

import type { GarmentCategory } from "@/lib/try-on/types";

const CATEGORIES: GarmentCategory[] = ["upper_body", "lower_body", "dresses"];

/**
 * Maps arbitrary bytes to a stable category for demos when no vision API is configured.
 */
export function categoryFromBytesStable(buffer: Buffer): GarmentCategory {
  const hash = createHash("sha256").update(buffer).digest();
  const bucket = hash[0] % CATEGORIES.length;

  return CATEGORIES[bucket] ?? "upper_body";
}

export function normalizeCategoryLabel(raw: string): GarmentCategory {
  const normalized = raw.trim().toLowerCase().replace(/\s+/g, "_");

  if (normalized.includes("dress") || normalized === "dresses") {
    return "dresses";
  }

  if (
    normalized.includes("lower")
    || normalized.includes("bottom")
    || normalized.includes("pants")
    || normalized.includes("skirt")
  ) {
    return "lower_body";
  }

  if (
    normalized.includes("upper")
    || normalized.includes("top")
    || normalized.includes("shirt")
    || normalized.includes("jacket")
  ) {
    return "upper_body";
  }

  return "upper_body";
}
