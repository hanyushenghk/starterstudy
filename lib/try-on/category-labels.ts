import type { Locale } from "@/i18n.config";
import { locales } from "@/i18n.config";
import type { GarmentCategory } from "@/lib/try-on/types";

const LABELS: Record<Locale, Record<GarmentCategory, string>> = {
  en: {
    upper_body: "Upper body",
    lower_body: "Lower body",
    dresses: "Dress",
  },
  zh: {
    upper_body: "上装",
    lower_body: "下装",
    dresses: "连衣裙",
  },
};

function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

export function categoryLabel(category: GarmentCategory, locale: string): string {
  const key: Locale = isLocale(locale) ? locale : "en";

  return LABELS[key][category];
}
