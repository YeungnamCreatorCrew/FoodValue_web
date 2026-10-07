"use client";

import { useRef } from "react";
import { Icon } from "@/components/ui/Icon";

interface ReceiptUploadBoxProps {
  previewUrl: string | null; // 고른 사진 (없으면 안내 상자)
  disabled: boolean; // 인식 중에는 다시 올릴 수 없다
  onPick: (file: File) => void;
}

const ACCEPT = "image/png,image/jpeg"; // 백엔드가 받는 형식 (HEIC는 안 됨)

/** 영수증 사진 상자 + [촬영하기] [앨범에서 선택] */
export function ReceiptUploadBox({ previewUrl, disabled, onPick }: ReceiptUploadBoxProps) {
  const cameraInput = useRef<HTMLInputElement>(null);
  const albumInput = useRef<HTMLInputElement>(null);

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = ""; // 같은 사진을 다시 골라도 반응하게 비운다
    if (file) onPick(file);
  }

  return (
    <div className="flex shrink-0 flex-col gap-2">
      <div className="flex h-[104px] flex-col items-center justify-center gap-1.5 overflow-hidden rounded-[10px] border border-dashed border-slate-300 bg-slate-100">
        {previewUrl ? (
          // 사용자가 방금 고른 사진의 임시 주소(blob)라서 next/image 대신 일반 img를 쓴다
          // eslint-disable-next-line @next/next/no-img-element
          <img src={previewUrl} alt="올린 영수증" className="size-full object-contain" />
        ) : (
          <>
            <div className="flex size-[42px] items-center justify-center rounded-lg border border-slate-200 bg-slate-100">
              <Icon name="image-off" size={22} />
            </div>
            <p className="text-sm leading-6 whitespace-nowrap text-slate-500">
              영수증 전체가 보이도록 올려주세요
            </p>
          </>
        )}
      </div>

      <input
        ref={cameraInput}
        type="file"
        accept={ACCEPT}
        capture="environment"
        onChange={handleChange}
        className="hidden"
        aria-hidden
        tabIndex={-1}
      />
      <input
        ref={albumInput}
        type="file"
        accept={ACCEPT}
        onChange={handleChange}
        className="hidden"
        aria-hidden
        tabIndex={-1}
      />
      <div className="flex gap-2">
        <button
          type="button"
          disabled={disabled}
          onClick={() => cameraInput.current?.click()}
          className="flex h-[34px] min-w-0 flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary text-sm font-medium leading-6 whitespace-nowrap text-primary-foreground hover:bg-primary-hover disabled:opacity-50"
        >
          <Icon name="camera" size={16} />
          촬영하기
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => albumInput.current?.click()}
          className="flex h-[34px] min-w-0 flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white text-sm font-medium leading-6 whitespace-nowrap text-primary disabled:opacity-50"
        >
          <Icon name="upload-cloud" size={16} />
          앨범에서 선택
        </button>
      </div>
    </div>
  );
}
