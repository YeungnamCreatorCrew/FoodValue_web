import Link from "next/link";
import type { ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";

interface BackHeaderProps {
  title: string;
  backHref: string; // 뒤로 가기를 눌렀을 때 갈 주소
  onBack?: () => void; // 있으면 주소 이동 대신 이 함수를 부른다 (예: 이전 화면으로 돌아가기)
  icon?: "chevron-left" | "arrow-left"; // 레시피 상세는 화살표(←) 아이콘을 쓴다
  right?: ReactNode; // 오른쪽에 놓을 것 (예: 삭제 버튼)
}

/** 하위 화면(등록, 상세 등)의 헤더: ‹ 제목 (오른쪽 버튼) */
export function BackHeader({ title, backHref, onBack, icon = "chevron-left", right }: BackHeaderProps) {
  const backClass = "flex size-[22px] shrink-0 items-center justify-center";
  return (
    <header className="flex h-14 shrink-0 items-center gap-3 bg-white px-4">
      {onBack ? (
        <button type="button" onClick={onBack} aria-label="뒤로 가기" className={backClass}>
          <Icon name={icon} size={22} />
        </button>
      ) : (
        <Link href={backHref} aria-label="뒤로 가기" className={backClass}>
          <Icon name={icon} size={22} />
        </Link>
      )}
      <h1 className="min-w-0 flex-1 text-xl font-semibold leading-7 tracking-[-0.5px] text-slate-900">
        {title}
      </h1>
      {right}
    </header>
  );
}
