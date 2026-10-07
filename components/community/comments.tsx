"use client";

import { useState } from "react";
import { currentUser } from "@/lib/community/mock-data";
import { communityService } from "@/lib/community/mock-service";
import { COMMENT_LIMIT, type Comment } from "@/lib/community/types";
import { Avatar, PostDate } from "./ui";

function CommentItem({ comment }: { comment: Comment }) {
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState(comment.content);
  const [error, setError] = useState("");
  return <li className="cm-comment"><Avatar name={comment.author.nickname} /><div className="cm-comment-body"><strong>{comment.author.nickname}</strong>
    {editing ? <form onSubmit={(event) => { event.preventDefault(); try { communityService.updateComment(comment.id, content); setEditing(false); setError(""); } catch (error) { setError((error as Error).message); } }}>
      <textarea className="cm-comment-input" aria-label="댓글 수정 내용" maxLength={COMMENT_LIMIT} value={content} onChange={(event) => setContent(event.target.value)} required autoFocus />
      <div className="cm-form-meta"><span>{content.length} / 1,000</span><div className="cm-actions"><button type="button" onClick={() => { setEditing(false); setError(""); }}>취소</button><button className="cm-text-button" disabled={!content.trim()} type="submit">수정 완료</button></div></div>
    </form> : <p>{comment.content}</p>}
    <div className="cm-comment-meta"><PostDate value={comment.createdAt} />{comment.updatedAt !== comment.createdAt && <span>수정됨</span>}
      {comment.userId === currentUser.id && !editing && <div className="cm-actions"><button onClick={() => { setContent(comment.content); setEditing(true); }}>수정</button><button onClick={() => { if (window.confirm("이 댓글을 삭제할까요?")) communityService.deleteComment(comment.id); }}>삭제</button></div>}
    </div>{error && <p className="cm-error" role="alert">{error}</p>}
  </div></li>;
}

export function Comments({ postId, comments }: { postId: number; comments: Comment[] }) {
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  return <section className="cm-comments" aria-labelledby="comments-title"><h2 id="comments-title">댓글 <span>{comments.length}</span></h2>
    {comments.length ? <ul>{comments.map((comment) => <CommentItem key={comment.id} comment={comment} />)}</ul> : <p className="cm-muted">첫 댓글을 남겨보세요.</p>}
    <form onSubmit={(event) => { event.preventDefault(); try { communityService.createComment(postId, content); setContent(""); setError(""); setNotice("댓글이 등록되었습니다."); } catch (error) { setError((error as Error).message); } }}>
      <label className="cm-sr-only" htmlFor="new-comment">댓글 내용</label>
      <div className="cm-comment-composer"><textarea id="new-comment" placeholder="댓글을 입력해주세요" value={content} onChange={(event) => { setContent(event.target.value); setNotice(""); }} maxLength={COMMENT_LIMIT} required rows={2} /><button className="cm-text-button" disabled={!content.trim()} type="submit">등록</button></div>
      <div className="cm-form-meta"><span role="status">{notice}</span><span>{content.length} / 1,000</span></div>{error && <p className="cm-error" role="alert">{error}</p>}
    </form>
  </section>;
}
