import React, { Suspense, lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { HudWorkspaceGhost } from "@/components/hud/HudGhostSkeletons";
import { privatePageSeo, xRobotsNoindexHeaders } from "@/lib/seo";

const LazyPremiumView = lazy(() => import("@/components/hud/PremiumView"));

function PremiumPage() {
  return (
    <Suspense fallback={<HudWorkspaceGhost />}>
      <LazyPremiumView />
    </Suspense>
  );
}

export const Route = createFileRoute("/_hud/premium")({
  headers: () => xRobotsNoindexHeaders(),
  head: () => ({
    meta: [
      ...privatePageSeo({
        title: "Oracle MAX | Moltology",
        description:
          "Explore Oracle MAX: Oracle Abyss, our advanced model, and 10× the free message allowance.",
      }),
    ],
  }),
  component: PremiumPage,
  pendingComponent: HudWorkspaceGhost,
});
