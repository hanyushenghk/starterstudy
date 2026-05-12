"use client";

import { useId, useRef } from "react";

import Image from "next/image";

import { Upload } from "lucide-react";

import { Button } from "@/components/button";
import { Label } from "@/components/ui/label";

type ImageDropZoneProps = {
  label: string;
  description: string;
  replaceLabel?: string;
  uploadLabel?: string;
  formatsHint?: string;
  previewUrl: string | null;
  disabled?: boolean;
  onFile: (file: File | null) => void;
};

export function ImageDropZone({
  label,
  description,
  replaceLabel = "Replace",
  uploadLabel = "Upload",
  formatsHint = "JPEG, PNG, or WebP",
  previewUrl,
  disabled,
  onFile,
}: ImageDropZoneProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement | null>(null);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={inputId}>{label}</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
        >
          <Upload className="size-4" aria-hidden />
          {previewUrl ? replaceLabel : uploadLabel}
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">{description}</p>
      <input
        id={inputId}
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        disabled={disabled}
        onChange={(event) => {
          const file = event.target.files?.[0] ?? null;

          onFile(file);

          event.target.value = "";
        }}
      />
      <div className="relative flex min-h-[220px] items-center justify-center overflow-hidden rounded-xl border border-dashed bg-muted/40">
        {previewUrl ? (
          <Image
            src={previewUrl}
            alt=""
            width={800}
            height={1000}
            className="max-h-[360px] w-full object-contain"
            unoptimized
          />
        ) : (
          <div className="flex flex-col items-center gap-2 p-6 text-center text-sm text-muted-foreground">
            <Upload className="size-8 opacity-60" aria-hidden />
            <span>{formatsHint}</span>
          </div>
        )}
      </div>
    </div>
  );
}
