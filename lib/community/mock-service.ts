import { currentUser, initialComments, initialPosts } from "./mock-data";
import { categories, COMMENT_LIMIT, CONTENT_LIMIT } from "./types";
import type { Category, Comment, PostDetail, PostInput, PostListItem } from "./types";

type Snapshot = { posts: PostDetail[]; comments: Comment[] };
const initialSnapshot: Snapshot = { posts: initialPosts, comments: initialComments };
let snapshot = initialSnapshot;
const listeners = new Set<() => void>();
let nextPostId = initialPosts.length + 1;
let nextCommentId = initialComments.length + 1;

function publish(next: Snapshot) {
  snapshot = next;
  listeners.forEach((listener) => listener());
}

function ownPost(id: number) {
  const post = snapshot.posts.find((post) => post.id === id);
  if (!post) throw new Error("게시글을 찾을 수 없습니다.");
  if (post.author.id !== currentUser.id) throw new Error("작성자만 변경할 수 있습니다.");
  return post;
}

function ownComment(id: number) {
  const comment = snapshot.comments.find((comment) => comment.id === id);
  if (!comment || comment.userId !== currentUser.id) throw new Error("작성자만 변경할 수 있습니다.");
  return comment;
}

function validatePost(input: PostInput) {
  if (!(input.category in categories)) throw new Error("게시판을 선택해주세요.");
  if (!input.title.trim() || !input.content.trim()) throw new Error("제목과 내용을 입력해주세요.");
  if (input.content.length > CONTENT_LIMIT) throw new Error("본문은 10,000자까지 입력할 수 있습니다.");
}

function validateComment(content: string) {
  if (!content.trim() || content.length > COMMENT_LIMIT) throw new Error("댓글은 1자 이상 1,000자 이하로 입력해주세요.");
}

// In-memory mock adapter. No HTTP, JWT, local database, or browser storage.
// Replace these operations with the documented /api/v1 endpoints at integration.
export const communityService = {
  subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
  getSnapshot: () => snapshot,
  getServerSnapshot: () => initialSnapshot,
  listPosts(state: Snapshot, query: { category: Category; keyword: string; page: number; size: number }) {
    const keyword = query.keyword.trim().toLocaleLowerCase();
    const filtered = state.posts.filter((post) => post.category === query.category &&
      `${post.title}\n${post.content}`.toLocaleLowerCase().includes(keyword))
      .toSorted((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id - a.id);
    const pageCount = Math.max(1, Math.ceil(filtered.length / query.size));
    const page = Math.min(Math.max(0, query.page), pageCount - 1);
    // Explicit projection keeps image URLs and full content out of list data.
    const items: PostListItem[] = filtered.slice(page * query.size, (page + 1) * query.size).map((post) => ({
      id: post.id, category: post.category, title: post.title,
      contentPreview: post.content.slice(0, 100), author: post.author,
      createdAt: post.createdAt, hasImage: post.imageUrls.length > 0,
      commentCount: state.comments.filter((comment) => comment.postId === post.id).length,
    }));
    return { items, total: filtered.length, page, pageCount };
  },
  createPost(input: PostInput) {
    validatePost(input);
    const now = new Date().toISOString();
    const post: PostDetail = { ...input, title: input.title.trim(), content: input.content.trim(), id: nextPostId++, author: currentUser, createdAt: now, updatedAt: now };
    publish({ ...snapshot, posts: [post, ...snapshot.posts] });
    return post.id;
  },
  updatePost(id: number, input: PostInput) {
    ownPost(id); validatePost(input);
    publish({ ...snapshot, posts: snapshot.posts.map((post) => post.id === id ? { ...post, ...input, title: input.title.trim(), content: input.content.trim(), updatedAt: new Date().toISOString() } : post) });
    return id;
  },
  deletePost(id: number) {
    ownPost(id);
    publish({ posts: snapshot.posts.filter((post) => post.id !== id), comments: snapshot.comments.filter((comment) => comment.postId !== id) });
  },
  createComment(postId: number, content: string) {
    validateComment(content);
    if (!snapshot.posts.some((post) => post.id === postId)) throw new Error("게시글을 찾을 수 없습니다.");
    const now = new Date().toISOString();
    publish({ ...snapshot, comments: [...snapshot.comments, { id: nextCommentId++, postId, userId: currentUser.id, author: currentUser, content: content.trim(), createdAt: now, updatedAt: now }] });
  },
  updateComment(id: number, content: string) {
    ownComment(id); validateComment(content);
    publish({ ...snapshot, comments: snapshot.comments.map((comment) => comment.id === id ? { ...comment, content: content.trim(), updatedAt: new Date().toISOString() } : comment) });
  },
  deleteComment(id: number) {
    ownComment(id);
    publish({ ...snapshot, comments: snapshot.comments.filter((comment) => comment.id !== id) });
  },
};
