"use client";

import Link from "next/link";
import { useState } from "react";
import { categories, type Category } from "@/lib/community/types";
import { communityService } from "@/lib/community/mock-service";
import { AppBar, Badge, Icon, PostDate } from "./ui";
import { useCommunity } from "./use-community";

export function PostList() {
  const state = useCommunity();
  const [category, setCategory] = useState<Category>("RECIPE_SHARE");
  const [keyword, setKeyword] = useState("");
  const [page, setPage] = useState(0);
  const result = communityService.listPosts(state, { category, keyword, page, size: 5 });
  const introductions: Record<Category, string> = { RECIPE_SHARE: "맛있는 일상을 함께 나눠요", GROUP_BUY: "이웃과 함께 소분해요", SHOWOFF: "오늘의 요리를 자랑해요" };

  return <>
    <AppBar title="커뮤니티" />
    <main className="cm-list-main">
      <div className="cm-categories" role="group" aria-label="게시판 카테고리">
        {Object.entries(categories).map(([value, label]) => <button key={value} type="button" aria-pressed={category === value} onClick={() => { setCategory(value as Category); setPage(0); }}>{label}</button>)}
      </div>
      <div className="cm-search"><Icon name="search" /><input type="search" aria-label="제목 또는 본문 검색" placeholder="제목이나 내용으로 검색해보세요" value={keyword} onChange={(event) => { setKeyword(event.target.value); setPage(0); }} /></div>
      <div className="cm-list-summary"><p>{introductions[category]}</p><span>최신순 · {result.total}개</span></div>
      {result.items.length ? <ul className="cm-posts">{result.items.map((post) => <li key={post.id}>
        <Link className="cm-card" href={`/community/${post.id}`}>
          {post.hasImage && <div className="cm-image-placeholder"><Icon name="image" /><span>사진 있음</span></div>}
          <div className="cm-card-body"><Badge category={post.category} /><h2>{post.title}</h2><p className="cm-preview">{post.contentPreview}</p><div className="cm-card-meta"><span>{post.author.nickname}</span><PostDate value={post.createdAt} /><span className="cm-comment-count"><Icon name="comment" /><span className="cm-sr-only">댓글 </span>{post.commentCount}</span></div></div>
        </Link>
      </li>)}</ul> : <div className="cm-empty" role="status"><Icon name="search" /><h2>{keyword ? "검색 결과가 없어요" : "아직 게시글이 없어요"}</h2><p>{keyword ? "다른 검색어로 다시 찾아보세요." : "첫 번째 이야기를 들려주세요."}</p>{keyword && <button className="cm-text-button" onClick={() => { setKeyword(""); setPage(0); }}>검색 초기화</button>}</div>}
      <nav className="cm-pagination" aria-label="게시글 페이지"><button disabled={result.page === 0} onClick={() => setPage(result.page - 1)}>이전</button><span aria-live="polite">{result.page + 1} / {result.pageCount}</span><button disabled={result.page + 1 >= result.pageCount} onClick={() => { setPage(result.page + 1); window.scrollTo({ top: 0 }); }}>다음</button></nav>
    </main>
    <div className="cm-write-position"><Link className="cm-write-link" href="/community/write">+ 글쓰기</Link></div>
  </>;
}
