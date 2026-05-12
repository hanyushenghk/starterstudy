import type { Metadata } from "next";

import { locales, type Locale } from "@/i18n.config";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale = isLocale(raw) ? raw : "en";
  const title = locale === "zh" ? "虚拟试衣" : "Virtual try-on";
  const description =
    locale === "zh"
      ? "上传人像与服装图，生成购物参考用的试衣预览。"
      : "Upload a portrait and a garment image to generate a shopping-reference try-on preview.";

  return {
    title,
    description,
    robots: { index: true, follow: true },
  };
}

export default function TryOnDemoLayout({ children }: { children: React.ReactNode }) {
  return children;
}
