import { PostEditor } from "@/components/community/post-form";

export default async function CommunityEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PostEditor id={Number(id)} />;
}
