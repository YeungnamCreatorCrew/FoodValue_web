export const categories = {
  RECIPE_SHARE: "레시피 공유",
  GROUP_BUY: "소분 모집",
  SHOWOFF: "요리 자랑",
} as const;

export type Category = keyof typeof categories;
export type Author = { id: number; nickname: string };

// UI contracts follow the supplied backend fields. Confirm the author and
// pagination envelope against the actual DTOs when connecting the backend.
export type PostListItem = {
  id: number;
  category: Category;
  title: string;
  contentPreview: string;
  author: Author;
  createdAt: string;
  commentCount: number;
  hasImage: boolean;
};

export type PostDetail = {
  id: number;
  category: Category;
  title: string;
  content: string;
  author: Author;
  createdAt: string;
  updatedAt: string;
  imageUrls: string[];
};

export type Comment = {
  id: number;
  postId: number;
  userId: number;
  author: Author;
  content: string;
  createdAt: string;
  updatedAt: string;
};

export type PostInput = Pick<PostDetail, "category" | "title" | "content" | "imageUrls">;
export const CONTENT_LIMIT = 10_000;
export const COMMENT_LIMIT = 1_000;
export const IMAGE_SIZE_LIMIT = 5 * 1024 * 1024;
export const IMAGE_TYPES = ["image/png", "image/jpeg", "image/gif", "image/webp"];
