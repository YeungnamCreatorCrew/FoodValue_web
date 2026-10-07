// Run against `npm run dev`. Supply PLAYWRIGHT_MODULE when using an external
// Playwright installation. Screenshots are written to ignored node_modules output.
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
page.on("dialog", (dialog) => dialog.accept());
const backendCalls = [];
page.on("request", (request) => { if (request.url().includes("/api/v1/")) backendCalls.push(request.url()); });
const base = process.env.BASE_URL || "http://127.0.0.1:3000";
await mkdir("node_modules/.cache/community-qa", { recursive: true });

async function checkLayout(name) {
  await page.evaluate(() => document.fonts.ready);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true, `${name}: horizontal overflow`);
  assert.equal(await page.locator(".cm-shell").evaluate((element) => document.fonts.check(`14px ${getComputedStyle(element).fontFamily.split(",")[0]}`)), true, "font loaded");
  await page.locator("img").evaluateAll((images) => Promise.all(images.map((image) => image.decode())));
  await page.screenshot({ path: `node_modules/.cache/community-qa/${name}.png`, fullPage: true });
}

try {
  await page.goto(`${base}/community`);
  await page.getByRole("heading", { name: "대파전 만들어봤어요", exact: true }).waitFor();
  await checkLayout("list-390");
  assert.equal(await page.locator(".cm-card").count(), 5);
  await page.getByRole("button", { name: "다음", exact: true }).click();
  assert.equal(await page.locator(".cm-card").count(), 1);
  await page.getByRole("searchbox").fill("간장에 식초"); // Full content, beyond preview.
  assert.equal(await page.locator(".cm-card").count(), 1);
  await page.getByRole("searchbox").fill("검색결과없음123");
  await page.getByRole("heading", { name: "검색 결과가 없어요" }).waitFor();
  await page.getByRole("button", { name: "검색 초기화" }).click();
  await page.getByRole("button", { name: "요리 자랑", exact: true }).click();
  assert.equal(await page.locator(".cm-card").count(), 2);
  assert.equal(await page.locator(".cm-image-placeholder").count(), 1);
  assert.equal(await page.locator('.cm-card img[src*="fried-rice"]').count(), 0);
  await checkLayout("showoff-390");
  await page.getByRole("link").filter({ has: page.getByRole("heading", { name: "남은 채소로 만든 볶음밥", exact: true }) }).click();
  await page.locator(".cm-detail-image").waitFor();
  assert.equal(await page.locator(".cm-bottom-nav").count(), 0);
  await checkLayout("detail-390");
  await page.getByRole("textbox", { name: "댓글 내용", exact: true }).fill("검수 댓글");
  await page.getByRole("button", { name: "등록", exact: true }).click();
  const comment = page.locator(".cm-comment").filter({ hasText: "검수 댓글" });
  await comment.getByRole("button", { name: "수정", exact: true }).click();
  await page.getByRole("textbox", { name: "댓글 수정 내용" }).fill("수정된 검수 댓글");
  await page.getByRole("button", { name: "수정 완료", exact: true }).click();
  await page.locator(".cm-comment").filter({ hasText: "수정된 검수 댓글" }).getByRole("button", { name: "삭제", exact: true }).click();
  assert.equal(await page.locator(".cm-comment").count(), 1);
  await page.getByRole("link", { name: "뒤로가기" }).click();
  await page.getByRole("link", { name: "+ 글쓰기", exact: true }).click();
  await page.getByRole("heading", { name: "글쓰기", exact: true }).waitFor();
  assert.equal(await page.locator(".cm-bottom-nav").count(), 0);
  await checkLayout("write-390");
  await page.getByLabel("제목", { exact: true }).fill("검수용 게시글");
  await page.getByLabel("내용", { exact: true }).fill("카테고리를 바꾸어도 입력한 내용이 유지됩니다.\n" + "긴본문".repeat(30));
  await page.getByLabel("게시판 카테고리").selectOption("GROUP_BUY");
  assert.equal(await page.getByLabel("제목", { exact: true }).inputValue(), "검수용 게시글");
  const file = page.getByLabel("이미지 파일 선택");
  await file.setInputFiles({ name: "bad.txt", mimeType: "text/plain", buffer: Buffer.from("not an image") });
  await page.getByRole("alert").filter({ hasText: "PNG, JPEG, GIF, WEBP" }).waitFor();
  await file.setInputFiles({ name: "large.png", mimeType: "image/png", buffer: Buffer.alloc(5 * 1024 * 1024 + 1) });
  await page.getByRole("alert").filter({ hasText: "5MB" }).waitFor();
  await file.setInputFiles("public/community/fried-rice.png");
  await page.getByRole("button", { name: "사진 1 제거" }).waitFor();
  await checkLayout("write-image-390");
  await page.getByRole("button", { name: "사진 1 제거" }).click();
  assert.equal(await page.locator(".cm-image-preview").count(), 0);
  await file.setInputFiles("public/community/fried-rice.png");
  await page.getByRole("button", { name: "사진 1 제거" }).waitFor();
  await page.getByRole("button", { name: "등록하기", exact: true }).click();
  await page.getByRole("heading", { name: "검수용 게시글", exact: true }).waitFor();
  assert.equal(await page.locator(".cm-detail-image").count(), 1);
  await page.getByRole("link", { name: "수정", exact: true }).click();
  assert.equal(await page.getByLabel("제목", { exact: true }).inputValue(), "검수용 게시글");
  assert.equal(await page.locator(".cm-image-preview").count(), 1);
  await page.getByLabel("제목", { exact: true }).fill("수정된 게시글");
  await checkLayout("edit-390");
  await page.getByRole("button", { name: "수정 완료", exact: true }).click();
  await page.getByRole("heading", { name: "수정된 게시글", exact: true }).waitFor();
  await page.getByRole("button", { name: "삭제", exact: true }).click();
  await page.getByRole("heading", { name: "커뮤니티", exact: true }).waitFor();
  await page.getByRole("button", { name: "소분 모집", exact: true }).click();
  assert.equal(await page.locator(".cm-card").count(), 3);
  await page.goto(`${base}/community/5`);
  assert.equal(await page.getByRole("link", { name: "수정", exact: true }).count(), 0);
  await page.goto(`${base}/community/5/edit`);
  await page.getByRole("heading", { name: "작성자만 수정할 수 있어요" }).waitFor();
  await page.goto(`${base}/community/999999`);
  await page.getByRole("heading", { name: "게시글을 찾을 수 없어요" }).waitFor();
  for (const width of [320, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(`${base}/community`);
    await checkLayout(`list-${width}`);
    await page.goto(`${base}/community/write`);
    await checkLayout(`write-${width}`);
  }
  assert.deepEqual(errors, [], "browser runtime errors");
  assert.deepEqual(backendCalls, [], "unexpected backend requests");
  console.log("PASS: list/search/filter/pagination, post CRUD, comment CRUD, ownership, images/validation, missing posts, 320/390/1440px overflow, fonts, no backend calls.");
} finally {
  await browser.close();
}
