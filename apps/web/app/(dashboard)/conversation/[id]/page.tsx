"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ConversationScreen } from "@/features/conversation/components/ConversationScreen";

function ConversationContent() {
  const searchParams = useSearchParams();
  const level = searchParams.get("level") || "intermediate";
  const topic = searchParams.get("topic");

  return <ConversationScreen initialLevel={level} initialTopic={topic} />;
}

export default function WebConversationPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center bg-slate-950 text-white font-medium">Loading session...</div>}>
      <ConversationContent />
    </Suspense>
  );
}
