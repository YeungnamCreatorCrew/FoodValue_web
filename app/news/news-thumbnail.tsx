"use client";

import Image from "next/image";
import { useState } from "react";
import styles from "./news.module.css";

export function NewsThumbnail({ src }: { src: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;

  return <Image className={styles.thumbnail} src={src} alt="" width={112} height={72}
    unoptimized loading="lazy" referrerPolicy="no-referrer" onError={() => setFailed(true)} />;
}
