"use client";

import { Background } from "@/components/background";
import { TryOnHistoryClient } from "@/features/try-on/history-client";

export default function TryOnHistoryPage() {
  return (
    <div className="relative min-h-screen">
      <Background />
      <div className="relative z-10 pt-24 pb-12">
        <TryOnHistoryClient />
      </div>
    </div>
  );
}
