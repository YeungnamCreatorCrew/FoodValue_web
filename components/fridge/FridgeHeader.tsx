import { Icon } from "@/components/ui/Icon";

// TODO: 알림과 프로필은 마이페이지(친구 담당)와 연결할 때 실제 값·링크로 바꾼다. 지금은 모양만.
export function FridgeHeader() {
  return (
    <header className="flex h-14 shrink-0 items-center gap-3 bg-white px-5">
      <h1 className="flex-1 text-xl font-semibold leading-7 tracking-[-0.5px] text-primary">
        내 냉장고
      </h1>
      <button type="button" aria-label="알림" className="flex size-5 items-center justify-center">
        <Icon name="bell" size={20} />
      </button>
      <div className="relative size-8">
        <Icon name="avatar-bg" size={32} className="absolute inset-0" />
        <span className="absolute inset-0 flex items-center justify-center text-base leading-none text-slate-900">
          CN
        </span>
      </div>
    </header>
  );
}
