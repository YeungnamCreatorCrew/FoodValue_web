import Image from "next/image";

const dimensions = {
  chevron: 14, refrigerator: 22, comment: 11, avatar: 32,
  home: 20, fridge: 20, prices: 20, recipes: 20, community: 20,
  "dot-active": 6, dot: 6,
} as const;

export function FigmaIcon({ name }: { name: keyof typeof dimensions }) {
  const size = dimensions[name];
  const nativeSize = name === "chevron" || name === "refrigerator" ? 24 : size;
  return (
    <span aria-hidden="true" className="inline-flex shrink-0 items-center justify-center" style={{ width: size, height: size }}>
      <Image src={`/figma/home/${name}.svg`} alt="" width={nativeSize} height={nativeSize} unoptimized
        className="max-w-none shrink-0" style={nativeSize === size ? undefined : { transform: `scale(${size / nativeSize})` }} />
    </span>
  );
}
