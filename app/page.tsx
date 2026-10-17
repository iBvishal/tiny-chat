import React, { Suspense } from "react";

import HomePageContent from "@/components/home-page-content";

export default function Home() {
  return (
    <Suspense
      fallback={<div className="flex h-screen items-center justify-center">Loading...</div>}
    >
      <HomePageContent />
    </Suspense>
  );
}
