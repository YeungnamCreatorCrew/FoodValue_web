import { PostDetail } from "@/components/community/post-detail";

export default async function CommunityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PostDetail id={Number(id)} />;
}
