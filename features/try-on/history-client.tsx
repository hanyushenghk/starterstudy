"use client";

import Image from "next/image";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { Trash2 } from "lucide-react";

import { Button } from "@/components/button";
import { Container } from "@/components/container";
import { categoryLabel } from "@/lib/try-on/category-labels";
import {
  deleteHistoryEntry,
  loadHistory,
  type HistoryEntry,
} from "@/lib/try-on/history-storage";

export function TryOnHistoryClient() {
  const locale = useLocale();
  const t = useTranslations("demo.tryOnHistory");
  const [rows, setRows] = useState<HistoryEntry[]>(() => loadHistory());

  return (
    <Container>
      <div className="space-y-8 py-8">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t("sectionLabel")}
          </p>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">{t("title")}</h1>
          <p className="text-muted-foreground">{t("lead")}</p>
        </div>

        {rows.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
            <h2 className="text-lg font-semibold">{t("emptyTitle")}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{t("emptyDesc")}</p>
            <Button as={Link} href={`/${locale}/demo/try-on`} variant="primary" className="mt-6">
              {t("startTryOn")}
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map((row) => (
              <div
                key={row.id}
                className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
              >
                <div className="relative aspect-[3/4] bg-muted">
                  <Image
                    src={row.resultDataUrl}
                    alt={t("previewAlt")}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <div className="space-y-3 p-4">
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <span className="text-muted-foreground">
                      {categoryLabel(row.category, locale)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(row.createdAt).toLocaleString(
                        locale === "zh" ? "zh-CN" : "en-US",
                      )}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <a
                      href={row.resultDataUrl}
                      download={`tryon-${row.id}.png`}
                      className="inline-flex flex-1 items-center justify-center rounded-full border border-border bg-muted px-3 py-2 text-center text-sm font-medium hover:bg-muted/80"
                    >
                      {t("download")}
                    </a>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-1"
                      onClick={() => {
                        setRows(deleteHistoryEntry(row.id));
                      }}
                    >
                      <Trash2 className="size-4" aria-hidden />
                      {t("delete")}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Container>
  );
}
