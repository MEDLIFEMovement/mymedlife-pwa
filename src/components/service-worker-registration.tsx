"use client";

import { useEffect } from "react";

import {
  pwaOfflineSupport,
  shouldRegisterServiceWorker,
} from "@/services/pwa-offline-support";

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (
      !shouldRegisterServiceWorker({
        nodeEnv: process.env.NODE_ENV,
        explicitFlag: process.env.NEXT_PUBLIC_MYMEDLIFE_ENABLE_SERVICE_WORKER,
      })
    ) {
      return;
    }

    if (!("serviceWorker" in navigator)) {
      return;
    }

    navigator.serviceWorker
      .register(pwaOfflineSupport.serviceWorkerPath, { scope: "/" })
      .catch(() => undefined);
  }, []);

  return null;
}
