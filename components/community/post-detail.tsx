"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { currentUser } from "@/lib/community/mock-data";
import { communityService } from "@/lib/community/mock-service";
import { AppBar, Avatar, Badge, MissingPost, PostDate } from "./ui";
import { useCommunity } from "./use-community";
import { Comments } from "./comments";

export function PostDetail({ id }: { id: number }) {
  const state = useCommunity();
  const router = useRouter();
  const post = state.posts.find((post) => post.id === id);
  if (!post) return <MissingPost />;
  const comments = state.comments.filter((comment) => comment.postId === id);
  return <><AppBar title="게시글" backHref="/community" action={post.author.id === currentUser.id && <div className="cm-actions"><Link href={`/community/${id}/edit`}>수정</Link><button onClick={() => { if (window.confirm("게시글을 삭제할까요? 댓글도 함께 삭제됩니다.")) { communityService.deletePost(id); router.replace("/community"); } }}>삭제</button></div>} />
    <main className="cm-detail-main"><article className="cm-article"><Badge category={post.category} /><h2>{post.title}</h2>
      <div className="cm-author"><Avatar name={post.author.nickname} /><div><strong>{post.author.nickname}</strong><div><PostDate value={post.createdAt} />{post.updatedAt !== post.createdAt && <span> · 수정됨</span>}</div></div></div>
      {post.imageUrls.length > 0 && <div className="cm-detail-images">{post.imageUrls.map((url, index) => <Image key={`${index}-${url.slice(-30)}`} src={url} alt={`${post.title} 첨부 사진 ${index + 1}`} width={716} height={600} className="cm-detail-image" unoptimized />)}</div>}
      <p className="cm-content">{post.content}</p>
    </article><Comments postId={id} comments={comments} /><Link className="cm-return" href="/community">커뮤니티 목록으로 돌아가기 &gt;</Link></main>
  </>;
}
