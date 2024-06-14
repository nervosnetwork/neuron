import {_electron as electron, ElectronApplication, Page} from "playwright";
import {test, expect} from "@playwright/test";

let electronApp: ElectronApplication;

test.beforeAll(async () => {
  electronApp = await electron.launch({args: ["../../packages/neuron-wallet/dist/main.js"]});
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

/*
test.afterAll(async () => {
  await electronApp.close();
});
*/

test.beforeEach(async () => {
  test.setTimeout(60000);
});


let page: Page;

test("Launch Neuron", async () => {
  const isPackaged = await electronApp.evaluate(async ({app}) => {
    // This runs in Electron's main process, parameter here is always
    // the result of the require('electron') in the main app script.
    return app.isPackaged;
  });

  expect(isPackaged).toBe(false);

  page = await electronApp.firstWindow();
  await page.screenshot({path: "./test-results/intro.png"});

  const title = await page.title();
  expect(title).toBe("Neuron");
});

//first operation will use Create Wallet test
/*test("Create Wallet", async () => {
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
});*/

test.describe('overview page tests', () => {
  test("send transaction", async () => {
    await page.waitForTimeout(40000);
    await page.waitForSelector('.syncStatus_synced__JM5ln');
    await page.getByTitle('总览').click();
    await page.getByRole('button', {name: '转账'}).click();
    await page.locator("id=address").fill("ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsq2glcd40rclyg8zmv6a9uzun0stz5rzp9q4jzxqs");
    await page.locator("id=amount").fill("103");
    await page.getByRole('button', {name: '发送'}).click();
    await page.locator("id=password").fill('Aa111111');
    await page.getByRole('button', {name: '确认'}).click();
    await expect(page.getByText('已提交')).toBeVisible();
    await page.waitForTimeout(5000);
  });


  test("amend transaction ", async () => {
    await page.locator('//*[@id="root"]/div/div/div[2]/div[1]/table/tbody/tr[1]/td[7]').click();
    await page.getByRole('button', {name: '修改'}).click();
    await page.getByTitle('发送').click();
    await page.locator("id=password").fill('Aa111111');
    await page.getByRole('button', {name: '确认'}).click();
    await expect(page.getByText('已提交').first()).toBeVisible();
  });
  test("two cells consumes", async () => {
    await page.waitForTimeout(10000);
    await page.getByTitle('总览').click();
    await page.locator('//*[@id="root"]/div/div/div[2]/div[1]/div/div[1]/div[2]/button[3]').click();
    await expect(page.getByTitle('Cell管理')).toBeVisible();
    await page.locator('//*[@id="root"]/div/div/div[2]/div[1]/div/table/tbody/tr[2]/td[1]/label/span').click();
    // await page.getByLabel('0x2cd04468e9a4c968ca43f404d217ffd86fc5664bf1f2f7574649718939f49807_2').check();
    await page.getByRole('button', {name: '消耗'}).click();
    await page.getByRole('button', {name: '确认'}).click();
    await page.locator("id=address").fill('ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsqt6q3xq73zw456d5me5d3gxpjyqu6wtvvsrvay5z');
    await page.getByRole('button', {name: '发送'}).click();
    await page.locator("id=password").fill('Aa111111');
    await page.getByRole('button', {name: '确认'}).click();
  });

});


// 等待同步进度到100%
test("nervos dao deposit", async () => {
  await page.waitForTimeout(10000);
  await page.getByTitle('Nervos Dao').click();
  await page.getByRole('button', {name: '存入'}).click();
  await page.locator("id=depositValue").fill("104");
  await page.getByRole('button', {name: '继续'}).click();
  await page.locator("id=password").fill('Aa111111');
  await page.getByRole('button',{name: '确认'}).click();
  await page.waitForTimeout(10000);
  await expect(page.getByText('正在存入...', { exact: true })).toBeVisible();
});


test("check transaction history", async () => {
  await page.getByTitle('交易历史').click();
  await page.getByPlaceholder('使用交易哈希、地址或日期(yyyy-mm-dd)进行搜索').fill('2024-05-23');
  let EnterKey = "Enter";
  page.keyboard.press(EnterKey);
  await expect(page.getByText('第 1 至 5 条记录, 共 5 条记录')).toBeVisible();
  await page.getByRole('button', {name: '导出交易历史'}).click();

});
test.describe('实验性功能', () => {
  test("create account in asset accounts", async () => {
    await page.getByTitle('实验性功能').click();
    await page.getByTitle('资产账户').click();
    await page.getByRole('button', {name: '创建资产账户'}).click();
    const tp: number = Date.parse(new Date().toString());
    console.log('时间戳是:'+tp);
    await page.locator("id=accountName").fill("te" + tp);
    await page.getByRole('button', {name: '下一步'}).click();
    await page.locator("id=tokenId").fill("0xb1718e7c0175d8a6428a6ddca708b765803e3131d07c8e0046a94be310f1722b");
    await page.locator("id=tokenName").fill("tk01");
    await page.locator("id=symbol").fill("sy01");
    await page.locator("id=decimal").fill("4");
    await page.getByRole('button', {name: '下一步'}).click();
    await page.locator("id=password").fill("Aa111111");
    await page.getByRole('button', {name: '确认'}).click();
    await page.waitForTimeout(20000);
    await expect(page.getByText('te' + tp, {exact: true})).toBeVisible();
  });


  test("receive ", async () => {
    await page.getByRole('button', {name: '收款'}).first().click();
    await page.locator('//*[@id="root"]/div/div/div[2]/div/dialog/div[2]/div/div[2]/div[2]/div').click();
    await expect(page.getByText('已复制')).toBeVisible();
    await page.locator('//!*[@id="root"]/div/div/div[2]/div/dialog/div[1]//!*[name()="svg"]').click();
  });


test("send ", async () => {
  await page.getByRole('button', {name: '转账'}).first().click();
    await page.locator("id=address").fill("ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsqggcska5fafwdlfw9g0cttk5uzdcvuqj4qqz5d7q");
    await page.locator("id=amount").fill("0.001");
    await page.getByRole('button', {name: '提交'}).click();
    await page.locator("id=password").fill('Aa111111');
    await page.getByRole('button', {name: '确认'}).click();
  });




test("claim in customized page ", async () => {




  });


});


/*  test("change  to light node ", async () => {
    await page.getByTitle('设置').click();
    await page.locator('[value="light_client_testnet"]').check();
  });*/













