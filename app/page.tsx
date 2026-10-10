import { HomeScreen } from "@/components/home/home-screen";
import { getMockHomeData, mockHomeUser } from "@/lib/home/mock";

export default async function Home({ searchParams }: PageProps<"/">) {
  const query = await searchParams;
  // UI preview only. This parameter never grants real authentication.
  const user = process.env.NODE_ENV === "development" && query.mockAuth === "member"
    ? mockHomeUser
    : null;

  // API integration boundary: replace mock data with mapped /home and /posts data.
  return <HomeScreen user={user} data={getMockHomeData(user !== null)} />;
}
