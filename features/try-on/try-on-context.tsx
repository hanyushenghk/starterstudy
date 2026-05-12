"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useLocale, useTranslations } from "next-intl";

import { categoryLabel } from "@/lib/try-on/category-labels";
import { appendHistory } from "@/lib/try-on/history-storage";
import type { GarmentCategory, TryOnMode, TryOnPhase } from "@/lib/try-on/types";

type TryOnResult = {
  dataUrl: string;
  mode: TryOnMode;
};

type DetectionSource = "gemini" | "deterministic";

type TryOnContextValue = {
  personPreviewUrl: string | null;
  garmentPreviewUrl: string | null;
  personFile: File | null;
  garmentFile: File | null;
  category: GarmentCategory | null;
  categoryDisplay: string | null;
  detectionSource: DetectionSource | null;
  phase: TryOnPhase;
  result: TryOnResult | null;
  error: string | null;
  setPersonFile: (file: File | null) => void;
  setGarmentFile: (file: File | null) => void;
  generate: () => Promise<void>;
  clearResult: () => void;
  resetSession: () => void;
};

const TryOnContext = createContext<TryOnContextValue | null>(null);

function revokeUrl(url: string | null) {
  if (url?.startsWith("blob:")) {
    URL.revokeObjectURL(url);
  }
}

function syncReadyState(args: {
  person: File | null;
  garment: File | null;
  cat: GarmentCategory | null;
}): TryOnPhase {
  if (args.person && args.garment && args.cat) {
    return "ready";
  }

  return "idle";
}

export function TryOnProvider({ children }: { children: React.ReactNode }) {
  const locale = useLocale();
  const t = useTranslations("demo.tryOn");

  const [personFile, setPersonFileState] = useState<File | null>(null);
  const [garmentFile, setGarmentFileState] = useState<File | null>(null);
  const [personPreviewUrl, setPersonPreviewUrl] = useState<string | null>(null);
  const [garmentPreviewUrl, setGarmentPreviewUrl] = useState<string | null>(null);
  const [category, setCategory] = useState<GarmentCategory | null>(null);
  const [detectionSource, setDetectionSource] = useState<DetectionSource | null>(null);
  const [phase, setPhase] = useState<TryOnPhase>("idle");
  const [result, setResult] = useState<TryOnResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const personRevokeRef = useRef<string | null>(null);
  const garmentRevokeRef = useRef<string | null>(null);
  const garmentVersionRef = useRef(0);
  const personFileRef = useRef<File | null>(null);

  const applyReadyOrIdle = useCallback((next: {
    person: File | null;
    garment: File | null;
    cat: GarmentCategory | null;
  }) => {
    setPhase(syncReadyState(next));
  }, []);

  const setPersonFile = useCallback(
    (file: File | null) => {
      setError(null);
      setResult(null);
      revokeUrl(personRevokeRef.current);
      personRevokeRef.current = null;

      if (!file) {
        personFileRef.current = null;
        setPersonFileState(null);
        setPersonPreviewUrl(null);
        applyReadyOrIdle({ person: null, garment: garmentFile, cat: category });

        return;
      }

      const url = URL.createObjectURL(file);

      personRevokeRef.current = url;
      personFileRef.current = file;
      setPersonFileState(file);
      setPersonPreviewUrl(url);
      applyReadyOrIdle({ person: file, garment: garmentFile, cat: category });
    },
    [applyReadyOrIdle, garmentFile, category],
  );

  const setGarmentFile = useCallback(
    (file: File | null) => {
      setError(null);
      setResult(null);
      setCategory(null);
      setDetectionSource(null);
      revokeUrl(garmentRevokeRef.current);
      garmentRevokeRef.current = null;

      if (!file) {
        setGarmentFileState(null);
        setGarmentPreviewUrl(null);
        applyReadyOrIdle({ person: personFile, garment: null, cat: null });

        return;
      }

      const url = URL.createObjectURL(file);

      garmentRevokeRef.current = url;
      setGarmentFileState(file);
      setGarmentPreviewUrl(url);
      setPhase("detecting");
    },
    [applyReadyOrIdle, personFile],
  );

  useEffect(() => {
    if (!garmentFile) {
      return;
    }

    const token = garmentVersionRef.current + 1;

    garmentVersionRef.current = token;

    const run = async () => {
      setError(null);

      const body = new FormData();

      body.append("garment", garmentFile);
      body.append("locale", locale);

      try {
        const res = await fetch("/api/detect-category", {
          method: "POST",
          body,
        });
        const json = (await res.json()) as {
          category?: GarmentCategory;
          source?: DetectionSource;
          error?: string;
        };

        if (garmentVersionRef.current !== token) {
          return;
        }

        if (!res.ok) {
          throw new Error(json.error ?? "Failed to classify garment.");
        }

        if (!json.category) {
          throw new Error("Missing category from server.");
        }

        setCategory(json.category);
        setDetectionSource(json.source ?? "deterministic");
        setPhase(
          syncReadyState({
            person: personFileRef.current,
            garment: garmentFile,
            cat: json.category,
          }),
        );
      } catch (err) {
        if (garmentVersionRef.current !== token) {
          return;
        }

        const message = err instanceof Error ? err.message : "Detection failed";

        setError(message);
        setPhase("error");
      }
    };

    void run();
  }, [garmentFile, locale]);

  const generate = useCallback(async () => {
    if (!personFile || !garmentFile || !category) {
      setError(t("needBothForGenerate"));

      return;
    }

    setPhase("generating");
    setError(null);

    const body = new FormData();

    body.append("person", personFile);
    body.append("garment", garmentFile);
    body.append("category", category);

    try {
      const res = await fetch("/api/try-on", {
        method: "POST",
        body,
      });
      const json = (await res.json()) as {
        imageBase64?: string;
        mimeType?: string;
        mode?: "doubao" | "placeholder";
        error?: string;
      };

      if (!res.ok) {
        throw new Error(json.error ?? "Try-on failed.");
      }

      if (!json.imageBase64 || !json.mimeType) {
        throw new Error("Malformed try-on response.");
      }

      const mode: TryOnMode = json.mode === "doubao" ? "live" : "placeholder";
      const dataUrl = `data:${json.mimeType};base64,${json.imageBase64}`;

      setResult({ dataUrl, mode });
      setPhase("success");
      appendHistory({
        category,
        resultDataUrl: dataUrl,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Try-on failed";

      setError(message);
      setPhase("error");
    }
  }, [personFile, garmentFile, category, t]);

  const clearResult = useCallback(() => {
    setResult(null);
    setPhase(syncReadyState({ person: personFile, garment: garmentFile, cat: category }));
    setError(null);
  }, [personFile, garmentFile, category]);

  const resetSession = useCallback(() => {
    setPersonFile(null);
    setGarmentFile(null);
  }, [setPersonFile, setGarmentFile]);

  useEffect(
    () => () => {
      revokeUrl(personRevokeRef.current);
      revokeUrl(garmentRevokeRef.current);
    },
    [],
  );

  const categoryDisplay = category ? categoryLabel(category, locale) : null;

  const value = useMemo<TryOnContextValue>(
    () => ({
      personPreviewUrl,
      garmentPreviewUrl,
      personFile,
      garmentFile,
      category,
      categoryDisplay,
      detectionSource,
      phase,
      result,
      error,
      setPersonFile,
      setGarmentFile,
      generate,
      clearResult,
      resetSession,
    }),
    [
      personPreviewUrl,
      garmentPreviewUrl,
      personFile,
      garmentFile,
      category,
      categoryDisplay,
      detectionSource,
      phase,
      result,
      error,
      setPersonFile,
      setGarmentFile,
      generate,
      clearResult,
      resetSession,
    ],
  );

  return <TryOnContext.Provider value={value}>{children}</TryOnContext.Provider>;
}

export function useTryOn(): TryOnContextValue {
  const ctx = useContext(TryOnContext);

  if (!ctx) {
    throw new Error("useTryOn must be used within TryOnProvider");
  }

  return ctx;
}
