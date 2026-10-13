import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { categories, type Category } from "@/lib/community/types";

export function Icon({
  name,
}: {
  name:
    | "back"
    | "close"
    | "image"
    | "search"
    | "comment"
    | "home"
    | "fridge"
    | "price"
    | "recipe"
    | "community";
}) {
  const size =
    name === "back" || name === "close"
      ? 22
      : name === "comment"
        ? 12
        : name === "image" || name === "search"
          ? 24
          : 20;

  return (
    <Image
      className={`cm-icon cm-icon-${name}`}
      src={`/community/${name}.svg`}
      alt=""
      width={size}
      height={size}
      unoptimized
    />
  );
}

export function AppBar({
  title,
  backHref,
  action,
}: {
  title: string;
  backHref?: string;
  action?: ReactNode;
}) {
  return (
    <header className={`cm-appbar ${backHref ? "" : "cm-appbar-main"}`}>
      {backHref && (
        <Link
          href={backHref}
          className="cm-icon-button"
          aria-label="뒤로가기"
        >
          <Icon name="back" />
        </Link>
      )}

      <h1>{title}</h1>

      {action ?? (!backHref && <Avatar name="FV" />)}
    </header>
  );
}

export function Avatar({ name }: { name: string }) {
  return (
    <span className="cm-avatar" aria-hidden="true">
      <Image
        src="/community/avatar.svg"
        alt=""
        width={32}
        height={32}
        unoptimized
      />
      <span>{name === "FV" ? name : name.slice(0, 1)}</span>
    </span>
  );
}

export function Badge({ category }: { category: Category }) {
  return <span className="cm-badge">{categories[category]}</span>;
}

export function PostDate({ value }: { value: string }) {
  return (
    <time dateTime={value}>
      {new Intl.DateTimeFormat("ko-KR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        timeZone: "Asia/Seoul",
      }).format(new Date(value))}
    </time>
  );
}

export function MissingPost({
  forbidden = false,
}: {
  forbidden?: boolean;
}) {
  return (
    <>
      <AppBar title="커뮤니티" backHref="/community" />

      <main className="cm-empty">
        <h2>
          {forbidden
            ? "작성자만 수정할 수 있어요"
            : "게시글을 찾을 수 없어요"}
        </h2>

        <p>
          {forbidden
            ? "내가 작성한 게시글에서 다시 시도해주세요."
            : "삭제되었거나 존재하지 않는 게시글입니다."}
        </p>

        <Link className="cm-primary" href="/community">
          커뮤니티로 돌아가기
        </Link>
      </main>
    </>
  );
}