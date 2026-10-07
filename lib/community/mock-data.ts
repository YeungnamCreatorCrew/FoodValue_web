import type { Author, Comment, PostDetail } from "./types";

export const currentUser: Author = { id: 1, nickname: "오늘도집밥" };
const neighbor: Author = { id: 2, nickname: "대파러버" };
const friend: Author = { id: 3, nickname: "집밥친구" };

const examples: Pick<PostDetail, "category" | "title" | "content" | "imageUrls">[] = [
  { category: "RECIPE_SHARE", title: "대파전 만들어봤어요", content: "오늘 남은 대파로 대파전을 만들어봤어요.\n간단하게 만들어 먹기 좋았습니다.\n\n대파를 길게 썰어 반죽에 넣고, 달군 팬에서 앞뒤로 노릇하게 구워주세요. 간장에 식초를 조금 넣어 곁들이면 더 맛있어요.", imageUrls: [] },
  { category: "GROUP_BUY", title: "양파 같이 나누실 분 구해요", content: "양파를 많이 구매해서 같이 나누실 분을 구합니다.\n자세한 수량과 거래 내용은 본문에 적습니다.\n\n한 망을 샀는데 혼자 먹기에는 많네요. 필요한 양을 댓글로 남겨주세요.", imageUrls: [] },
  { category: "SHOWOFF", title: "오늘 만든 닭볶음탕", content: "오늘 처음 만들어봤는데 생각보다 잘 돼서 올려봅니다.\n감자랑 대파를 넉넉하게 넣었더니 든든한 저녁이 되었어요.", imageUrls: [] },
  { category: "SHOWOFF", title: "남은 채소로 만든 볶음밥", content: "냉장고에 조금씩 남아 있던 채소를 잘게 썰어 볶았어요.\n대파와 달걀을 넣으니 간단하면서도 맛있는 한 끼가 되네요!", imageUrls: ["/community/fried-rice.png"] },
  { category: "RECIPE_SHARE", title: "아침에는 간단한 달걀국", content: "물이 끓으면 대파와 풀어둔 달걀을 넣어주세요.\n국간장으로 간을 맞추면 속 편한 아침 국이 완성돼요.", imageUrls: [] },
  { category: "RECIPE_SHARE", title: "두부를 바삭하게 굽는 작은 팁", content: "두부 표면의 물기를 충분히 닦아낸 다음 구워보세요.\n조금 기다렸다 뒤집으면 겉은 바삭하고 속은 부드러워요.", imageUrls: [] },
  { category: "RECIPE_SHARE", title: "버섯 듬뿍 넣은 한 그릇", content: "버섯과 양파를 볶아 밥 위에 올렸어요.\n마지막에 참기름을 조금 넣으면 향이 좋아요.", imageUrls: [] },
  { category: "RECIPE_SHARE", title: "시금치무침 어렵지 않아요", content: "시금치를 살짝 데쳐 찬물에 헹군 뒤 물기를 짜주세요.\n소금과 참기름, 깨로 조물조물 무치면 끝이에요.", imageUrls: [] },
  { category: "RECIPE_SHARE", title: "양배추로 만드는 따뜻한 수프", content: "양배추와 감자를 푹 끓여 부드러운 수프를 만들었어요.\n쌀쌀한 저녁에 먹기 좋습니다.", imageUrls: [] },
  { category: "GROUP_BUY", title: "감자 한 상자 함께 나눠요", content: "감자를 한 상자 구매했어요.\n함께 나누고 싶은 분은 댓글 남겨주세요.", imageUrls: [] },
  { category: "GROUP_BUY", title: "대파가 넉넉해서 나눕니다", content: "싱싱한 대파가 많이 생겼어요.\n필요한 분과 조금씩 나누고 싶습니다.", imageUrls: [] },
];

export const initialPosts: PostDetail[] = examples.map((post, index) => ({
  ...post,
  id: index + 1,
  author: index < 4 ? currentUser : index % 2 ? neighbor : friend,
  createdAt: new Date(Date.UTC(2026, 9, 7, 0, -index * 60)).toISOString(),
  updatedAt: new Date(Date.UTC(2026, 9, 7, 0, -index * 60)).toISOString(),
}));

export const initialComments: Comment[] = [
  { id: 1, postId: 1, userId: 2, author: neighbor, content: "남은 대파로 저도 만들어봐야겠어요!", createdAt: "2026-10-07T00:10:00Z", updatedAt: "2026-10-07T00:10:00Z" },
  { id: 2, postId: 1, userId: 1, author: currentUser, content: "얇게 부치면 더 바삭해요 :)", createdAt: "2026-10-07T00:20:00Z", updatedAt: "2026-10-07T00:20:00Z" },
  { id: 3, postId: 4, userId: 3, author: friend, content: "정말 맛있어 보여요!", createdAt: "2026-10-07T00:30:00Z", updatedAt: "2026-10-07T00:30:00Z" },
];
