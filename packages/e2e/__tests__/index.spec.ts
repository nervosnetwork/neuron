import {_electron as electron, ElectronApplication, Page} from "playwright";
import {test, expect} from "@playwright/test";

let electronApp: ElectronApplication;
const {exec} = require('child_process');
const path = require('path');


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
  const appName = await electronApp.evaluate(async ({app}) => {
    // This runs in Electron's main process, parameter here is always
    // the result of the require('electron') in the main app script.
    return app.name;
  });
  console.log('应用名称:', appName);

  page = await electronApp.firstWindow();
  console.log("window title" + await page.title());

  await page.screenshot({path: "./test-results/intro.png"});

  const title = await page.title();
  expect(title).toBe("Neuron");


  await page.waitForSelector('text="总览"');
});

test("Create Wallet", async () => {
  let createWallet = await page.getByText('钱包 1').isVisible();
  if (!createWallet) {
    await page.getByLabel("导入助记词").click();
    await page.locator("div").filter({hasText: /^1$/}).getByRole("textbox").click();
    await page.locator("div").filter({hasText: /^1$/}).getByRole("textbox").fill("verb");
    await page.locator("div").filter({hasText: /^2$/}).getByRole("textbox").click();
    await page.locator("div").filter({hasText: /^2$/}).getByRole("textbox").fill("prize");
    await page.locator("div").filter({hasText: /^3$/}).getByRole("textbox").click();
    await page.locator("div").filter({hasText: /^3$/}).getByRole("textbox").fill("broken");
    await page.locator("div").filter({hasText: /^4$/}).getByRole("textbox").click();
    await page.locator("div").filter({hasText: /^4$/}).getByRole("textbox").fill("tobacco");
    await page.locator("div").filter({hasText: /^5$/}).getByRole("textbox").click();
    await page.locator("div").filter({hasText: /^5$/}).getByRole("textbox").fill("plate");
    await page.locator("div").filter({hasText: /^6$/}).getByRole("textbox").click();
    await page.locator("div").filter({hasText: /^6$/}).getByRole("textbox").fill("suspect");
    await page.locator("div").filter({hasText: /^7$/}).getByRole("textbox").click();
    await page.locator("div").filter({hasText: /^7$/}).getByRole("textbox").fill("flip");
    await page.locator("div").filter({hasText: /^8$/}).getByRole("textbox").click();
    await page.locator("div").filter({hasText: /^8$/}).getByRole("textbox").fill("surface");
    await page.locator("div").filter({hasText: /^9$/}).getByRole("textbox").click();
    await page.locator("div").filter({hasText: /^9$/}).getByRole("textbox").fill("circle");
    await page.locator("div").filter({hasText: /^10$/}).getByRole("textbox").click();
    await page.locator("div").filter({hasText: /^10$/}).getByRole("textbox").fill("light");
    await page.locator("div").filter({hasText: /^11$/}).getByRole("textbox").click();
    await page.locator("div").filter({hasText: /^11$/}).getByRole("textbox").fill("portion");
    await page.locator("div").filter({hasText: /^12$/}).getByRole("textbox").click();
    await page.locator("div").filter({hasText: /^12$/}).getByRole("textbox").fill("hero");
    await page.getByLabel("下一步").click();
    await page.getByPlaceholder("请设置一个强密码用于保护您的钱包").fill("Aa111111");
    await page.getByPlaceholder("重复密码").click();
    await page.getByPlaceholder("重复密码").fill("Aa111111");
    await page.getByLabel("完成创建").click();
    await page.screenshot({path: "./test-results/createWallet.png"});
  } else {
    console.log('钱包已创建！')
  }
});

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
  test("one cell consume", async () => {
    await page.waitForTimeout(10000);
    await page.getByTitle('总览').click();
    await page.locator('//!*[@id="root"]/div/div/div[2]/div[1]/div/div[1]/div[2]/button[3]').click();
    await expect(page.getByTitle('Cell管理')).toBeVisible();
    await page.locator('//!*[@id="root"]/div/div/div[2]/div[1]/div/table/tbody/tr[2]/td[1]/label/span').click();
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
  await page.locator('//!*[@id="root"]/div/div/div[2]/div/dialog/div[2]/div/div[2]/div[2]/div').click();
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
  await page.getByTitle('实验性功能').click();
  await page.getByTitle('自定义资产').click();
  let result=await page.getByRole('button', {name: '领取'}).first().isDisabled();
  if (!result){
    await page.getByRole('button', {name: '领取'}).first().click();
    await page.locator('id=accountName').fill('ac1');
    await page.getByRole('button', {name: '确认'}).click();
    await page.locator("id=password").fill('Aa111111');
    await page.getByRole('button', {name: '确认'}).click();
  }

});


});


test.describe('menu', () => {
  test("单签", async () => {
// AppleScript 文件的路径
    const scriptPath = path.resolve('/Users/chllp/Desktop/','singleSign.scpt');

    exec(`osascript ${scriptPath}`, (error:any, stdout:any, stderr:any) => {
      if (error) {
        console.error(`执行错误: ${error.message}`);
        return;
      }
      if (stderr) {
        console.error(`stderr: ${stderr}`);
        return;
      }
      console.log(`stdout: ${stdout}`);
    });
    await expect(page.getByText('签名/验签信息')).toBeVisible();
    await page.getByPlaceholder('请输入信息').fill('just a test');
    await page.getByPlaceholder('请输入或选择地址').click();
    await page.locator('.signAndVerify_wrap__c3LFQ').first().click();
    await page.getByRole('button', {name: '签名'}).click();
    await expect(page.getByText('签名')).toBeVisible();
    await page.getByPlaceholder("输入密码").fill('Aa111111');
    await page.getByRole('button', {name: '确认'}).click();
    await page.getByRole('button', {name: '验证'}).click();
    await expect(page.locator('.toast_content__U4vEI')).toHaveText('验证成功');

  });


/*test("多签", async () => {
  await page.getByTitle('多签地址').isVisible();
/!*    await page.getByRole('button', {name: '创建'}).click();
  await page.getByPlaceholder('输入m的数值(1-255)').fill('1');
  await page.getByPlaceholder('输入n的数值(1-255)').fill('2');*!/
  //解决地址只能用一次问题--todo
/!*  await page.locator('id=0_address').fill('ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsqdujss6wxctltkx6ep027q8p7em04yghysmy4rlq');
  await page.locator('id=1_address').fill('ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsqws75yet4agaph4ry44hh3lr80e6fz3rtqmcf2td');
  await page.getByRole('button', {name: '生成地址'}).click();
  await page.getByRole('button', {name: '确认'}).click();*!/
  await page.waitForSelector('div.multisigAddress_hoverBtn__Ra5xG');
  await page.locator('div.multisigAddress_hoverBtn__Ra5xG').click();
  await page.getByRole('button', {name: '详情'}).click();
  await page.getByTitle('多签地址详情').isVisible();
  await page.getByRole('button', {name: '确定'}).click();
  await page.getByRole('button', {name: '转账'}).click();
  await page.getByTitle('多签地址转账').isVisible();
  await page.locator('id=address').fill('ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsqd54pah0drq8tpe0w6lkqry8x03ss8ac9gxp7edv');
  await page.locator('id=amount').fill('102');
  await page.getByRole('button', {name: '发送'}).click();
  await page.locator("id=password").fill('Aa111111');
  await page.getByRole('button', {name: '确认'}).click();
  await page.on('dialog', dialog => dialog.accept());
  await page.getByRole("button", {name: '确定'}).click();


});
//操作不同的本地json文件，签名前需导出新的json文件
  test("离线签", async () => {


  });

  test("广播交易", async () => {


  });*/
});

test.describe('hard wallet', () => {
  test("创建硬件钱包", async () => {
    let createHardwallet = await page.getByText('LN-test').isVisible();
    if (!createHardwallet) {
      const scriptPath = path.resolve('/Users/chllp/Desktop/', 'hardWallet.scpt');

// 执行 AppleScript
      exec(`osascript ${scriptPath}`, (error:any, stdout:any, stderr:any) => {
        if (error) {
          console.error(`执行错误: ${error.message}`);
          return;
        }
        if (stderr) {
          console.error(`stderr: ${stderr}`);
          return;
        }
        console.log(`stdout: ${stdout}`);
      });
      await page.getByRole('button', {name: '其他型号'}).click();
      await page.getByRole('button', {name: '下一步'}).click();
      await page.locator('.button_button__wmqYv').click();
      await page.locator("id=wallet-name").fill('LN-test');
      await page.getByRole('button', {name: '完成创建'}).click();
    } else {
      console.log('钱包已创建！');
    }

  });


  test("收款", async () => {
    await page.getByRole('button', {name: '收款'}).click();
    await page.getByRole('button', {name: '验证地址'}).click();
    await expect(page.getByText('地址验证通过')).toBeVisible();
    await page.getByRole('button', {name: '取消'}).click();

  });

  test("转账", async () => {
    await page.getByRole('button', {name: '转账'}).click();
    await page.locator("id=address").fill("ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsqw539axnad36dwf45je32w7su70pqp8g6qh7r60q");
    await page.locator("id=amount").fill("106");
    await page.getByRole('button', {name: '发送'}).click();
    await page.locator('//*[@id="root"]/dialog/div[3]/form/button[2]').click();
    await expect(page.getByText('已连接，等待确认...')).toBeVisible();
  });


});


/*  test("change  to light node ", async () => {
    await page.getByTitle('设置').click();
    await page.locator('[value="light_client_testnet"]').check();
  });*/












