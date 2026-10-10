import Link from "next/link";
import { FigmaIcon } from "@/components/home/figma-icon";
import { homeRoutes } from "@/lib/home/routes";

const tabs = [
  { key: "home", label: "홈", private: false },
  { key: "fridge", label: "냉장고", private: true },
  { key: "prices", label: "시세", private: false },
  { key: "recipes", label: "레시피", private: true },
  { key: "community", label: "커뮤니티", private: false },
] as const;

export function BottomNavigation({ isLoggedIn }: { isLoggedIn: boolean }) {
  return (
    <nav aria-label="주 메뉴" className="fixed bottom-0 left-1/2 z-20 w-full max-w-[390px] -translate-x-1/2 border-t border-border bg-white pb-[env(safe-area-inset-bottom)]">
      <div className="flex h-[67px] items-center px-2.5">
        {tabs.map((tab) => (
          <Link key={tab.key} href={tab.private && !isLoggedIn ? homeRoutes.login : homeRoutes[tab.key]}
            prefetch={false} aria-current={tab.key === "home" ? "page" : undefined}
            className={`flex h-[60px] min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-lg text-xs hover:bg-home-background ${tab.key === "home" ? "text-primary" : "text-muted"}`}>
            <FigmaIcon name={tab.key} />
            <span>{tab.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
