import Link from "next/link";
import type { ReactNode } from "react";
import { homeRoutes } from "@/lib/home/routes";
import type { HomeCommunityPost, HomeData, HomeUser } from "@/lib/home/types";
import { FigmaIcon } from "./figma-icon";
import { PriceCarousel } from "./price-carousel";

const categoryLabels: Record<HomeCommunityPost["category"], { label: string; tone: string }> = {
  RECIPE_SHARE: { label: "레시피", tone: "bg-emerald-50 text-emerald-700" },
  GROUP_BUY: { label: "소분 모집", tone: "bg-amber-50 text-amber-700" },
  SHOWOFF: { label: "요리 자랑", tone: "bg-slate-100 text-slate-600" },
};

function ActionLink({ href, children }: { href: string; children: ReactNode }) {
  return <Link href={href} prefetch={false} className="flex min-h-11 w-full items-center justify-center rounded-lg bg-primary px-4 py-2 text-[13px] leading-5 font-semibold text-white transition-colors hover:bg-green-900">{children}</Link>;
}

function MoreLink({ href, label }: { href: string; label: string }) {
  return <Link href={href} prefetch={false} aria-label={label} className="-my-2 flex min-h-11 shrink-0 items-center justify-end gap-0.5 rounded text-[11px] font-medium text-muted hover:text-primary">더보기<FigmaIcon name="chevron" /></Link>;
}

export function HomeScreen({ user, data }: { user: HomeUser; data: HomeData }) {
  const isLoggedIn = user !== null;

  return (
    <div className="flex min-w-0 flex-1 flex-col bg-slate-50">
      <a href="#home-content" className="sr-only focus:not-sr-only focus:block focus:bg-white focus:p-3">본문 바로가기</a>
      <header className="flex h-14 shrink-0 items-center justify-between gap-3 bg-white px-5">
        <Link href={homeRoutes.home} className="flex min-h-11 items-center text-xl leading-7 font-semibold tracking-[-0.1px] text-primary" aria-label="FoodValue 홈">FoodValue</Link>
        {user ? (
          <Link href={homeRoutes.mypage} prefetch={false} aria-label={`${user.nickname} 마이페이지`} className="flex min-h-11 min-w-11 items-center justify-center rounded-full">
            <span className="relative flex size-8 items-center justify-center"><FigmaIcon name="avatar" /><span className="absolute text-xs">FV</span></span>
          </Link>
        ) : (
          <Link href={homeRoutes.login} prefetch={false} className="flex min-h-11 items-center rounded-lg px-3 text-[13px] font-semibold text-primary hover:bg-emerald-50">로그인</Link>
        )}
      </header>

      <main id="home-content" className="grid min-w-0 flex-1 content-start gap-[22px] px-4 py-2.5 md:grid-cols-2">
        <div className="md:col-span-2">
          <h1 className="text-[21px] leading-7 font-bold tracking-[-0.147px] break-keep">오늘 식재료, 언제 사면 좋을까요?</h1>
          <p className="mt-1 text-[10px] leading-[15px] text-muted"><time dateTime={data.priceDate}>{data.priceDate.replaceAll("-", ". ")}</time> 기준 · 전국 평균 · 샘플 시세</p>
        </div>

        <section aria-labelledby="prices-title" className="min-w-0 md:col-span-2">
          <div className="mb-2.5">
            <h2 id="prices-title" className="text-[17px] leading-6 font-bold tracking-[-0.068px]">오늘 시세 &amp; AI 7일 예측</h2>
            <p className="mt-0.5 text-[11px] leading-4 text-muted">주요 장바구니 품목의 가격과 구매 타이밍</p>
          </div>
          <PriceCarousel prices={data.prices} />
          <ActionLink href={homeRoutes.prices}>시세 자세히 보기</ActionLink>
        </section>

        <section aria-labelledby="fridge-title" className="flex flex-col gap-2">
          <h2 id="fridge-title" className="text-[17px] leading-6 font-bold tracking-[-0.068px]">내 냉장고</h2>
          {user && data.fridge ? (
            <>
              <div className="flex min-h-[76px] items-center gap-2 rounded-[10px] border border-border bg-white p-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50"><FigmaIcon name="refrigerator" /></div>
                <dl className="flex flex-1 items-center divide-x divide-border text-center">
                  <div className="flex flex-1 flex-col-reverse gap-0.5">
                    <dt className="text-[11px] leading-[14px] text-muted">보유 재료</dt>
                    <dd className="text-lg leading-[22px] font-bold text-primary">{data.fridge.ingredientCount}개</dd>
                  </div>
                  <div className="flex flex-1 flex-col-reverse gap-0.5">
                    <dt className="text-[11px] leading-[14px] text-muted">부족 예상</dt>
                    <dd className="text-lg leading-[22px] font-bold text-amber-700">{data.fridge.lowStockCount}개</dd>
                  </div>
                </dl>
              </div>
              <Link href={homeRoutes.fridge} prefetch={false} className="flex min-h-11 items-center justify-center gap-1 rounded-lg border border-border bg-white text-[13px] font-semibold text-primary">내 냉장고 보기<FigmaIcon name="chevron" /></Link>
            </>
          ) : (
            <div className="rounded-[10px] border border-border bg-white p-3.5">
              <div className="mb-3 flex items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50"><FigmaIcon name="refrigerator" /></div>
                <p className="text-[13px] leading-5 text-muted break-keep">로그인하면 내 식재료를 등록하고 관리할 수 있어요.</p>
              </div>
              <ActionLink href={homeRoutes.login}>로그인하고 시작하기</ActionLink>
            </div>
          )}
          <section aria-labelledby="recipe-title" className="rounded-[10px] bg-emerald-50 p-3.5">
            <h3 id="recipe-title" className="text-sm leading-5 font-medium text-primary">오늘 뭐 먹지?</h3>
            <p className="mt-2 mb-3 text-xs leading-[18px] text-muted break-keep">냉장고에 있는 재료로<br />AI에게 메뉴를 추천받아보세요.</p>
            <ActionLink href={isLoggedIn ? homeRoutes.recipes : homeRoutes.login}>{isLoggedIn ? "AI 레시피 추천받기" : "로그인하고 메뉴 추천받기"}</ActionLink>
          </section>
        </section>

        <section aria-labelledby="community-title">
          <div className="mb-2 flex items-center justify-between gap-2">
            <h2 id="community-title" className="text-[17px] leading-6 font-bold tracking-[-0.068px]">커뮤니티 최신글</h2>
            <MoreLink href={homeRoutes.community} label="커뮤니티 최신글 더보기" />
          </div>
          <ul className="divide-y divide-border rounded-[10px] border border-border bg-white">
            {data.posts.map((post) => (
              <li key={post.id}>
                <Link href={homeRoutes.post(post.id)} prefetch={false} className="block min-h-[68px] rounded-[10px] px-3 py-3 hover:bg-slate-50">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className={`shrink-0 rounded-full px-[7px] py-0.5 text-[10px] leading-[14px] font-semibold ${categoryLabels[post.category].tone}`}>{categoryLabels[post.category].label}</span>
                    <p className="min-w-0 flex-1 truncate text-xs leading-[18px] font-medium">{post.title}</p>
                    {post.hasImage && <span className="shrink-0 text-[10px] text-muted" aria-label="사진 첨부">사진</span>}
                  </div>
                  <div className="mt-1.5 flex min-w-0 items-center justify-between gap-2 text-[10px] leading-[14px] text-muted">
                    <span className="truncate">{post.nickname}</span>
                    <span className="flex shrink-0 items-center gap-1"><FigmaIcon name="comment" /><span className="sr-only">댓글 </span>{post.commentCount}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
