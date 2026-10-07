import Image from "next/image";

// 피그마에서 내려받은 아이콘 (public/icons/*.svg)
export type IconName =
  | "activity"
  | "alert-triangle"
  | "avatar-bg"
  | "bell"
  | "book-open"
  | "bookmark"
  | "camera"
  | "check"
  | "chevron-left"
  | "circle-alert"
  | "image-off"
  | "info"
  | "line-chart"
  | "list-checks"
  | "nav-community"
  | "nav-fridge"
  | "nav-fridge-active"
  | "nav-home"
  | "nav-price"
  | "nav-recipe"
  | "nav-recipe-active"
  | "pencil"
  | "plus"
  | "receipt"
  | "scan-line"
  | "search"
  | "upload-cloud"
  | "utensils";

interface IconProps {
  name: IconName;
  size: number; // px
  className?: string;
}

export function Icon({ name, size, className }: IconProps) {
  return (
    <Image
      src={`/icons/${name}.svg`}
      alt=""
      width={size}
      height={size}
      className={className}
      aria-hidden
    />
  );
}
