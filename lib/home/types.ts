export type HomePriceSummary = {
  itemId: number;
  name: string;
  category: string;
  unit: string;
  imageUrl: string;
  currentPrice: number;
  forecastPrice: number;
  recommendation: "BUY_NOW" | "BUY_LATER" | "HOLD" | "STABLE";
  buyingGuide: string;
};

export type HomeFridgeSummary = {
  ingredientCount: number;
  lowStockCount: number;
};

export type HomeCommunityPost = {
  id: number;
  category: "RECIPE_SHARE" | "GROUP_BUY" | "SHOWOFF";
  title: string;
  nickname: string;
  commentCount: number;
  hasImage: boolean;
  updatedAt: string;
};

export type HomeData = {
  priceDate: string;
  prices: HomePriceSummary[];
  fridge: HomeFridgeSummary | null;
  posts: HomeCommunityPost[];
};

export type HomeUser = { nickname: string } | null;
