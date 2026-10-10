// Pages are owned by their feature branches. Keep destinations in one place.
export const homeRoutes = {
  home: "/",
  login: "/auth/login",
  mypage: "/mypage",
  fridge: "/fridge",
  prices: "/prices",
  recipes: "/recipes",
  community: "/community",
  post: (id: number) => `/community/${id}`,
} as const;
