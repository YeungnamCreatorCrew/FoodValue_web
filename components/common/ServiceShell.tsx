"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { FloatingMenu } from "./FloatingMenu";

export function ServiceShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return <div className="service-shell price-service-shell">
    <FloatingMenu key={pathname} />
    <div className={`mx-auto flex min-h-[calc(100dvh-72px)] w-full flex-col ${pathname === "/" || pathname === "/prices" || pathname.startsWith("/prices/") ? "max-w-[1560px]" : "max-w-[430px] bg-slate-50 md:max-w-[720px] lg:max-w-[960px]"}`}>
      <div className="flex min-w-0 flex-1 flex-col">{children}</div>
    </div>
  </div>;
}
