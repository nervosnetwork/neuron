import { _electron as electron, ElectronApplication, Page } from "playwright";
import { test, expect } from "@playwright/test";

let electronApp: ElectronApplication;

test.beforeAll(async () => {
  electronApp = await electron.launch({ args: ["../../packages/neuron-wallet/dist/main.js"] });
  electronApp.on("window", async (page) => {
    const filename = page.url()?.split("/").pop();
    console.log(`Window opened: ${filename}`);

    page.on("pageerror", (error) => {
      console.error(error);
    });
    page.on("console", (msg) => {
      console.log(msg.text());
    });
  });
});

test.afterAll(async () => {
  await electronApp.close();
});

let page: Page;

test("Launch Neuron", async () => {
  const isPackaged = await electronApp.evaluate(async ({ app }) => {
    // This runs in Electron's main process, parameter here is always
    // the result of the require('electron') in the main app script.
    return app.isPackaged;
  });

  expect(isPackaged).toBe(false);

  page = await electronApp.firstWindow();
  await page.screenshot({ path: "./test-results/intro.png" });

  const title = await page.title();
  expect(title).toBe("Neuron");
});

test("Create Wallet", async () => {
  await page.getByLabel("导入助记词").click();
  await page.locator("div").filter({ hasText: /^1$/ }).getByRole("textbox").click();
  await page.locator("div").filter({ hasText: /^1$/ }).getByRole("textbox").fill("verb");
  await page.locator("div").filter({ hasText: /^2$/ }).getByRole("textbox").click();
  await page.locator("div").filter({ hasText: /^2$/ }).getByRole("textbox").fill("prize");
  await page.locator("div").filter({ hasText: /^3$/ }).getByRole("textbox").click();
  await page.locator("div").filter({ hasText: /^3$/ }).getByRole("textbox").fill("broken");
  await page.locator("div").filter({ hasText: /^4$/ }).getByRole("textbox").click();
  await page.locator("div").filter({ hasText: /^4$/ }).getByRole("textbox").fill("tobacco");
  await page.locator("div").filter({ hasText: /^5$/ }).getByRole("textbox").click();
  await page.locator("div").filter({ hasText: /^5$/ }).getByRole("textbox").fill("plate");
  await page.locator("div").filter({ hasText: /^6$/ }).getByRole("textbox").click();
  await page.locator("div").filter({ hasText: /^6$/ }).getByRole("textbox").fill("suspect");
  await page.locator("div").filter({ hasText: /^7$/ }).getByRole("textbox").click();
  await page.locator("div").filter({ hasText: /^7$/ }).getByRole("textbox").fill("flip");
  await page.locator("div").filter({ hasText: /^8$/ }).getByRole("textbox").click();
  await page.locator("div").filter({ hasText: /^8$/ }).getByRole("textbox").fill("surface");
  await page.locator("div").filter({ hasText: /^9$/ }).getByRole("textbox").click();
  await page.locator("div").filter({ hasText: /^9$/ }).getByRole("textbox").fill("circle");
  await page.locator("div").filter({ hasText: /^10$/ }).getByRole("textbox").click();
  await page.locator("div").filter({ hasText: /^10$/ }).getByRole("textbox").fill("light");
  await page.locator("div").filter({ hasText: /^11$/ }).getByRole("textbox").click();
  await page.locator("div").filter({ hasText: /^11$/ }).getByRole("textbox").fill("portion");
  await page.locator("div").filter({ hasText: /^12$/ }).getByRole("textbox").click();
  await page.locator("div").filter({ hasText: /^12$/ }).getByRole("textbox").fill("hero");
  await page.getByLabel("下一步").click();
  await page.getByPlaceholder("请设置一个强密码用于保护您的钱包").fill("Aa111111");
  await page.getByPlaceholder("重复密码").click();
  await page.getByPlaceholder("重复密码").fill("Aa111111");
  await page.getByLabel("完成创建").click();
  await page.screenshot({ path: "./test-results/createWallet.png" });
});
