import { IMAGE_SIZE_LIMIT, IMAGE_TYPES } from "./types";

// Future adapter: POST /api/v1/images (multipart file), return its uploaded URL.
// Data URLs keep the mock preview usable across client navigation, without upload.
export function prepareMockImage(file: File): Promise<string> {
  if (!IMAGE_TYPES.includes(file.type)) return Promise.reject(new Error("PNG, JPEG, GIF, WEBP 이미지만 선택해주세요."));
  if (file.size > IMAGE_SIZE_LIMIT) return Promise.reject(new Error("이미지는 파일당 5MB까지 선택할 수 있습니다."));
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("이미지를 읽지 못했습니다. 다시 선택해주세요."));
    reader.onload = () => {
      const url = String(reader.result);
      const image = new Image();
      image.onload = () => resolve(url);
      image.onerror = () => reject(new Error("열 수 없는 이미지입니다. 다른 파일을 선택해주세요."));
      image.src = url;
    };
    reader.readAsDataURL(file);
  });
}
