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
  const title = locale === "zh" ? "试衣历史" : "Try-on history";
  const description =
    locale === "zh"
      ? "试衣预览保存在本浏览器（本地存储）。"
      : "Try-on previews saved in this browser (local storage).";

  return {
    title,
    description,
    robots: { index: false, follow: true },
  };
}

export default function TryOnHistoryLayout({ children }: { children: React.ReactNode }) {
  return children;
}
