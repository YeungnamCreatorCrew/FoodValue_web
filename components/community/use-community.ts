"use client";

import { useSyncExternalStore } from "react";
import { communityService } from "@/lib/community/mock-service";

export function useCommunity() {
  return useSyncExternalStore(communityService.subscribe, communityService.getSnapshot, communityService.getServerSnapshot);
}
