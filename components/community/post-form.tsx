"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { categories, CONTENT_LIMIT, type Category, type PostDetail } from "@/lib/community/types";
import { currentUser } from "@/lib/community/mock-data";
import { communityService } from "@/lib/community/mock-service";
import { prepareMockImage } from "@/lib/community/images";
import { AppBar, Icon, MissingPost } from "./ui";
import { useCommunity } from "./use-community";

function PostForm({ post }: { post?: PostDetail }) {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const [category, setCategory] = useState<Category>(post?.category ?? "RECIPE_SHARE");
  const [title, setTitle] = useState(post?.title ?? "");
  const [content, setContent] = useState(post?.content ?? "");
  const [imageUrls, setImageUrls] = useState<string[]>(post?.imageUrls ?? []);
  const [error, setError] = useState("");
  const [reading, setReading] = useState(false);
  const [saving, setSaving] = useState(false);
  const busy = reading || saving;

  return <><AppBar title={post ? "글 수정" : "글쓰기"} backHref={post ? `/community/${post.id}` : "/community"} />
    <main className="cm-editor-main"><form className="cm-editor" onSubmit={(event) => {
      event.preventDefault(); if (busy) return; setSaving(true); setError("");
      try { const input = { category, title, content, imageUrls }; const id = post ? communityService.updatePost(post.id, input) : communityService.createPost(input); router.push(`/community/${id}`); }
      catch (error) { setError((error as Error).message); setSaving(false); }
    }}>
      <label className="cm-field-label" htmlFor="post-category">게시판 카테고리</label>
      <select id="post-category" value={category} onChange={(event) => setCategory(event.target.value as Category)}>{Object.entries(categories).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
      <label className="cm-sr-only" htmlFor="post-title">제목</label><input className="cm-title-input" id="post-title" placeholder="제목을 입력해주세요" value={title} onChange={(event) => setTitle(event.target.value)} required />
      <label className="cm-sr-only" htmlFor="post-content">내용</label><textarea className="cm-content-input" id="post-content" placeholder="나누고 싶은 이야기를 자유롭게 작성해주세요." value={content} onChange={(event) => setContent(event.target.value)} maxLength={CONTENT_LIMIT} required />
      <div className="cm-form-meta cm-content-counter"><span>{content.length.toLocaleString("ko-KR")} / 10,000</span></div>
      <section className="cm-image-section" aria-labelledby="image-title"><div className="cm-image-heading"><Icon name="image" /><div><h2 id="image-title">사진 추가 <span>· 선택</span></h2><p>PNG, JPEG, GIF, WEBP · 파일당 최대 5MB</p></div></div>
        <input className="cm-sr-only" ref={fileInput} type="file" aria-label="이미지 파일 선택" accept="image/png,image/jpeg,image/gif,image/webp" multiple disabled={busy} onChange={async (event) => {
          const files = Array.from(event.target.files ?? []); event.target.value = ""; if (!files.length) return;
          setReading(true); setError("");
          const results = await Promise.allSettled(files.map(prepareMockImage));
          setImageUrls((urls) => [...urls, ...results.flatMap((result) => result.status === "fulfilled" ? [result.value] : [])]);
          const failures = results.filter((result) => result.status === "rejected");
          if (failures.length) setError(failures.map((failure) => (failure.reason as Error).message).filter((message, index, messages) => messages.indexOf(message) === index).join(" "));
          setReading(false);
        }} />
        <div className="cm-image-previews"><button className="cm-add-image" type="button" disabled={busy} onClick={() => fileInput.current?.click()}><Icon name="image" /><span>{reading ? "읽는 중…" : "+ 사진"}</span></button>{imageUrls.map((url, index) => <div className="cm-image-preview" key={`${index}-${url.slice(-30)}`}><Image src={url} alt={`첨부 사진 ${index + 1} 미리보기`} width={80} height={80} unoptimized /><button type="button" aria-label={`사진 ${index + 1} 제거`} disabled={busy} onClick={() => setImageUrls((urls) => urls.filter((_, position) => position !== index))}>×</button></div>)}</div>
      </section>
      {error && <p className="cm-error" role="alert">{error}</p>}
      <button className="cm-primary cm-submit" type="submit" disabled={busy || !title.trim() || !content.trim()}>{saving ? "반영 중…" : post ? "수정 완료" : "등록하기"}</button>
    </form></main>
  </>;
}

export function PostEditor({ id }: { id?: number }) {
  const state = useCommunity();
  const post = state.posts.find((post) => post.id === id);
  if (id !== undefined && !post) return <MissingPost />;
  if (post && post.author.id !== currentUser.id) return <MissingPost forbidden />;
  return <PostForm key={id ?? "new"} post={post} />;
}
