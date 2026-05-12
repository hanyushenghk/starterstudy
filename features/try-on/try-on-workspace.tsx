"use client";

import Link from "next/link";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { AlertTriangle, Info, Loader2, Sparkles, Wand2 } from "lucide-react";

import { Button } from "@/components/button";
import { Container } from "@/components/container";
import { ImageDropZone } from "@/features/try-on/image-drop-zone";
import { useTryOn } from "@/features/try-on/try-on-context";
import { cn } from "@/lib/utils";

export function TryOnWorkspace() {
  const locale = useLocale();
  const t = useTranslations("demo.tryOn");
  const {
    personPreviewUrl,
    garmentPreviewUrl,
    phase,
    categoryDisplay,
    detectionSource,
    result,
    error,
    setPersonFile,
    setGarmentFile,
    generate,
    clearResult,
    resetSession,
    personFile,
    garmentFile,
  } = useTryOn();

  const busy = phase === "detecting" || phase === "generating";
  const canGenerate = Boolean(personFile && garmentFile && phase === "ready");

  return (
    <Container>
      <div className="space-y-8 py-8">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t("sectionLabel")}
          </p>
          <h1 className="text-3xl font-bold text-foreground md:text-4xl">{t("title")}</h1>
          <p className="max-w-2xl text-muted-foreground">{t("lead")}</p>
          <p className="text-lg font-medium text-foreground">{t("freeTries")}</p>
        </div>

        <div
          className="flex gap-3 rounded-xl border border-border bg-muted/30 p-4"
          role="note"
        >
          <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-600" aria-hidden />
          <div>
            <p className="font-medium text-foreground">{t("refOnlyTitle")}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t("refOnlyDesc")}</p>
          </div>
        </div>

        {error ? (
          <div
            className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive"
            role="alert"
          >
            <p className="font-medium">{t("errorTitle")}</p>
            <p className="mt-1">{error}</p>
          </div>
        ) : null}

        <div
          className="flex gap-3 rounded-xl border border-blue-500/30 bg-blue-500/5 p-4 text-sm"
          role="note"
        >
          <Info className="mt-0.5 size-5 shrink-0 text-blue-600 dark:text-blue-400" aria-hidden />
          <div>
            <p className="font-medium text-foreground">{t("garmentTipTitle")}</p>
            <p className="mt-1 text-muted-foreground">{t("garmentTipDesc")}</p>
          </div>
        </div>

        <p className="text-sm text-muted-foreground">{t("preserveDetailNote")}</p>

        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                <Sparkles className="size-5" aria-hidden />
                {t("uploadCardTitle")}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">{t("uploadCardDesc")}</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-3 rounded-xl border border-dashed border-border bg-muted/20 p-4">
                <div>
                  <h3 className="text-base font-semibold">{t("yourPhoto")}</h3>
                  <p className="text-xs text-muted-foreground">{t("yourPhotoDesc")}</p>
                </div>
                <ImageDropZone
                  label={t("personLabel")}
                  description={t("personDesc")}
                  replaceLabel={t("dropReplace")}
                  uploadLabel={t("dropUpload")}
                  formatsHint={t("dropFormats")}
                  previewUrl={personPreviewUrl}
                  disabled={busy}
                  onFile={setPersonFile}
                />
              </div>

              <div className="space-y-3 rounded-xl border border-dashed border-border bg-muted/20 p-4">
                <div>
                  <h3 className="text-base font-semibold">{t("clothingTitle")}</h3>
                  <p className="text-xs text-muted-foreground">{t("clothingDesc")}</p>
                </div>
                <ImageDropZone
                  label={t("garmentLabel")}
                  description={t("garmentDesc")}
                  replaceLabel={t("dropReplace")}
                  uploadLabel={t("dropUpload")}
                  formatsHint={t("dropFormats")}
                  previewUrl={garmentPreviewUrl}
                  disabled={busy}
                  onFile={setGarmentFile}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-muted-foreground">{t("detectedCategory")}</span>
              {categoryDisplay ? (
                <span className="rounded-md bg-muted px-2 py-1 text-sm font-medium text-foreground">
                  {categoryDisplay}
                </span>
              ) : (
                <span className="rounded-md border border-dashed border-border px-2 py-1 text-sm text-muted-foreground">
                  {t("waitingCategory")}
                </span>
              )}
              {detectionSource ? (
                <span className="text-xs text-muted-foreground">
                  (
                  {detectionSource === "gemini" ? t("visionModel") : t("localFallback")}
                  )
                </span>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="primary"
                className="gap-2"
                disabled={!canGenerate || busy}
                onClick={() => void generate()}
              >
                {phase === "generating" ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                    {t("generating")}
                  </>
                ) : (
                  <>
                    <Wand2 className="size-4" aria-hidden />
                    {t("generatePreview")}
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={busy}
                onClick={() => clearResult()}
              >
                {t("clearResult")}
              </Button>
              <Button type="button" variant="simple" onClick={() => resetSession()}>
                {t("resetSession")}
              </Button>
            </div>

            {phase === "detecting" ? (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" aria-hidden />
                {t("detecting")}
              </p>
            ) : null}
          </div>

          <div className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div>
              <h2 className="text-lg font-semibold">{t("previewTitle")}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{t("previewDesc")}</p>
            </div>

            {result?.dataUrl ? (
              <>
                {result.mode === "placeholder" ? (
                  <div
                    className="flex gap-3 rounded-xl border-2 border-amber-500/50 bg-amber-500/10 p-4 text-sm"
                    role="status"
                  >
                    <Info className="mt-0.5 size-5 shrink-0 text-amber-700 dark:text-amber-400" aria-hidden />
                    <div>
                      <p className="font-semibold text-foreground">{t("placeholderTitle")}</p>
                      <p className="mt-1 text-muted-foreground">{t("placeholderDesc")}</p>
                    </div>
                  </div>
                ) : null}
                <div className="overflow-hidden rounded-xl border bg-muted/30">
                  <Image
                    src={result.dataUrl}
                    alt={t("previewAlt")}
                    width={900}
                    height={1200}
                    className="w-full object-contain"
                    unoptimized
                  />
                </div>
                <a
                  href={result.dataUrl}
                  download="tryon-preview.png"
                  className={cn(
                    "inline-flex items-center justify-center rounded-full border border-border bg-muted px-4 py-2 text-sm font-medium transition hover:bg-muted/80",
                  )}
                >
                  {t("downloadPng")}
                </a>
              </>
            ) : (
              <div className="flex min-h-[320px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-muted/30 p-8 text-center text-sm text-muted-foreground">
                <Wand2 className="size-10 opacity-40" aria-hidden />
                <p>{t("emptyPreview")}</p>
                <Link
                  href={`/${locale}/demo/try-on/history`}
                  className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                >
                  {t("emptyPreviewLink")}
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </Container>
  );
}
