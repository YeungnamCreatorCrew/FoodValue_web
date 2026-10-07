import Image from "next/image";

// 피그마에서 내려받은 아이콘 (public/icons/*.svg)
export type IconName =
  | "alert-triangle"
  | "avatar-bg"
  | "bell"
  | "chevron-left"
  | "image-off"
  | "nav-community"
  | "nav-fridge-active"
  | "nav-home"
  | "nav-price"
  | "nav-recipe"
  | "plus"
  | "scan-line"
  | "search";

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
