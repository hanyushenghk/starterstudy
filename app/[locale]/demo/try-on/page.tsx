"use client";

import { Background } from "@/components/background";
import { TryOnProvider } from "@/features/try-on/try-on-context";
import { TryOnWorkspace } from "@/features/try-on/try-on-workspace";

export default function TryOnDemoPage() {
  return (
    <div className="relative min-h-screen">
      <Background />
      <div className="relative z-10 pt-24 pb-12">
        <TryOnProvider>
          <TryOnWorkspace />
        </TryOnProvider>
      </div>
    </div>
  );
}
