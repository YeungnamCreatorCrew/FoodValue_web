import Link from "next/link";
import { Icon } from "@/components/ui/Icon";

interface BackHeaderProps {
  title: string;
  backHref: string; // 뒤로 가기를 눌렀을 때 갈 주소
}

/** 하위 화면(등록, 상세 등)의 헤더: ‹ 제목 */
export function BackHeader({ title, backHref }: BackHeaderProps) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-3 bg-white px-4">
      <Link href={backHref} aria-label="뒤로 가기" className="flex size-[22px] shrink-0 items-center justify-center">
        <Icon name="chevron-left" size={22} />
      </Link>
      <h1 className="min-w-0 flex-1 text-xl font-semibold leading-7 tracking-[-0.5px] text-slate-900">
        {title}
      </h1>
    </header>
  );
}
