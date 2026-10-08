import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-1 bg-canvas text-[#202923] [color-scheme:light]">
      <main className="mx-auto min-h-svh w-full max-w-[390px] bg-white px-6 pt-12 pb-[max(2rem,env(safe-area-inset-bottom))] sm:my-8 sm:min-h-[calc(100svh-4rem)] sm:rounded-3xl sm:border sm:border-border">
        <div className="mb-10 text-2xl font-bold tracking-tight text-primary">
          FoodValue
        </div>
        {children}
      </main>
    </div>
  );
}
